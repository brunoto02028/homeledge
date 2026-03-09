import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId, getAccessibleUserIds } from '@/lib/auth';
import { callAI } from '@/lib/ai-client';
import { matchDocumentToEntity, extractSignalsFromData } from '@/lib/entity-matcher';
import { uploadBuffer } from '@/lib/s3';

export const dynamic = 'force-dynamic';

// POST /api/email/ai-analyze — AI-analyze a single email or batch
export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const body = await request.json();
    const { messageId, accountId, action } = body;
    // action: 'analyze' | 'suggest_reply' | 'categorize_attachments' | 'create_task' | 'batch_analyze'

    if (action === 'suggest_reply') {
      return handleSuggestReply(userId, body);
    }

    if (action === 'create_task') {
      return handleCreateTask(userId, body);
    }

    if (action === 'categorize_attachments') {
      return handleCategorizeAttachments(userId, body);
    }

    if (action === 'batch_analyze') {
      return handleBatchAnalyze(userId, body);
    }

    // Default: analyze single message
    if (!messageId) {
      return NextResponse.json({ error: 'messageId is required' }, { status: 400 });
    }

    const message = await (prisma as any).emailMessage.findFirst({
      where: { id: messageId },
      include: {
        account: { select: { userId: true, email: true } },
        attachments: true,
        folder: { select: { type: true } },
      },
    });

    if (!message || message.account.userId !== userId) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Build context for AI
    const emailContent = `Subject: ${message.subject || '(no subject)'}
From: ${message.fromName || ''} <${message.fromAddress}>
To: ${message.toAddresses?.join(', ')}
Date: ${message.receivedAt}
${message.bodyText || message.snippet || '(no content)'}`;

    const attachmentList = message.attachments?.length > 0
      ? `\nAttachments: ${message.attachments.map((a: any) => `${a.filename} (${a.contentType}, ${(a.size / 1024).toFixed(0)}KB)`).join(', ')}`
      : '';

    const analysisPrompt = `You are an AI email analyst for a UK household/business finance management system called Clarity & Co.
Analyze the following email and provide a structured analysis.

${emailContent}${attachmentList}

Respond with JSON only:
{
  "summary": "Brief 1-2 sentence summary of the email",
  "category": "One of: action_required, billing, legal, government, insurance, banking, personal, newsletter, marketing, notification, fyi, spam",
  "urgency": "One of: high, medium, low",
  "actionRequired": true or false,
  "suggestedTaskTitle": "If action required, suggest a task title, else null",
  "suggestedTaskDescription": "Brief task description if action required, else null",
  "suggestedTaskDueDate": "YYYY-MM-DD if there's a deadline mentioned, else null",
  "attachmentAnalysis": [
    {
      "filename": "attachment filename",
      "type": "One of: bill, invoice, receipt, statement, contract, letter, id_document, tax_document, insurance, other",
      "entityHint": "Company or person name this might be associated with, or null",
      "shouldArchive": true or false,
      "description": "Brief description"
    }
  ],
  "language": "en or pt",
  "sentiment": "positive, neutral, or negative",
  "keyDates": ["YYYY-MM-DD dates mentioned"],
  "financialAmounts": [{ "amount": number, "currency": "GBP", "description": "what it's for" }]
}

No markdown, just raw JSON.`;

    const result = await callAI([{ role: 'user', content: analysisPrompt }], { maxTokens: 2000, temperature: 0.1 });

    let content = (result.content || '{}').trim();
    if (content.startsWith('```json')) content = content.slice(7);
    else if (content.startsWith('```')) content = content.slice(3);
    if (content.endsWith('```')) content = content.slice(0, -3);

    let analysis: any;
    try {
      analysis = JSON.parse(content.trim());
    } catch {
      analysis = { summary: 'Could not analyze email', category: 'fyi', urgency: 'low', actionRequired: false };
    }

    // Update message with AI analysis
    await (prisma as any).emailMessage.update({
      where: { id: messageId },
      data: {
        aiSummary: analysis.summary,
        aiCategory: analysis.category,
      },
    });

    return NextResponse.json({
      success: true,
      analysis,
      messageId,
    });
  } catch (error: any) {
    console.error('[AI Email] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ── Suggest Reply ──────────────────────────────────────────────────────────
async function handleSuggestReply(userId: string, body: any) {
  const { messageId, language = 'auto' } = body;

  const message = await (prisma as any).emailMessage.findFirst({
    where: { id: messageId },
    include: {
      account: { select: { userId: true, email: true, displayName: true } },
    },
  });

  if (!message || message.account.userId !== userId) {
    return NextResponse.json({ error: 'Message not found' }, { status: 404 });
  }

  // Fetch related thread messages for context
  let threadMessages: any[] = [];
  if (message.threadId) {
    threadMessages = await (prisma as any).emailMessage.findMany({
      where: { threadId: message.threadId, id: { not: messageId } },
      orderBy: { receivedAt: 'asc' },
      take: 10,
      select: { subject: true, fromAddress: true, fromName: true, bodyText: true, snippet: true, receivedAt: true },
    });
  } else if (message.inReplyTo) {
    threadMessages = await (prisma as any).emailMessage.findMany({
      where: { OR: [{ messageId: message.inReplyTo }, { inReplyTo: message.messageId }] },
      orderBy: { receivedAt: 'asc' },
      take: 10,
      select: { subject: true, fromAddress: true, fromName: true, bodyText: true, snippet: true, receivedAt: true },
    });
  }

  const threadContext = threadMessages.length > 0
    ? '\n\n--- Related emails in this thread ---\n' + threadMessages.map((m: any) =>
      `From: ${m.fromName || m.fromAddress} (${new Date(m.receivedAt).toLocaleDateString('en-GB')})\n${(m.bodyText || m.snippet || '').substring(0, 500)}`
    ).join('\n---\n')
    : '';

  const langInstruction = language === 'pt'
    ? 'Write the reply in Portuguese (PT-BR).'
    : language === 'en'
      ? 'Write the reply in English.'
      : 'Detect the language of the original email and reply in the same language (Portuguese or English).';

  const replyPrompt = `You are a professional email assistant. Suggest a reply to this email.

My name: ${message.account.displayName || message.account.email}
My email: ${message.account.email}

Email to reply to:
Subject: ${message.subject || '(no subject)'}
From: ${message.fromName || ''} <${message.fromAddress}>
Date: ${message.receivedAt}
${message.bodyText || message.snippet || ''}${threadContext}

${langInstruction}

Provide 2-3 reply options:
1. Professional and formal
2. Friendly and concise
3. Brief acknowledgment (if appropriate)

Respond with JSON:
{
  "replies": [
    { "tone": "formal", "subject": "Re: ...", "body": "full reply text" },
    { "tone": "friendly", "subject": "Re: ...", "body": "full reply text" },
    { "tone": "brief", "subject": "Re: ...", "body": "full reply text" }
  ],
  "detectedLanguage": "en or pt"
}

No markdown, just raw JSON.`;

  const result = await callAI([{ role: 'user', content: replyPrompt }], { maxTokens: 3000, temperature: 0.7 });

  let content = (result.content || '{}').trim();
  if (content.startsWith('```json')) content = content.slice(7);
  else if (content.startsWith('```')) content = content.slice(3);
  if (content.endsWith('```')) content = content.slice(0, -3);

  let suggestions: any;
  try {
    suggestions = JSON.parse(content.trim());
  } catch {
    suggestions = { replies: [], detectedLanguage: 'en' };
  }

  return NextResponse.json({ success: true, suggestions, messageId });
}

// ── Create Task ────────────────────────────────────────────────────────────
async function handleCreateTask(userId: string, body: any) {
  const { messageId, title, description, dueDate, assigneeId, priority = 'medium' } = body;

  if (!title) {
    return NextResponse.json({ error: 'Task title is required' }, { status: 400 });
  }

  // Verify message belongs to user
  if (messageId) {
    const message = await (prisma as any).emailMessage.findFirst({
      where: { id: messageId },
      include: { account: { select: { userId: true } } },
    });
    if (!message || message.account.userId !== userId) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }
  }

  // Create the action/task
  const task = await prisma.action.create({
    data: {
      actionType: 'other',
      title,
      description: description || null,
      status: 'pending',
      priority: priority as any,
      dueDate: dueDate ? new Date(dueDate) : null,
      userId: assigneeId || userId,
      createdBy: userId,
    },
  });

  // Mark the email as having a task created
  if (messageId) {
    await (prisma as any).emailMessage.update({
      where: { id: messageId },
      data: { aiTaskCreated: true },
    });
  }

  return NextResponse.json({ success: true, task });
}

// ── Categorize Attachments ─────────────────────────────────────────────────
async function handleCategorizeAttachments(userId: string, body: any) {
  const { messageId } = body;

  const message = await (prisma as any).emailMessage.findFirst({
    where: { id: messageId },
    include: {
      account: { select: { userId: true } },
      attachments: true,
    },
  });

  if (!message || message.account.userId !== userId) {
    return NextResponse.json({ error: 'Message not found' }, { status: 404 });
  }

  if (!message.attachments || message.attachments.length === 0) {
    return NextResponse.json({ success: true, attachments: [], message: 'No attachments' });
  }

  // Use AI to categorize based on filename and email context
  const prompt = `Categorize these email attachments based on the email context.

Email subject: ${message.subject}
From: ${message.fromName || message.fromAddress}
Email snippet: ${(message.snippet || '').substring(0, 300)}

Attachments:
${message.attachments.map((a: any, i: number) => `${i + 1}. ${a.filename} (${a.contentType}, ${(a.size / 1024).toFixed(0)}KB)`).join('\n')}

For each attachment, respond with JSON:
{
  "attachments": [
    {
      "filename": "...",
      "category": "bill | invoice | receipt | statement | contract | letter | id_document | tax_document | insurance | photo | other",
      "entityHint": "Company/person name this relates to, or null",
      "shouldArchive": true/false,
      "shouldCreateBill": true/false,
      "description": "Brief description"
    }
  ]
}

No markdown, just raw JSON.`;

  const result = await callAI([{ role: 'user', content: prompt }], { maxTokens: 1500, temperature: 0.1 });

  let content = (result.content || '{}').trim();
  if (content.startsWith('```json')) content = content.slice(7);
  else if (content.startsWith('```')) content = content.slice(3);
  if (content.endsWith('```')) content = content.slice(0, -3);

  let categorized: any;
  try {
    categorized = JSON.parse(content.trim());
  } catch {
    categorized = { attachments: [] };
  }

  // Match entities for each attachment
  for (const att of (categorized.attachments || [])) {
    if (att.entityHint) {
      const signals = extractSignalsFromData({ senderName: att.entityHint, rawText: message.subject });
      const match = await matchDocumentToEntity(userId, signals, null);
      att.entityMatch = match.bestMatch || null;
    }
  }

  return NextResponse.json({ success: true, categorized: categorized.attachments || [] });
}

// ── Batch Analyze ──────────────────────────────────────────────────────────
async function handleBatchAnalyze(userId: string, body: any) {
  const { accountId, period, dateFrom, dateTo, reanalyze } = body;
  // period: 'last_day' | 'last_week' | 'last_month' | 'custom'
  // dateFrom/dateTo: ISO strings for custom period

  if (!accountId) {
    return NextResponse.json({ error: 'accountId is required' }, { status: 400 });
  }

  // Calculate date range
  let sinceDate: Date | null = null;
  let untilDate: Date | null = null;
  const now = new Date();

  if (period === 'last_day') {
    sinceDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  } else if (period === 'last_week') {
    sinceDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  } else if (period === 'last_month') {
    sinceDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  } else if (period === 'custom' && dateFrom) {
    sinceDate = new Date(dateFrom);
    if (dateTo) untilDate = new Date(dateTo);
  }

  // Build where clause
  const where: any = {
    accountId,
    account: { userId },
  };

  // Only filter unanalyzed unless reanalyze is set
  if (!reanalyze) {
    where.aiCategory = null;
  }

  // Date filtering
  if (sinceDate || untilDate) {
    where.receivedAt = {};
    if (sinceDate) where.receivedAt.gte = sinceDate;
    if (untilDate) where.receivedAt.lte = untilDate;
  }

  const messages = await (prisma as any).emailMessage.findMany({
    where,
    orderBy: { receivedAt: 'desc' },
    take: 50,
    select: {
      id: true,
      subject: true,
      fromAddress: true,
      fromName: true,
      snippet: true,
      bodyText: true,
      hasAttachments: true,
      receivedAt: true,
      attachments: { select: { id: true, filename: true, contentType: true, size: true } },
    },
  });

  if (messages.length === 0) {
    return NextResponse.json({ success: true, analyzed: 0, message: 'No emails found for this period', results: [], categories: {} });
  }

  // Batch analyze — process in chunks of 10 for better accuracy
  const allAnalyses: any[] = [];
  const CHUNK = 10;

  for (let i = 0; i < messages.length; i += CHUNK) {
    const chunk = messages.slice(i, i + CHUNK);

    const emailList = chunk.map((m: any, idx: number) => {
      const attachStr = m.attachments?.length > 0
        ? `\nAttachments: ${m.attachments.map((a: any) => `${a.filename} (${a.contentType})`).join(', ')}`
        : '';
      return `[${idx + 1}] Subject: ${m.subject || '(no subject)'}\nFrom: ${m.fromName || ''} <${m.fromAddress}>\nDate: ${new Date(m.receivedAt).toLocaleDateString('en-GB')}\nContent: ${(m.bodyText || m.snippet || '').substring(0, 400)}${attachStr}`;
    }).join('\n\n');

    const batchPrompt = `You are an AI email analyst for Clarity & Co, a UK household finance management system.
Analyze these ${chunk.length} emails. For EACH email:
1. Categorize the email content
2. If it has attachments, categorize each attachment (is it a bill, invoice, receipt, statement, etc.)
3. Identify if any attachment is associated with a company/entity
4. Determine urgency and whether action is required

${emailList}

Respond with JSON array:
[
  {
    "index": 1,
    "summary": "Brief 1-line summary",
    "category": "billing | legal | government | insurance | banking | personal | newsletter | marketing | notification | fyi | spam | action_required",
    "urgency": "high | medium | low",
    "actionRequired": true/false,
    "suggestedTaskTitle": "task title or null",
    "financialAmount": null or { "amount": 123.45, "currency": "GBP" },
    "entityHint": "Company/person name or null",
    "attachments": [
      {
        "filename": "...",
        "type": "bill | invoice | receipt | statement | contract | letter | tax_document | insurance | other",
        "entityHint": "Company name or null",
        "shouldArchive": true/false
      }
    ]
  }
]

No markdown, just raw JSON array.`;

    const result = await callAI([{ role: 'user', content: batchPrompt }], { maxTokens: 4000, temperature: 0.1 });

    let content = (result.content || '[]').trim();
    if (content.startsWith('```json')) content = content.slice(7);
    else if (content.startsWith('```')) content = content.slice(3);
    if (content.endsWith('```')) content = content.slice(0, -3);

    let analyses: any[];
    try {
      analyses = JSON.parse(content.trim());
      if (!Array.isArray(analyses)) analyses = [];
    } catch {
      analyses = [];
    }

    // Merge results with correct indices
    for (const analysis of analyses) {
      const localIdx = (analysis.index || 0) - 1;
      const globalIdx = i + localIdx;
      if (localIdx >= 0 && localIdx < chunk.length && globalIdx < messages.length) {
        allAnalyses.push({ ...analysis, globalIndex: globalIdx, messageId: messages[globalIdx].id });
      }
    }
  }

  // Update messages in DB and build category summary
  const categories: Record<string, number> = {};
  const attachmentTypes: Record<string, number> = {};
  let updated = 0;

  for (const analysis of allAnalyses) {
    await (prisma as any).emailMessage.update({
      where: { id: analysis.messageId },
      data: {
        aiSummary: analysis.summary || null,
        aiCategory: analysis.category || 'fyi',
      },
    });
    updated++;

    // Count categories
    const cat = analysis.category || 'fyi';
    categories[cat] = (categories[cat] || 0) + 1;

    // Count attachment types
    for (const att of (analysis.attachments || [])) {
      const t = att.type || 'other';
      attachmentTypes[t] = (attachmentTypes[t] || 0) + 1;
    }
  }

  // Build organized results grouped by category
  const grouped: Record<string, any[]> = {};
  for (const analysis of allAnalyses) {
    const cat = analysis.category || 'fyi';
    if (!grouped[cat]) grouped[cat] = [];
    const msg = messages[analysis.globalIndex];
    grouped[cat].push({
      messageId: msg.id,
      subject: msg.subject,
      from: msg.fromName || msg.fromAddress,
      date: msg.receivedAt,
      summary: analysis.summary,
      urgency: analysis.urgency,
      actionRequired: analysis.actionRequired,
      suggestedTask: analysis.suggestedTaskTitle,
      entityHint: analysis.entityHint,
      financialAmount: analysis.financialAmount,
      attachments: analysis.attachments || [],
    });
  }

  return NextResponse.json({
    success: true,
    analyzed: updated,
    total: messages.length,
    period: period || 'all',
    dateRange: { from: sinceDate?.toISOString() || null, to: untilDate?.toISOString() || null },
    categories,
    attachmentTypes,
    grouped,
    results: allAnalyses,
  });
}
