import { NextResponse } from 'next/server';
import { requireUserId, getAccessibleUserIds } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { callAI } from '@/lib/ai-client';

const HOMELEDGER_CONTEXT = `
HomeLedger is a UK household finance management app. Key features and navigation:
- **Entities**: Each user can have multiple entities (companies, sole traders, individuals). The entity selector is in the sidebar header and also on individual page headers (Statements, Reports). All data is filtered by the selected entity.
- **Statements**: Upload bank statements (CSV/PDF), view all transactions, categorise them. Tabs: "All Transactions" and "Uncategorised". Click "Click to categorise" on any transaction to assign a category. Use the AI sparkle button for AI-assisted categorisation. Bulk select + categorise multiple transactions at once.
- **Reports**: Financial reports filtered by entity (dropdown at top-right). Choose tax year. Report types: Overview, Profit & Loss, CT600/SA103, VAT Return, Balance Sheet, Transactions, Aged Debtors, Cash Flow, Trial Balance, General Ledger, Tax Breakdown, Company, Budgets, Export All. The entity selector is at the top-right of the Reports page.
- **Categories**: HMRC-aligned categories with deductibility percentages. Smart Rules auto-categorise transactions using 4-layer engine (deterministic rules, pattern matching, AI, feedback loop).
- **Bills**: Track recurring bills, subscriptions, direct debits.
- **Invoices**: Create and manage invoices, track payments.
- **Insurance**: Manage insurance policies (motor, life, home, health).
- **Correspondence**: Track letters and correspondence with entities.
- **Documents (Capture & Classify)**: Scan documents via camera/QR code, AI extracts data.
- **Vault**: Secure credential storage for logins and reference numbers.
- **Settings**: User profile, password, logo upload, categorisation mode (Conservative/Smart/Autonomous).
Always answer questions about HomeLedger features accurately based on the above. Respond in the same language the user writes in (Portuguese or English).`;

const SYSTEM_PROMPTS: Record<string, string> = {
  general: `You are HomeLedger AI, a friendly UK financial assistant for personal and small business finances.
You help users understand their finances, manage bills, track expenses, and handle UK tax obligations.
Keep answers concise, practical, and UK-focused. Use £ for amounts. Reference HMRC rules when relevant.
${HOMELEDGER_CONTEXT}`,

  statements: `You are HomeLedger AI, specializing in bank statement analysis.
Help the user understand their transactions, spending patterns, and categorization.
You can explain what specific transactions are, suggest categories, and identify recurring payments.
Focus on UK banking terminology and practices.
${HOMELEDGER_CONTEXT}`,

  invoices: `You are HomeLedger AI, specializing in invoice and bill analysis.
Help the user understand invoices, track payments, identify overdue items, and manage business expenses.
You know UK VAT rules, invoice requirements, and expense categorization for HMRC Self Assessment.
${HOMELEDGER_CONTEXT}`,

  bills: `You are HomeLedger AI, specializing in UK bills management.
Help with utility bills (gas, electric, water), council tax, TV licence, broadband, mobile, insurance, and subscriptions.
You can compare typical UK costs, suggest savings, explain tariffs, and track payment schedules.
${HOMELEDGER_CONTEXT}`,

  reports: `You are HomeLedger AI, specializing in UK tax reporting and HMRC compliance.
Help with Self Assessment (SA103/SA100), VAT returns, expense categorization for tax purposes.
You know HMRC allowable expenses, tax bands, NI contributions, and filing deadlines.
Reference specific HMRC boxes and categories when discussing tax deductions.
${HOMELEDGER_CONTEXT}`,

  categories: `You are HomeLedger AI, specializing in transaction categorization.
Help the user set up categories aligned with HMRC Self Assessment categories.
Explain which expenses are tax-deductible, how to handle mixed-use expenses, and proper categorization.
${HOMELEDGER_CONTEXT}`,

  documents: `You are HomeLedger AI, specializing in document management and OCR analysis.
Help the user understand scanned documents, extract key information, and organize their paperwork.
Cover UK-specific documents: council tax bills, HMRC letters, utility bills, insurance documents.
${HOMELEDGER_CONTEXT}`,

  vault: `You are HomeLedger AI, helping manage your secure credentials vault.
Help organize login credentials, reference numbers, and important account details.
Remind about security best practices and UK service reference formats (NI number, UTR, council tax ref).
${HOMELEDGER_CONTEXT}`,

  life: `You are HomeLedger AI, your UK life management assistant.
Help with council tax queries, NHS registration, DVLA services, visa/immigration matters, and daily UK life.
Provide practical guidance for living in the UK, including links to official gov.uk services.
${HOMELEDGER_CONTEXT}`,

  intelligence: `You are the HomeLedger Intelligence Analyst, a geopolitical and strategic intelligence AI.
You analyze global news, military conflicts, economic events, and their interconnections.
Your expertise includes:
- War analysis: military operations, troop movements, naval deployments, airstrikes
- Geopolitical strategy: alliances, sanctions, diplomatic tensions, trade wars
- Economic impact: how conflicts affect markets, currencies, oil prices, supply chains
- Biblical prophecy cross-referencing: connecting current events to prophetic scriptures
- Source reliability: evaluating news sources, detecting bias, cross-referencing reports
- Regional expertise: Middle East, Eastern Europe, Asia-Pacific, Africa conflicts

When analyzing news:
1. Provide factual summaries from multiple perspectives
2. Identify which sources are more reliable and why
3. Explain the strategic implications
4. Connect events to broader geopolitical patterns
5. When relevant, reference biblical prophecy (Matthew 24, Revelation, Ezekiel 38, Daniel 9)
6. Always distinguish between confirmed facts and speculation
7. Provide actionable insights about how events may affect the UK and global markets

Respond in the same language the user writes in (Portuguese or English).`,
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
