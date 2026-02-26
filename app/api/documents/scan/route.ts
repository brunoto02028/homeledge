import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserIdOrMobileToken } from '@/lib/auth';
import { matchDocumentToEntity, extractSignalsFromData } from '@/lib/entity-matcher';
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.ABACUSAI_API_KEY,
  baseURL: 'https://routellm.abacus.ai/v1',
});

// UK Document Extractor Prompt
const UK_DOCUMENT_EXTRACTOR_PROMPT = `# SYSTEM ROLE
You are an expert UK Personal Administrative Assistant specialized in digitizing physical mail. Your goal is to analyze images of documents (letters, bills, contracts, fines) and extract structured data for a Household Finance System.

# CONTEXT
The user lives in the UK. Common providers include Council Tax offices, Anglian Water, Thames Water, HMRC, DVLA, British Gas, EDF, SSE, BT, Sky, Virgin Media, NHS, various banks (Barclays, HSBC, Lloyds, NatWest), and insurance companies (Aviva, Direct Line, Admiral).

# EXTRACTION RULES
Analyze the provided image and extract the following fields into a strict JSON format:

1. **sender_name**: The organization or person sending the letter. Look for letterheads, logos, sender addresses.
2. **document_type**: Classify as one of: ["bill", "reminder", "fine", "information", "contract", "tax_return", "check", "other"].
3. **summary**: A 1-sentence summary of what the document is about (e.g., "Council Tax bill for the 2026/2027 period").
4. **action_required**: Boolean. True if the user needs to do something (pay, sign, reply). False if it's just for filing.
5. **suggested_task_title**: If action is required, suggest a task title (e.g., "Pay Council Tax", "Sign Tenancy Agreement", "Reply to HMRC by 15/03").
6. **financial_data**:
   - "amount_due": Float (0.0 if none).
   - "currency": "GBP" (always use GBP for UK documents).
   - "due_date": "YYYY-MM-DD" (or null if not found).
   - "issue_date": "YYYY-MM-DD" (or null if not found).
7. **extracted_details**:
   - "account_number": Any reference/account number found (Council Tax ref, customer number, etc.).
   - "sort_code": If bank sort code is present (format: XX-XX-XX).
   - "bank_account_number": If bank account number is present.
   - "reference_number": Any payment reference, invoice number, etc.
8. **confidence_score**: 0.0 to 1.0 (How readable and clear is the document?).
9. **tags**: Array of relevant tags like ["tax_document", "utility", "government", "insurance", "urgent"].

# HANDLING EDGE CASES
- If the date is in UK format (DD/MM/YYYY), convert it to ISO format (YYYY-MM-DD).
- If the document is handwritten or blurry, lower the confidence_score accordingly.
- If multiple amounts are listed, look for "Total Due", "Amount Payable", "Balance Carried Forward", or "Total Outstanding".
- For Council Tax, extract the band if visible.
- For HMRC documents, always add "tax_document" to tags.
- For utility bills, note the meter readings if visible.

# UK-SPECIFIC IDENTIFIERS
- Council Tax Reference: Usually 8-9 digits
- National Insurance Number: Format AB123456C
- VAT Number: GB followed by 9 digits
- Company Registration: 8 digits
- UTR (Unique Taxpayer Reference): 10 digits

# OUTPUT FORMAT
Return ONLY the raw JSON object. Do not include markdown formatting (no \`\`\`json).

Example output:
{
  "sender_name": "Ipswich Borough Council",
  "document_type": "bill",
  "summary": "Council Tax bill for property at 123 High Street for the 2026/2027 tax year, Band D.",
  "action_required": true,
  "suggested_task_title": "Pay Council Tax - £1,850",
  "financial_data": {
    "amount_due": 1850.00,
    "currency": "GBP",
    "due_date": "2026-04-01",
    "issue_date": "2026-02-15"
  },
  "extracted_details": {
    "account_number": "123456789",
    "sort_code": null,
    "bank_account_number": null,
    "reference_number": "CT/2026/123456"
  },
  "confidence_score": 0.95,
  "tags": ["government", "council_tax", "annual"]
}`;

// Process image or PDF with vision model
async function extractDocumentData(base64File: string, mimeType: string, isPDF: boolean) {
  try {
    // Build the content array based on file type
    const userContent: any[] = [
      { type: 'text', text: 'Analyze this UK document and extract all relevant information.' },
    ];

    if (isPDF) {
      // For PDFs, use the file content type
      userContent.push({
        type: 'file',
        file: {
          filename: 'document.pdf',
          file_data: `data:application/pdf;base64,${base64File}`,
        },
      });
    } else {
      // For images, use image_url
      userContent.push({
        type: 'image_url',
        image_url: {
          url: `data:${mimeType};base64,${base64File}`,
        },
      });
    }

    const response = await client.chat.completions.create({
      model: 'gpt-4o', // Vision-capable model that also handles PDFs
      messages: [
        {
          role: 'system',
          content: UK_DOCUMENT_EXTRACTOR_PROMPT,
        },
        {
          role: 'user',
          content: userContent,
        },
      ],
      max_tokens: 2000,
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content || '{}';
    
    // Clean up response (remove markdown if present)
    let cleanContent = content.trim();
    if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```[\w]*\n?/, '').replace(/```$/, '').trim();
    }
    
    return JSON.parse(cleanContent);
  } catch (error) {
    console.error('Error extracting document data:', error);
    throw error;
  }
}

// POST: Scan a new document
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cloudStoragePath, fileName, fileBase64, mimeType, isPDF, entityId, mobileToken } = body;
    const headerToken = request.headers.get('X-Mobile-Token');
    const userId = await requireUserIdOrMobileToken(mobileToken || headerToken);

    if (!cloudStoragePath || !fileName || !fileBase64) {
      return NextResponse.json(
        { error: 'cloudStoragePath, fileName, and fileBase64 are required' },
        { status: 400 }
      );
    }

    // Create pending document record
    const docData: any = {
      cloudStoragePath,
      fileName,
      userId,
      status: 'pending',
    };
    if (entityId) docData.entityId = entityId;
    const document = await prisma.scannedDocument.create({ data: docData });

    // Extract data using vision model
    const fileType = isPDF ? 'PDF' : 'image';
    console.log(`[DocumentScan] Processing ${fileType}:`, fileName);
    const extractedData = await extractDocumentData(fileBase64, mimeType || 'image/jpeg', isPDF || false);
    console.log('[DocumentScan] Extracted data:', JSON.stringify(extractedData, null, 2));

    // Map document type
    const documentTypeMap: Record<string, string> = {
      'bill': 'bill',
      'reminder': 'reminder',
      'fine': 'fine',
      'information': 'information',
      'contract': 'contract',
      'tax_return': 'tax_return',
      'check': 'check',
    };
    const documentType = documentTypeMap[extractedData.document_type] || 'other';

    // Entity matching — detect which entity this document belongs to
    const signals = extractSignalsFromData({
      senderName: extractedData.sender_name,
      companyNumber: extractedData.extracted_details?.company_number,
      vatNumber: extractedData.extracted_details?.vat_number,
      address: extractedData.extracted_details?.address,
      summary: extractedData.summary,
      rawText: extractedData.summary,
    });
    const entityMatch = await matchDocumentToEntity(userId, signals, entityId || null);
    console.log('[DocumentScan] Entity match:', JSON.stringify(entityMatch, null, 2));

    // Determine final entityId: use auto-assigned if confident, otherwise keep context
    let finalEntityId = entityId || null;
    if (entityMatch.autoAssign && entityMatch.bestMatch) {
      finalEntityId = entityMatch.bestMatch.entityId;
    } else if (entityMatch.needsConfirmation && entityMatch.bestMatch && !entityId) {
      // If no context entity was provided but we have a suggestion, use it tentatively
      finalEntityId = entityMatch.bestMatch.entityId;
    }

    // Update document with extracted data
    const updatedDocument = await prisma.scannedDocument.update({
      where: { id: document.id },
      data: {
        senderName: extractedData.sender_name || null,
        documentType: documentType as any,
        summary: extractedData.summary || null,
        actionRequired: extractedData.action_required || false,
        suggestedTaskTitle: extractedData.suggested_task_title || null,
        amountDue: extractedData.financial_data?.amount_due || null,
        currency: extractedData.financial_data?.currency || 'GBP',
        dueDate: extractedData.financial_data?.due_date ? new Date(extractedData.financial_data.due_date) : null,
        issueDate: extractedData.financial_data?.issue_date ? new Date(extractedData.financial_data.issue_date) : null,
        accountNumber: extractedData.extracted_details?.account_number || null,
        sortCode: extractedData.extracted_details?.sort_code || null,
        bankAccountNumber: extractedData.extracted_details?.bank_account_number || null,
        referenceNumber: extractedData.extracted_details?.reference_number || null,
        confidenceScore: extractedData.confidence_score || null,
        tags: extractedData.tags || [],
        rawExtraction: extractedData,
        entityId: finalEntityId,
        status: extractedData.action_required ? 'action_required' : 'processed',
        processedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      document: updatedDocument,
      extraction: extractedData,
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
    console.error('Error scanning document:', error);
    return NextResponse.json(
      { error: 'Failed to scan document' },
      { status: 500 }
    );
  }
}
