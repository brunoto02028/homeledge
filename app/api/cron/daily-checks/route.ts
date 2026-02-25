import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { sendDeadlineReminderEmail, sendBudgetAlertEmail } from '@/lib/email';

// Cron secret to prevent unauthorized access
const CRON_SECRET = process.env.CRON_SECRET || 'homeledger-cron-2024';

// UK Tax deadlines for the current tax year
function getUpcomingDeadlines(): { title: string; dueDate: string; date: Date; type: string }[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed

  // Determine current tax year (6 Apr - 5 Apr)
  const taxYearStart = month >= 3 ? year : year - 1; // Apr=3
  const taxYearEnd = taxYearStart + 1;

  const deadlines = [
    { title: `Self Assessment Tax Return ${taxYearStart - 1}/${taxYearStart} (Online)`, dueDate: `31 Jan ${taxYearEnd}`, date: new Date(taxYearEnd, 0, 31), type: 'Self Assessment' },
    { title: `Self Assessment Payment on Account (1st)`, dueDate: `31 Jan ${taxYearEnd}`, date: new Date(taxYearEnd, 0, 31), type: 'Payment' },
    { title: `Self Assessment Payment on Account (2nd)`, dueDate: `31 Jul ${taxYearEnd}`, date: new Date(taxYearEnd, 6, 31), type: 'Payment' },
    { title: `Self Assessment Paper Return ${taxYearStart - 1}/${taxYearStart}`, dueDate: `31 Oct ${taxYearStart}`, date: new Date(taxYearStart, 9, 31), type: 'Self Assessment' },
    { title: 'VAT Return (Q1)', dueDate: `7 May ${year}`, date: new Date(year, 4, 7), type: 'VAT' },
    { title: 'VAT Return (Q2)', dueDate: `7 Aug ${year}`, date: new Date(year, 7, 7), type: 'VAT' },
    { title: 'VAT Return (Q3)', dueDate: `7 Nov ${year}`, date: new Date(year, 10, 7), type: 'VAT' },
    { title: 'VAT Return (Q4)', dueDate: `7 Feb ${year + 1}`, date: new Date(year + 1, 1, 7), type: 'VAT' },
    { title: `Corporation Tax Payment`, dueDate: `9 months after accounting period end`, date: new Date(year, month + 3, 1), type: 'Corporation Tax' },
    { title: 'PAYE/NIC Monthly', dueDate: `22nd of each month`, date: new Date(year, month + 1, 22), type: 'PAYE' },
    { title: `Companies House Confirmation Statement`, dueDate: `Annual`, date: new Date(year, month + 2, 1), type: 'Companies House' },
  ];

  return deadlines;
}

export async function POST(request: Request) {
  try {
    // Verify cron secret
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret') || request.headers.get('x-cron-secret');
    if (secret !== CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();
    const results = { deadlineEmails: 0, budgetEmails: 0, errors: [] as string[] };

    // Get all active users
    const users = await prisma.user.findMany({
      where: { status: 'active' },
      select: { id: true, email: true, fullName: true },
    });

    // ─── 1. Deadline Reminders ─────────────────────────────────────────
    const allDeadlines = getUpcomingDeadlines();
    const relevantDeadlines = allDeadlines
      .map(d => {
        const daysUntil = Math.ceil((d.date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        let urgency = 'upcoming';
        if (daysUntil < 0) urgency = 'overdue';
        else if (daysUntil <= 14) urgency = 'due_soon';
        else if (daysUntil > 30) return null; // Skip deadlines > 30 days out
        return { ...d, daysUntil, urgency };
      })
      .filter(Boolean) as any[];

    if (relevantDeadlines.length > 0) {
      for (const user of users) {
        try {
          await sendDeadlineReminderEmail(
            user.email,
            user.fullName || 'User',
            relevantDeadlines.map((d: any) => ({
              title: d.title,
              dueDate: d.dueDate,
              urgency: d.urgency,
              type: d.type,
            }))
          );
          results.deadlineEmails++;
        } catch (err: any) {
          results.errors.push(`Deadline email to ${user.email}: ${err.message}`);
        }
      }
    }

    // ─── 2. Budget Alerts ──────────────────────────────────────────────
    for (const user of users) {
      try {
        // Get user's budgets with current spending
        const budgets = await prisma.budget.findMany({
          where: { userId: user.id },
          include: { category: true },
        });

        if (budgets.length === 0) continue;

        // Calculate current month spending per category
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        const alerts: { categoryName: string; budgeted: number; spent: number; percentage: number }[] = [];

        for (const budget of budgets) {
          // Sum transactions for this category this month (via statement.userId)
          const transactions = await prisma.bankTransaction.aggregate({
            where: {
              statement: { userId: user.id },
              categoryId: budget.categoryId,
              type: 'debit',
              date: { gte: startOfMonth, lte: endOfMonth },
            },
            _sum: { amount: true },
          });

          // Sum bills for this category
          const billTotal = await prisma.bill.aggregate({
            where: {
              userId: user.id,
              categoryId: budget.categoryId,
              isActive: true,
            },
            _sum: { amount: true },
          });

          const spent = Math.abs(transactions?._sum?.amount || 0) + Math.abs(billTotal?._sum?.amount || 0);
          const percentage = budget.amount > 0 ? (spent / budget.amount) * 100 : 0;

          if (percentage >= 80) {
            alerts.push({
              categoryName: budget.category?.name || 'Unknown',
              budgeted: budget.amount,
              spent,
              percentage,
            });
          }
        }

        if (alerts.length > 0) {
          await sendBudgetAlertEmail(user.email, user.fullName || 'User', alerts);
          results.budgetEmails++;
        }
      } catch (err: any) {
        results.errors.push(`Budget check for ${user.email}: ${err.message}`);
      }
    }

    // Log the cron run
    await prisma.event.create({
      data: {
        userId: users[0]?.id || 'system',
        eventType: 'cron.daily_checks',
        entityType: 'system',
        entityId: 'cron',
        payload: {
          deadlineEmails: results.deadlineEmails,
          budgetEmails: results.budgetEmails,
          errors: results.errors.length,
          timestamp: now.toISOString(),
        },
      },
    });

    return NextResponse.json({
      success: true,
      ...results,
      usersProcessed: users.length,
      deadlinesFound: relevantDeadlines.length,
    });
  } catch (error: any) {
    console.error('[Cron] Daily checks error:', error);
    return NextResponse.json({ error: 'Cron job failed', details: error.message }, { status: 500 });
  }
}

// Also support GET for easy testing
export async function GET(request: Request) {
  return POST(request);
}
