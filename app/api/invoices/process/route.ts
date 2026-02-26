import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId, getAccessibleUserIds } from '@/lib/auth';
import { extractInvoice, checkDoclingHealth } from '@/lib/docling-client';
import { matchDocumentToEntity, extractSignalsFromData } from '@/lib/entity-matcher';

function buildExtractionPrompt(regime: string, categoryNames: string[]): string {
  const categoryList = categoryNames.join(', ');
  const contextNote = regime === 'companies_house'
    ? 'This is a COMPANY invoice/bill for Companies House accounting and Corporation Tax (CT600) purposes.'
    : 'This is a personal/sole trader invoice/bill for HMRC Self Assessment (SA103) purposes.';

  return `You are an expert at extracting data from UK invoices and bills.
${contextNote}

Analyze this invoice/bill document and extract the following information in JSON format:
{
  "providerName": "Company name that issued the invoice",
  "invoiceNumber": "Invoice or reference number",
  "invoiceDate": "YYYY-MM-DD format or null if not found",
  "dueDate": "YYYY-MM-DD format or null if not found",
  "amount": "Total amount as a number (without currency symbol)",
  "currency": "GBP, EUR, USD etc",
  "description": "Brief description of what this invoice is for",
  "suggestedCategory": "One of: ${categoryList}",
  "suggestedExpenseType": "One of: fixed, recurring, variable, one_off",
  "lineItems": [{ "description": "item description", "amount": 0 }],
  "confidence": "high, medium, or low - how confident are you in this extraction"
}

Respond with raw JSON only. Do not include code blocks, markdown, or any other formatting.
If a field cannot be determined, use null.
For UK utilities, the provider name is usually at the top of the bill.
Look for "Amount Due", "Total", "Balance" for the total amount.
Check for account/reference numbers which serve as invoice numbers.`;
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const userIds = await getAccessibleUserIds(userId);
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const invoiceId = formData.get('invoiceId') as string;

    if (!file || !invoiceId) {
      return NextResponse.json(
        { error: 'File and invoiceId are required' },
        { status: 400 }
      );
    }

    // Verify invoice belongs to user
    const existingInvoice = await prisma.invoice.findFirst({ where: { id: invoiceId, userId: { in: userIds } } });
    if (!existingInvoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Determine entity regime for categorization
    let entityRegime = 'hmrc';
    const invoiceEntityId = (existingInvoice as any).entityId;
    if (invoiceEntityId) {
      try {
        const entity = await (prisma as any).entity.findUnique({
          where: { id: invoiceEntityId },
          select: { type: true },
        });
        if (entity) {
          const companyTypes = ['limited_company', 'llp', 'partnership'];
          entityRegime = companyTypes.includes(entity.type) ? 'companies_house' : 'hmrc';
        }
      } catch { /* default hmrc */ }
    }

    // Fetch regime-appropriate categories for AI prompt
    const catWhere: any = entityRegime !== 'hmrc' || invoiceEntityId
      ? { taxRegime: { in: [entityRegime, 'universal'] }, type: 'expense' }
      : { type: 'expense' };
    const regimeCategories = await prisma.category.findMany({ where: catWhere, select: { id: true, name: true } });
    const categoryNames = regimeCategories.map(c => c.name);
    const EXTRACTION_PROMPT = buildExtractionPrompt(entityRegime, categoryNames);
    // Convert file to buffer and base64
    const base64Buffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(base64Buffer);
    const base64String = fileBuffer.toString('base64');

    // Determine file type
    const mimeType = file.type || 'application/pdf';
    const isImage = mimeType.startsWith('image/');
    const isPdf = mimeType === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    // Step 1: Try Docling for text extraction (better OCR for PDFs)
    let doclingText = '';
    if (isPdf) {
      try {
        const doclingAvailable = await checkDoclingHealth();
        if (doclingAvailable) {
          const docResult = await extractInvoice(fileBuffer, file.name);
          if (docResult.success && docResult.plain_text) {
            doclingText = docResult.plain_text;
          }
        }
      } catch (docErr: any) {
        // Docling unavailable, fall through to LLM vision
      }
    }

    // Step 2: Send to LLM for structured extraction
    let messages;
    if (doclingText) {
      // Use Docling-extracted text (more reliable)
      messages = [
        {
          role: 'user',
          content: EXTRACTION_PROMPT + '\n\nDocument text:\n' + doclingText.substring(0, 8000),
        },
      ];
    } else if (isImage) {
      messages = [
        {
          role: 'user',
          content: [
            { type: 'text', text: EXTRACTION_PROMPT },
            {
              type: 'image_url',
              image_url: { url: `data:${mimeType};base64,${base64String}` },
            },
          ],
        },
      ];
    } else {
      messages = [
        {
          role: 'user',
          content: [
            { type: 'text', text: EXTRACTION_PROMPT },
            {
              type: 'file',
              file: {
                filename: file.name,
                file_data: `data:${mimeType};base64,${base64String}`,
              },
            },
          ],
        },
      ];
    }

    // Call LLM API
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

    if (!response.ok) {
      throw new Error(`LLM API error: ${response.status}`);
    }

    const llmResult = await response.json();
    const extractedText = llmResult.choices?.[0]?.message?.content || '{}';
    
    let extractedData: any;
    try {
      extractedData = JSON.parse(extractedText);
    } catch {
      extractedData = { error: 'Failed to parse extraction', raw: extractedText };
    }

    // Find matching category from regime-appropriate set
    let categoryId = null;
    if (extractedData.suggestedCategory) {
      const matchedCat = regimeCategories.find(
        c => c.name.toLowerCase() === extractedData.suggestedCategory.toLowerCase()
      );
      if (matchedCat) {
        categoryId = matchedCat.id;
      } else {
        // Fallback: try partial match
        const category = await prisma.category.findFirst({
          where: { name: { contains: extractedData.suggestedCategory, mode: 'insensitive' } },
        });
        if (category) categoryId = category.id;
      }
    }

    // Entity matching — verify or detect entity from extracted data
    const signals = extractSignalsFromData({
      providerName: extractedData.providerName,
      companyNumber: extractedData.companyNumber,
      vatNumber: extractedData.vatNumber,
      address: extractedData.address,
      rawText: doclingText || extractedData.description,
    });
    const entityMatch = await matchDocumentToEntity(userId, signals, invoiceEntityId || null);
    console.log('[InvoiceProcess] Entity match:', JSON.stringify(entityMatch, null, 2));

    // Determine final entityId
    let finalEntityId = invoiceEntityId || null;
    if (entityMatch.autoAssign && entityMatch.bestMatch) {
      finalEntityId = entityMatch.bestMatch.entityId;
    } else if (entityMatch.needsConfirmation && entityMatch.bestMatch && !invoiceEntityId) {
      finalEntityId = entityMatch.bestMatch.entityId;
    }

    // Update invoice with extracted data — PRESERVE user-edited fields
    // If invoice was already processed/reviewed, only fill in null/empty fields
    const isFirstProcessing = existingInvoice.status === 'pending';
    const inv = existingInvoice as any;

    const updateData: any = {
      status: isFirstProcessing ? 'processed' : existingInvoice.status,
      extractedData, // always store latest AI extraction for reference
      processedAt: new Date(),
    };

    // Only update fields if: (a) first processing, OR (b) field is currently null/empty
    if (isFirstProcessing || !inv.providerName) {
      updateData.providerName = extractedData.providerName || null;
    }
    if (isFirstProcessing || !inv.invoiceNumber) {
      updateData.invoiceNumber = extractedData.invoiceNumber || null;
    }
    if (isFirstProcessing || !inv.invoiceDate) {
      updateData.invoiceDate = extractedData.invoiceDate ? new Date(extractedData.invoiceDate) : null;
    }
    if (isFirstProcessing || !inv.dueDate) {
      updateData.dueDate = extractedData.dueDate ? new Date(extractedData.dueDate) : null;
    }
    if (isFirstProcessing || inv.amount === null || inv.amount === undefined) {
      updateData.amount = extractedData.amount ? parseFloat(extractedData.amount) : null;
    }
    if (isFirstProcessing || !inv.currency) {
      updateData.currency = extractedData.currency || 'GBP';
    }
    if (isFirstProcessing || !inv.categoryId) {
      updateData.categoryId = categoryId;
    }
    if (isFirstProcessing || !inv.expenseType) {
      updateData.expenseType = extractedData.suggestedExpenseType || null;
    }
    if (isFirstProcessing || !inv.description) {
      updateData.description = extractedData.description || null;
    }
    if (isFirstProcessing || !inv.entityId) {
      updateData.entityId = finalEntityId;
    }

    const updatedInvoice = await prisma.invoice.update({
      where: { id: invoiceId },
      data: updateData,
      include: { category: true },
    });

    await prisma.event.create({
      data: {
        userId,
        eventType: 'invoice.processed',
        entityType: 'invoice',
        entityId: invoiceId,
        payload: {
          fileName: updatedInvoice.fileName,
          providerName: extractedData.providerName,
          amount: extractedData.amount,
          confidence: extractedData.confidence,
        },
      },
    });

    return NextResponse.json({
      invoice: updatedInvoice,
      extractedData,
      entityMatch: {
        bestMatch: entityMatch.bestMatch,
        candidates: entityMatch.candidates,
        autoAssign: entityMatch.autoAssign,
        needsConfirmation: entityMatch.needsConfirmation,
        needsManualSelection: entityMatch.needsManualSelection,
        mismatch: entityMatch.mismatch,
      },
    });
  } catch (error) {
    console.error('Error processing invoice:', error);
    
    // Update invoice status to error
    const invoiceId = (await request.formData()).get('invoiceId') as string;
    if (invoiceId) {
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status: 'error',
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        },
      }).catch(console.error);
    }

    return NextResponse.json(
      { error: 'Failed to process invoice' },
      { status: 500 }
    );
  }
}
