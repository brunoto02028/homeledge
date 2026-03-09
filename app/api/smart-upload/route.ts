import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserIdOrMobileToken } from '@/lib/auth';
import { uploadBuffer } from '@/lib/s3';
import { extractInvoice, checkDoclingHealth } from '@/lib/docling-client';
import { callAI } from '@/lib/ai-client';
import { categorizeTransaction } from '@/lib/categorization-engine';
import { matchDocumentToEntity, extractSignalsFromData } from '@/lib/entity-matcher';

export const dynamic = 'force-dynamic';

// POST /api/smart-upload — Upload file, AI analyze, auto-create bill + scanned document
export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let userId: string;
    let base64String: string;
    let mimeType: string;
    let fileName: string;
    let entityId: string | null = null;
    let isPdf = false;
    let isImage = false;
    let cloudStoragePath: string;

    if (contentType.includes('multipart/form-data')) {
      const mobileToken = request.headers.get('X-Mobile-Token');
      userId = await requireUserIdOrMobileToken(mobileToken);
      const formData = await request.formData();
      const file = formData.get('file') as File;
      entityId = formData.get('entityId') as string | null;
      if (!file) return NextResponse.json({ error: 'File is required' }, { status: 400 });

      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      base64String = buffer.toString('base64');
      mimeType = file.type || 'application/octet-stream';
      fileName = file.name;
      isPdf = mimeType === 'application/pdf' || fileName.toLowerCase().endsWith('.pdf');
      isImage = mimeType.startsWith('image/');

      // Upload to S3/local
      cloudStoragePath = await uploadBuffer(buffer, fileName, mimeType);
    } else {
      // JSON body (from client-side presigned flow)
      const body = await request.json();
      const mobileToken = body.mobileToken || request.headers.get('X-Mobile-Token');
      userId = await requireUserIdOrMobileToken(mobileToken);
      base64String = body.fileBase64;
      mimeType = body.mimeType || 'image/jpeg';
      fileName = body.fileName || 'upload.jpg';
      entityId = body.entityId || null;
      cloudStoragePath = body.cloudStoragePath;
      isPdf = body.isPDF || mimeType === 'application/pdf';
      isImage = mimeType.startsWith('image/');
      if (!base64String) return NextResponse.json({ error: 'fileBase64 is required' }, { status: 400 });
      if (!cloudStoragePath) return NextResponse.json({ error: 'cloudStoragePath is required' }, { status: 400 });
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
          entityRegime = ['limited_company', 'llp', 'partnership'].includes(entity.type)
            ? 'companies_house' : 'hmrc';
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

    const contextNote = entityRegime === 'companies_house'
      ? 'This is a COMPANY bill for Companies House accounting.'
      : 'This is a personal/household bill for HMRC Self Assessment.';

    const extractionPrompt = `You are an expert at reading UK bills, invoices, and receipts.
${contextNote}

Extract the following from this document:
{
  "billName": "Provider or merchant name (e.g. Vodafone, British Gas, Amazon)",
  "amount": total amount as number,
  "currency": "GBP",
  "description": "Brief description of what this is for",
  "suggestedCategory": "One of: ${categoryNames.join(', ')}",
  "frequency": "One of: weekly, monthly, quarterly, yearly, one_time",
  "dueDay": day of month (1-31) or null,
  "isRecurring": true or false,
  "date": "YYYY-MM-DD or null",
  "isPaid": true or false (whether this appears to be already paid),
  "documentType": "One of: bill, invoice, receipt, statement, letter, other",
  "confidence": "high, medium, or low"
}

Respond with raw JSON only. No markdown or code blocks.`;

    // Try Docling for PDFs
    let extractedText = '';
    if (isPdf) {
      try {
        const doclingAvailable = await checkDoclingHealth();
        if (doclingAvailable) {
          const fileBuffer = Buffer.from(base64String, 'base64');
          const docResult = await extractInvoice(fileBuffer, fileName);
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
          { type: 'file', file: { filename: fileName, file_data: `data:${mimeType};base64,${base64String}` } },
        ],
      }];
    }

    let result;
    if (extractedText) {
      result = await callAI(messages, { maxTokens: 2000, temperature: 0.1 });
    } else {
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

    let extracted: any;
    try {
      extracted = JSON.parse(content.trim());
    } catch {
      extracted = { billName: fileName.replace(/\.[^.]+$/, ''), amount: 0, frequency: 'one_time', dueDay: 1 };
    }

    // Match category via engine
    let categoryId: string | null = null;
    let catSource = 'ai_vision';
    try {
      const engineResult = await categorizeTransaction(
        { description: extracted.billName || extracted.description || '', amount: extracted.amount || 0, type: 'debit' },
        { userId, entityId: entityId || undefined, regime: entityRegime, mode: 'smart' }
      );
      if (engineResult.categoryId) {
        categoryId = engineResult.categoryId;
        catSource = engineResult.source;
      }
    } catch { /* fall through */ }

    if (!categoryId && extracted.suggestedCategory) {
      const matched = regimeCategories.find(
        c => c.name.toLowerCase() === extracted.suggestedCategory.toLowerCase()
      );
      if (matched) categoryId = matched.id;
    }

    // Entity matching
    const signals = extractSignalsFromData({
      senderName: extracted.billName,
      rawText: extracted.description,
    });
    const entityMatch = await matchDocumentToEntity(userId, signals, entityId || null);
    let finalEntityId = entityId || null;
    if (entityMatch.autoAssign && entityMatch.bestMatch) {
      finalEntityId = entityMatch.bestMatch.entityId;
    } else if (entityMatch.needsConfirmation && entityMatch.bestMatch && !entityId) {
      finalEntityId = entityMatch.bestMatch.entityId;
    }

    // Auto-create Bill record
    const billData = {
      userId,
      billName: extracted.billName || fileName.replace(/\.[^.]+$/, ''),
      amount: parseFloat(extracted.amount) || 0,
      currency: extracted.currency || 'GBP',
      frequency: extracted.frequency || 'one_time',
      dueDay: parseInt(extracted.dueDay) || new Date().getDate(),
      categoryId,
      entityId: finalEntityId,
      expenseType: extracted.isRecurring ? 'recurring' : 'one_time',
      isActive: true,
    };

    const bill = await (prisma.bill as any).create({
      data: billData,
      include: { category: true },
    });

    // Create ScannedDocument linked to the bill
    const docType = extracted.documentType === 'invoice' ? 'invoice'
      : extracted.documentType === 'receipt' ? 'receipt'
      : extracted.documentType === 'statement' ? 'statement'
      : extracted.documentType === 'letter' ? 'letter'
      : 'bill';

    const scannedDoc = await (prisma as any).scannedDocument.create({
      data: {
        userId,
        entityId: finalEntityId,
        cloudStoragePath,
        isPublic: false,
        fileName,
        senderName: extracted.billName || null,
        documentType: docType,
        summary: extracted.description || null,
        amountDue: parseFloat(extracted.amount) || null,
        currency: extracted.currency || 'GBP',
        dueDate: extracted.date ? new Date(extracted.date) : null,
        issueDate: extracted.date ? new Date(extracted.date) : null,
        status: 'processed',
        confidenceScore: extracted.confidence === 'high' ? 0.95 : extracted.confidence === 'medium' ? 0.75 : 0.5,
        rawExtraction: extracted,
        linkedBillId: bill.id,
        processedAt: new Date(),
      },
    });

    // Log event
    await prisma.event.create({
      data: {
        userId,
        eventType: 'bill.created',
        entityType: 'bill',
        entityId: bill.id,
        payload: { name: billData.billName, amount: billData.amount, frequency: billData.frequency, source: 'smart_upload' },
      },
    });

    return NextResponse.json({
      success: true,
      bill: { ...bill, source: 'smart_upload' },
      document: { id: scannedDoc.id, fileName, cloudStoragePath },
      extracted,
      categorization: { categoryId, source: catSource },
      entity: { entityId: finalEntityId, match: entityMatch },
    });
  } catch (error: any) {
    console.error('[Smart Upload] Error:', error);
    return NextResponse.json({ error: 'Smart upload failed: ' + error.message }, { status: 500 });
  }
}
