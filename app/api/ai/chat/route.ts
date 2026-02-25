import { NextResponse } from 'next/server';
import { requireUserId, getAccessibleUserIds } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { callAI } from '@/lib/ai-client';

const SYSTEM_PROMPTS: Record<string, string> = {
  general: `You are HomeLedger AI, a friendly UK financial assistant for personal and small business finances.
You help users understand their finances, manage bills, track expenses, and handle UK tax obligations.
Keep answers concise, practical, and UK-focused. Use £ for amounts. Reference HMRC rules when relevant.`,

  statements: `You are HomeLedger AI, specializing in bank statement analysis.
Help the user understand their transactions, spending patterns, and categorization.
You can explain what specific transactions are, suggest categories, and identify recurring payments.
Focus on UK banking terminology and practices.`,

  invoices: `You are HomeLedger AI, specializing in invoice and bill analysis.
Help the user understand invoices, track payments, identify overdue items, and manage business expenses.
You know UK VAT rules, invoice requirements, and expense categorization for HMRC Self Assessment.`,

  bills: `You are HomeLedger AI, specializing in UK bills management.
Help with utility bills (gas, electric, water), council tax, TV licence, broadband, mobile, insurance, and subscriptions.
You can compare typical UK costs, suggest savings, explain tariffs, and track payment schedules.`,

  reports: `You are HomeLedger AI, specializing in UK tax reporting and HMRC compliance.
Help with Self Assessment (SA103/SA100), VAT returns, expense categorization for tax purposes.
You know HMRC allowable expenses, tax bands, NI contributions, and filing deadlines.
Reference specific HMRC boxes and categories when discussing tax deductions.`,

  categories: `You are HomeLedger AI, specializing in transaction categorization.
Help the user set up categories aligned with HMRC Self Assessment categories.
Explain which expenses are tax-deductible, how to handle mixed-use expenses, and proper categorization.`,

  documents: `You are HomeLedger AI, specializing in document management and OCR analysis.
Help the user understand scanned documents, extract key information, and organize their paperwork.
Cover UK-specific documents: council tax bills, HMRC letters, utility bills, insurance documents.`,

  vault: `You are HomeLedger AI, helping manage your secure credentials vault.
Help organize login credentials, reference numbers, and important account details.
Remind about security best practices and UK service reference formats (NI number, UTR, council tax ref).`,

  life: `You are HomeLedger AI, your UK life management assistant.
Help with council tax queries, NHS registration, DVLA services, visa/immigration matters, and daily UK life.
Provide practical guidance for living in the UK, including links to official gov.uk services.`,
};

async function fetchSectionContext(userIds: string[], section: string): Promise<string> {
  try {
    switch (section) {
      case 'statements': {
        const [stmtCount, txCount, recentTx] = await Promise.all([
          prisma.bankStatement.count({ where: { userId: { in: userIds } } }),
          prisma.bankTransaction.count({ where: { statement: { userId: { in: userIds } } } }),
          prisma.bankTransaction.findMany({
            where: { statement: { userId: { in: userIds } } },
            orderBy: { date: 'desc' },
            take: 10,
            select: { description: true, amount: true, type: true, date: true, category: { select: { name: true } } },
          }),
        ]);
        return `User has ${stmtCount} statements, ${txCount} transactions. Recent 10: ${JSON.stringify(recentTx.map(t => ({ desc: t.description, amt: t.amount, type: t.type, cat: t.category?.name, date: t.date })))}`;
      }
      case 'invoices': {
        const invoices = await prisma.invoice.findMany({
          where: { userId: { in: userIds } },
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: { providerName: true, amount: true, status: true, invoiceDate: true, category: { select: { name: true } } },
        });
        return `User has ${invoices.length}+ invoices. Recent: ${JSON.stringify(invoices.map(i => ({ provider: i.providerName, amt: i.amount, status: i.status, cat: i.category?.name })))}`;
      }
      case 'bills': {
        const bills = await prisma.bill.findMany({
          where: { userId: { in: userIds }, isActive: true },
          include: { category: { select: { name: true } }, account: { include: { provider: { select: { name: true } } } } },
        });
        const total = bills.reduce((s, b) => s + b.amount, 0);
        return `User has ${bills.length} active bills totalling £${total.toFixed(2)}/period. Bills: ${JSON.stringify(bills.map(b => ({ name: b.billName, amt: b.amount, freq: b.frequency, cat: b.category?.name, provider: b.account?.provider?.name })))}`;
      }
      case 'reports': {
        const [txs, cats] = await Promise.all([
          prisma.bankTransaction.findMany({
            where: { statement: { userId: { in: userIds } } },
            select: { amount: true, type: true, category: { select: { name: true, type: true, hmrcMapping: true } } },
          }),
          prisma.category.findMany({ select: { name: true, type: true, hmrcMapping: true, defaultDeductibilityPercent: true } }),
        ]);
        const income = txs.filter(t => t.type === 'credit').reduce((s, t) => s + Math.abs(t.amount), 0);
        const expenses = txs.filter(t => t.type === 'debit').reduce((s, t) => s + Math.abs(t.amount), 0);
        return `Financial summary: Income £${income.toFixed(0)}, Expenses £${expenses.toFixed(0)}, Net £${(income - expenses).toFixed(0)}. ${txs.length} transactions. Categories: ${JSON.stringify(cats.slice(0, 20).map(c => ({ name: c.name, type: c.type, hmrc: c.hmrcMapping, deduct: c.defaultDeductibilityPercent })))}`;
      }
      case 'categories': {
        const cats = await prisma.category.findMany({
          select: { name: true, type: true, hmrcMapping: true, defaultDeductibilityPercent: true, _count: { select: { bankTransactions: true } } },
        });
        return `Categories: ${JSON.stringify(cats.map(c => ({ name: c.name, type: c.type, hmrc: c.hmrcMapping, deduct: c.defaultDeductibilityPercent, txCount: c._count.bankTransactions })))}`;
      }
      case 'life': {
        const events = await prisma.lifeEvent.findMany({
          where: { userId: { in: userIds } },
          include: { tasks: { select: { title: true, status: true, priority: true } } },
          orderBy: { eventDate: 'desc' },
          take: 5,
        });
        return `Life events: ${JSON.stringify(events.map(e => ({ type: e.eventType, title: e.title, date: e.eventDate, status: e.status, tasks: e.tasks.length })))}`;
      }
      default:
        return '';
    }
  } catch (err) {
    console.error('[AI Context] Error fetching context:', err);
    return '';
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const { messages, context, section = 'general' } = await request.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
    }

    // Build system prompt with live context
    let systemPrompt = SYSTEM_PROMPTS[section] || SYSTEM_PROMPTS.general;
    
    // Fetch live data context for the current section
    const userIds = await getAccessibleUserIds(userId);
    const liveContext = await fetchSectionContext(userIds, section);
    if (liveContext) {
      systemPrompt += `\n\nLive user data:\n${liveContext}`;
    }
    
    if (context) {
      systemPrompt += `\n\nAdditional context:\n${JSON.stringify(context).substring(0, 2000)}`;
    }

    // Prepare messages for unified AI client
    const llmMessages: { role: 'system' | 'user' | 'assistant'; content: string }[] = [
      { role: 'system', content: systemPrompt },
      ...messages.slice(-20).map((m: any) => ({
        role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    const result = await callAI(llmMessages, { maxTokens: 2000, temperature: 0.7 });
    const reply = result.content || 'Sorry, I could not generate a response.';

    // Log AI usage event
    await prisma.event.create({
      data: {
        userId,
        eventType: 'ai.chat',
        entityType: 'AiChat',
        entityId: section,
        payload: {
          section,
          provider: result.provider,
          messageCount: messages.length,
          tokensUsed: result.usage?.total_tokens || result.usage?.totalTokenCount || null,
        },
      },
    }).catch(() => {});

    return NextResponse.json({ reply, usage: result.usage });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[AI Chat] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
