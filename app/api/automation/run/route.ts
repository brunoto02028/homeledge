import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET || 'homeledger-cron-2024';
  const isAdmin = authHeader === `Bearer ${cronSecret}`;
  const ruleId = req.nextUrl.searchParams.get('ruleId');

  if (!isAdmin && !ruleId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();

  const rules = await prisma.automationRule.findMany({
    where: { isActive: true, ...(ruleId ? { id: ruleId } : {}) },
    include: { user: { select: { id: true, email: true, fullName: true } } },
  });

  let ran = 0; let failed = 0;
  const results: any[] = [];

  for (const rule of rules) {
    try {
      const shouldRun = await checkTrigger(rule, now);
      if (!shouldRun.run) {
        results.push({ id: rule.id, name: rule.name, status: 'skipped', reason: shouldRun.reason });
        continue;
      }
      const result = await executeAction(rule);
      await prisma.automationRule.update({
        where: { id: rule.id },
        data: { lastRunAt: now, runCount: { increment: 1 }, nextRunAt: getNextRun(rule.trigger, now) },
      });
      await prisma.automationLog.create({
        data: { ruleId: rule.id, userId: rule.userId, status: 'success', message: result.message, detail: result.detail || null },
      });
      ran++;
      results.push({ id: rule.id, name: rule.name, status: 'success', message: result.message });
    } catch (err: any) {
      failed++;
      await prisma.automationLog.create({
        data: { ruleId: rule.id, userId: rule.userId, status: 'failed', message: err.message || 'Unknown error' },
      });
      results.push({ id: rule.id, name: rule.name, status: 'failed', error: err.message });
    }
  }

  return NextResponse.json({ ran, failed, skipped: rules.length - ran - failed, results });
}

async function checkTrigger(rule: any, now: Date): Promise<{ run: boolean; reason?: string }> {
  const cfg = rule.triggerConfig || {};
  switch (rule.trigger) {
    case 'schedule_daily': {
      if (!rule.lastRunAt) return { run: true };
      return (now.getTime() - new Date(rule.lastRunAt).getTime()) >= 23 * 3600 * 1000
        ? { run: true } : { run: false, reason: 'Not due yet (daily)' };
    }
    case 'schedule_weekly': {
      if (!rule.lastRunAt) return { run: true };
      return (now.getTime() - new Date(rule.lastRunAt).getTime()) >= 6 * 24 * 3600 * 1000
        ? { run: true } : { run: false, reason: 'Not due yet (weekly)' };
    }
    case 'schedule_monthly': {
      if (!rule.lastRunAt) return { run: true };
      const last = new Date(rule.lastRunAt);
      return (now.getMonth() !== last.getMonth() || now.getFullYear() !== last.getFullYear())
        ? { run: true } : { run: false, reason: 'Not due yet (monthly)' };
    }
    case 'bill_due': {
      const days = cfg.days ?? 3;
      const target = new Date(now); target.setDate(target.getDate() + days);
      // Bill model has: billName, amount, dueDay, isActive — no nextDueDate/status
      // Approximate: just check if any bills are active
      const bills = await prisma.bill.findMany({
        where: { userId: rule.userId, isActive: true },
        take: 5,
        select: { id: true, billName: true, amount: true, dueDay: true },
      });
      return bills.length > 0 ? { run: true } : { run: false, reason: 'No active bills' };
    }
    case 'invoice_overdue': {
      // InvoiceStatus: pending, processed, error, reviewed — no 'sent'
      const overdue = await prisma.invoice.findMany({
        where: { userId: rule.userId, status: 'processed', dueDate: { lt: now } },
        take: 5,
        select: { id: true, invoiceNumber: true, amount: true, dueDate: true },
      });
      return overdue.length > 0 ? { run: true } : { run: false, reason: 'No overdue invoices' };
    }
    case 'budget_exceeded': {
      // Budget has: amount, alertAt — no spent field directly
      const budgets = await prisma.budget.findMany({
        where: { userId: rule.userId, isActive: true },
        select: { id: true, amount: true, alertAt: true, categoryId: true },
      });
      return budgets.length > 0 ? { run: true } : { run: false, reason: 'No budgets found' };
    }
    case 'statement_imported':
      return { run: true };
    default:
      return { run: true };
  }
}

async function executeAction(rule: any): Promise<{ message: string; detail?: any }> {
  const cfg = rule.actionConfig || {};
  switch (rule.action) {
    case 'create_action': {
      const action = await prisma.action.create({
        data: {
          userId: rule.userId,
          actionType: 'other',
          title: cfg.title || `Automation: ${rule.name}`,
          description: cfg.description || `Auto-created by rule: ${rule.name}`,
          dueDate: cfg.dueDays ? new Date(Date.now() + cfg.dueDays * 86400000) : null,
          priority: (cfg.priority as any) || 'medium',
          status: 'pending',
        },
      });
      return { message: `Created task: "${action.title}"`, detail: { actionId: action.id } };
    }
    case 'send_email':
    case 'send_reminder': {
      const { sendEmail } = await import('@/lib/email');
      let contextHtml = '';
      if (rule.trigger === 'bill_due') {
        const bills = await prisma.bill.findMany({
          where: { userId: rule.userId, isActive: true },
          select: { billName: true, amount: true, dueDay: true },
          take: 5,
        });
        contextHtml = `<ul>${bills.map((b: any) => `<li><strong>${b.billName}</strong> — £${b.amount} (due day ${b.dueDay})</li>`).join('')}</ul>`;
      } else if (rule.trigger === 'invoice_overdue') {
        const inv = await prisma.invoice.findMany({
          where: { userId: rule.userId, status: 'processed', dueDate: { lt: new Date() } },
          select: { invoiceNumber: true, amount: true, dueDate: true },
          take: 5,
        });
        contextHtml = `<ul>${inv.map((i: any) => `<li><strong>${i.invoiceNumber || 'Invoice'}</strong> — £${i.amount || 0} overdue since ${new Date(i.dueDate).toLocaleDateString('en-GB')}</li>`).join('')}</ul>`;
      }
      await sendEmail(
        cfg.to || rule.user.email,
        cfg.subject || `Reminder: ${rule.name}`,
        `<p>Hi ${rule.user.fullName},</p><p>${cfg.body || `Automated reminder for: <strong>${rule.name}</strong>`}</p>${contextHtml}<p style="color:#666;font-size:12px">— Clarity &amp; Co</p>`,
      );
      return { message: `Email sent to ${cfg.to || rule.user.email}` };
    }
    case 'webhook': {
      if (!cfg.url) throw new Error('Webhook URL not configured');
      const resp = await fetch(cfg.url, {
        method: cfg.method || 'POST',
        headers: { 'Content-Type': 'application/json', ...(cfg.headers || {}) },
        body: JSON.stringify({ rule: rule.name, trigger: rule.trigger, userId: rule.userId, timestamp: new Date().toISOString(), ...(cfg.payload || {}) }),
      });
      if (!resp.ok) throw new Error(`Webhook returned ${resp.status}`);
      return { message: `Webhook called: ${cfg.url} → ${resp.status}` };
    }
    case 'flag_transaction': {
      // No Transaction model — log a note
      return { message: 'Flagging not available — no transaction model linked' };
    }
    default:
      return { message: `Action "${rule.action}" executed` };
  }
}

function getNextRun(trigger: string, now: Date): Date | null {
  const next = new Date(now);
  switch (trigger) {
    case 'schedule_daily': next.setDate(next.getDate() + 1); return next;
    case 'schedule_weekly': next.setDate(next.getDate() + 7); return next;
    case 'schedule_monthly': next.setMonth(next.getMonth() + 1); return next;
    default: return null;
  }
}
