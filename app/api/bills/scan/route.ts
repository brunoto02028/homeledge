import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId } from '@/lib/auth';
import { extractInvoice, checkDoclingHealth } from '@/lib/docling-client';
import { callAI } from '@/lib/ai-client';
import { categorizeTransaction } from '@/lib/categorization-engine';

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const entityId = formData.get('entityId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'File is required' }, { status: 400 });
    }

    // Determine entity regime
    let entityRegime = 'hmrc';
    if (entityId) {
      try {
        const entity = await (prisma as any).entity.findUnique({
          where: { id: entityId },
          select: { type: true },
        });
        if (entity) {
          const companyTypes = ['limited_company', 'llp', 'partnership'];
          entityRegime = companyTypes.includes(entity.type) ? 'companies_house' : 'hmrc';
        }
      } catch { /* default hmrc */ }
    }

    // Fetch regime-appropriate expense categories
    const catWhere: any = entityId
      ? { taxRegime: { in: [entityRegime, 'universal'] }, type: 'expense' }
      : { type: 'expense' };
    const regimeCategories = await prisma.category.findMany({
      where: catWhere,
      select: { id: true, name: true },
    });
    const categoryNames = regimeCategories.map(c => c.name);

    // Convert file
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const base64String = fileBuffer.toString('base64');
    const mimeType = file.type || 'application/pdf';
    const isImage = mimeType.startsWith('image/');
    const isPdf = mimeType === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    // Build extraction prompt
    const contextNote = entityRegime === 'companies_house'
      ? 'This is a COMPANY bill for Companies House accounting.'
      : 'This is a personal/household bill for HMRC Self Assessment.';

    const extractionPrompt = `You are an expert at reading UK bills and receipts.
${contextNote}

Extract the following from this bill/receipt image:
{
  "billName": "Provider or merchant name",
  "amount": total amount as number,
  "currency": "GBP",
  "description": "Brief description of what the bill is for",
  "suggestedCategory": "One of: ${categoryNames.join(', ')}",
  "frequency": "One of: weekly, monthly, quarterly, yearly, one_time",
  "dueDay": day of month (1-31) or null,
  "isRecurring": true or false,
  "date": "YYYY-MM-DD or null",
  "confidence": "high, medium, or low"
}

Respond with raw JSON only. No markdown or code blocks.`;

    // Try Docling first for PDFs
    let extractedText = '';
    if (isPdf) {
      try {
        const doclingAvailable = await checkDoclingHealth();
        if (doclingAvailable) {
          const docResult = await extractInvoice(fileBuffer, file.name);
          if (docResult.success && docResult.plain_text) {
            extractedText = docResult.plain_text;
          }
        }
      } catch { /* fall through to vision */ }
    }

    // Call AI
    let messages: any[];
    if (extractedText) {
      messages = [{ role: 'user', content: extractionPrompt + '\n\nDocument text:\n' + extractedText.substring(0, 8000) }];
    } else if (isImage) {
      messages = [{
        role: 'user',
        content: [
          { type: 'text', text: extractionPrompt },
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64String}` } },
        ],
      }];
    } else {
      messages = [{
        role: 'user',
        content: [
          { type: 'text', text: extractionPrompt },
          { type: 'file', file: { filename: file.name, file_data: `data:${mimeType};base64,${base64String}` } },
        ],
      }];
    }

    // Use Abacus for vision, Gemini for text
    let result;
    if (extractedText) {
      result = await callAI(messages, { maxTokens: 2000, temperature: 0.1 });
    } else {
      // Vision model via Abacus
      const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.ABACUSAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4.1-mini',
          messages,
          max_tokens: 2000,
          response_format: { type: 'json_object' },
        }),
      });
      if (!response.ok) throw new Error(`Vision API error: ${response.status}`);
      const llmResult = await response.json();
      result = { content: llmResult.choices?.[0]?.message?.content || '{}' };
    }

    // Parse AI response
    let content = (result.content || '{}').trim();
    if (content.startsWith('```json')) content = content.slice(7);
    else if (content.startsWith('```')) content = content.slice(3);
    if (content.endsWith('```')) content = content.slice(0, -3);

    let billData: any;
    try {
      billData = JSON.parse(content.trim());
    } catch {
      billData = { error: 'Failed to parse', raw: content };
    }

    // Match category — try engine first, then AI suggestion fallback
    let categoryId = null;
    let catSource = 'ai_vision';
    let catConfidence = billData.confidence === 'high' ? 0.9 : billData.confidence === 'medium' ? 0.7 : 0.5;

    try {
      const engineResult = await categorizeTransaction(
        { description: billData.billName || billData.description || '', amount: billData.amount || 0, type: 'debit' },
        { userId, entityId: entityId || undefined, regime: entityRegime, mode: 'smart' }
      );
      if (engineResult.categoryId) {
        categoryId = engineResult.categoryId;
        catSource = engineResult.source;
        catConfidence = engineResult.confidence;
      }
    } catch { /* fall through to AI suggestion */ }

    // Fallback to AI vision suggestion
    if (!categoryId && billData.suggestedCategory) {
      const matched = regimeCategories.find(
        c => c.name.toLowerCase() === billData.suggestedCategory.toLowerCase()
      );
      if (matched) categoryId = matched.id;
    }

    return NextResponse.json({
      ...billData,
      categoryId,
      categorizationSource: catSource,
      confidenceScore: catConfidence,
      entityId: entityId || null,
      entityRegime,
    });
  } catch (error: any) {
    console.error('Error scanning bill:', error);
    return NextResponse.json({ error: 'Failed to scan bill: ' + error.message }, { status: 500 });
  }
}
