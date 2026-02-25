import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId, getAccessibleUserIds } from '@/lib/auth';
import { callAI } from '@/lib/ai-client';

export const dynamic = 'force-dynamic';

// POST /api/vault/from-document - AI-extract vault entry from a scanned document
export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const userIds = await getAccessibleUserIds(userId);
    const { documentId } = await request.json();

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    const doc = await prisma.scannedDocument.findFirst({
      where: { id: documentId, userId: { in: userIds } },
    });

    if (!doc) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Build context from document data
    const docContext = {
      senderName: doc.senderName,
      documentType: doc.documentType,
      summary: doc.summary,
      accountNumber: doc.accountNumber,
      sortCode: doc.sortCode,
      bankAccountNumber: doc.bankAccountNumber,
      referenceNumber: doc.referenceNumber,
      rawExtraction: doc.rawExtraction,
    };

    const messages = [
      {
        role: 'system' as const,
        content: `You are an AI assistant that extracts credential and reference information from UK documents to create vault entries.
Given a scanned document's extracted data, suggest a vault entry with these fields:
- title: A clear name for this entry (e.g. "British Gas Account", "Council Tax Ref")
- category: One of: banking, utilities, government, insurance, subscriptions, tax, healthcare, education, housing, transport, other
- username: Any login/username found
- referenceNumber: Any reference, account, or customer number
- accountNumber: Bank account number if found
- sortCode: Sort code if found
- websiteUrl: Relevant website URL
- phoneNumber: Contact phone number
- email: Contact email
- notes: Any other useful extracted info
- tags: Array of relevant tags

Return ONLY valid JSON with these fields. Use null for missing fields.`,
      },
      {
        role: 'user' as const,
        content: `Extract vault entry data from this document:\n${JSON.stringify(docContext)}`,
      },
    ];

    const result = await callAI(messages, { maxTokens: 1000, temperature: 0.3 });
    
    // Parse AI response
    let suggestion: Record<string, any> = {};
    try {
      const content = result.content || '';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        suggestion = JSON.parse(jsonMatch[0]);
      }
    } catch {
      suggestion = {
        title: doc.senderName || 'Document Entry',
        category: 'other',
        referenceNumber: doc.referenceNumber,
        accountNumber: doc.accountNumber,
        sortCode: doc.sortCode,
        notes: doc.summary,
      };
    }

    return NextResponse.json({
      suggestion: {
        title: suggestion.title || doc.senderName || 'Unknown',
        category: suggestion.category || 'other',
        username: suggestion.username || null,
        referenceNumber: suggestion.referenceNumber || doc.referenceNumber || null,
        accountNumber: suggestion.accountNumber || doc.accountNumber || null,
        sortCode: suggestion.sortCode || doc.sortCode || null,
        websiteUrl: suggestion.websiteUrl || null,
        phoneNumber: suggestion.phoneNumber || null,
        email: suggestion.email || null,
        notes: suggestion.notes || doc.summary || null,
        tags: suggestion.tags || [doc.documentType],
      },
      documentId: doc.id,
    });
  } catch (error: any) {
    console.error('[Vault AI Fill] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to extract vault data' }, { status: 500 });
  }
}
