/**
 * Claude Co-Work Engine
 * Autonomous AI task executor with full system context access
 */

import { prisma } from '@/lib/db';
import { routeAI } from '@/lib/ai-router';
import { sendNotification } from '@/lib/notifications';

export type TaskType =
  | 'lead_scoring'
  | 'marketing_report'
  | 'post_generation'
  | 'system_monitor'
  | 'digest'
  | 'campaign_suggestions'
  | 'error_monitor'
  | 'custom';

const SYSTEM_CONTEXT = `You are Claude Co-Work, the autonomous AI operator of Clarity & Co (clarityco.co.uk).
You have full read access to the system: users, leads, transactions, social posts, bills, invoices, automation rules.
You are precise, proactive, and action-oriented. Always return structured results.
When you find issues, be specific. When you suggest actions, be concrete.
The system owner is Bruno and you must keep him informed of everything important.`;

async function buildSystemSnapshot(): Promise<string> {
  const [
    userCount,
    leadStats,
    recentLeads,
    unresolved,
    scheduledPosts,
    recentLogs,
  ] = await Promise.all([
    (prisma as any).user.count(),
    (prisma as any).lead.groupBy({ by: ['tag'], _count: { _all: true }, _avg: { score: true } }),
    (prisma as any).lead.findMany({ orderBy: { createdAt: 'desc' }, take: 10, select: { email: true, fullName: true, tag: true, score: true, source: true, createdAt: true } }),
    (prisma as any).lead.count({ where: { tag: 'hot', convertedAt: null } }),
    (prisma as any).socialPost.findMany({ where: { status: 'scheduled' }, take: 5, select: { platform: true, caption: true, scheduledAt: true } }),
    (prisma as any).claudeTaskLog.findMany({ orderBy: { runAt: 'desc' }, take: 5, select: { status: true, summary: true, runAt: true } }),
  ]);

  const leadSummary = leadStats.map((s: any) => `${s.tag}: ${s._count._all} (avg score ${Math.round(s._avg?.score || 0)})`).join(', ');

  return `
SYSTEM SNAPSHOT (${new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}):
- Total registered users: ${userCount}
- Leads: ${leadSummary}
- Hot leads not converted: ${unresolved}
- Recent leads (last 10): ${recentLeads.map((l: any) => `${l.email} [${l.tag}, score ${l.score}, from ${l.source || 'unknown'}]`).join('; ')}
- Scheduled social posts: ${scheduledPosts.length > 0 ? scheduledPosts.map((p: any) => `${p.platform} @ ${new Date(p.scheduledAt).toLocaleDateString('en-GB')}`).join(', ') : 'none'}
- Recent task activity: ${recentLogs.map((l: any) => `[${l.status}] ${l.summary || 'no summary'}`).join('; ') || 'none'}
`.trim();
}

export async function executeTask(taskId: string): Promise<{ success: boolean; summary: string; output: string }> {
  const task = await (prisma as any).claudeTask.findUnique({
    where: { id: taskId },
  });

  if (!task) throw new Error(`Task ${taskId} not found`);

  const logEntry = await (prisma as any).claudeTaskLog.create({
    data: { taskId, status: 'running', runAt: new Date() },
  });

  try {
    const snapshot = await buildSystemSnapshot();
    const prompt = buildTaskPrompt(task, snapshot);

    const result = await routeAI(
      task.taskType === 'post_generation' ? 'marketing_copy' : task.taskType === 'digest' ? 'report_summary' : 'analyse',
      [{ role: 'system', content: SYSTEM_CONTEXT }, { role: 'user', content: prompt }],
      { maxTokens: 4096 }
    );

    const output = result.content;
    const summary = extractSummary(output);
    const status = task.requiresApproval ? 'pending_approval' : 'success';

    await (prisma as any).claudeTaskLog.update({
      where: { id: logEntry.id },
      data: { status, output, summary, model: result.model || result.provider, tokensUsed: (result as any).usage?.output_tokens },
    });

    await (prisma as any).claudeTask.update({
      where: { id: taskId },
      data: { lastRunAt: new Date(), runCount: { increment: 1 }, nextRunAt: computeNextRun(task.schedule) },
    });

    if (!task.requiresApproval) {
      await sendNotification({
        type: 'success',
        title: `✅ Task completed: ${task.name}`,
        body: summary,
        notifyEmail: task.notifyEmail,
        notifySms: task.notifySms,
        notifyInApp: task.notifyInApp,
        metadata: { taskId, logId: logEntry.id },
      });
    } else {
      await sendNotification({
        type: 'info',
        title: `⏳ Approval needed: ${task.name}`,
        body: `Claude completed "${task.name}" and is awaiting your approval before publishing.\n\n${summary}`,
        notifyEmail: task.notifyEmail,
        notifySms: task.notifySms,
        notifyInApp: task.notifyInApp,
        metadata: { taskId, logId: logEntry.id },
      });
    }

    return { success: true, summary, output };
  } catch (error: any) {
    const errorMsg = error?.message || 'Unknown error';

    await (prisma as any).claudeTaskLog.update({
      where: { id: logEntry.id },
      data: { status: 'failed', errorMsg },
    });

    await sendNotification({
      type: 'alert',
      title: `❌ Task failed: ${task.name}`,
      body: `Error: ${errorMsg}`,
      notifyEmail: task.notifyEmail,
      notifySms: task.notifySms,
      notifyInApp: task.notifyInApp,
      metadata: { taskId, error: errorMsg },
    });

    return { success: false, summary: `Failed: ${errorMsg}`, output: errorMsg };
  }
}

export async function runSystemMonitor(): Promise<void> {
  const snapshot = await buildSystemSnapshot();

  const result = await routeAI('analyse', [
    { role: 'system', content: SYSTEM_CONTEXT },
    {
      role: 'user', content: `
Analyse this system snapshot for issues, anomalies, or urgent actions needed:

${snapshot}

Check for:
1. Hot leads not followed up for >24h
2. Unusual patterns in lead data
3. Missing scheduled posts
4. Any tasks that recently failed
5. Growth or decline trends

Return JSON: { "alerts": [{"severity": "high|medium|low", "title": "...", "action": "..."}], "summary": "..." }
`.trim()
    }
  ]);

  let parsed: any;
  try {
    let content = result.content.trim();
    if (content.startsWith('```json')) content = content.slice(7);
    if (content.startsWith('```')) content = content.slice(3);
    if (content.endsWith('```')) content = content.slice(0, -3);
    parsed = JSON.parse(content.trim());
  } catch {
    parsed = { alerts: [], summary: result.content };
  }

  const highAlerts = (parsed.alerts || []).filter((a: any) => a.severity === 'high');

  for (const alert of highAlerts) {
    await sendNotification({
      type: 'alert',
      title: `🚨 System Alert: ${alert.title}`,
      body: alert.action,
      notifyEmail: true,
      notifySms: true,
      notifyInApp: true,
      metadata: { severity: 'high', alert },
    });
  }

  for (const alert of (parsed.alerts || []).filter((a: any) => a.severity !== 'high')) {
    await sendNotification({
      type: 'warning',
      title: `⚠️ ${alert.title}`,
      body: alert.action,
      notifyEmail: false,
      notifySms: false,
      notifyInApp: true,
      metadata: { severity: alert.severity, alert },
    });
  }
}

export async function suggestTasks(): Promise<any[]> {
  const snapshot = await buildSystemSnapshot();

  const result = await routeAI('analyse', [
    { role: 'system', content: SYSTEM_CONTEXT },
    {
      role: 'user', content: `
Based on this system snapshot, suggest 5-8 Claude Co-Work tasks that would be most valuable right now:

${snapshot}

Return JSON array:
[{
  "name": "task name",
  "description": "what Claude will do",
  "taskType": "lead_scoring|marketing_report|post_generation|system_monitor|digest|campaign_suggestions|error_monitor|custom",
  "schedule": "0 9 * * 1" or "manual",
  "scheduleLabel": "Every Monday 9am" or "Manual",
  "requiresApproval": true/false,
  "notifySms": true/false,
  "priority": "high|medium|low",
  "reason": "why this is valuable now"
}]
`.trim()
    }
  ]);

  try {
    let content = result.content.trim();
    if (content.startsWith('```json')) content = content.slice(7);
    if (content.startsWith('```')) content = content.slice(3);
    if (content.endsWith('```')) content = content.slice(0, -3);
    return JSON.parse(content.trim());
  } catch {
    return [];
  }
}

function buildTaskPrompt(task: any, snapshot: string): string {
  const base = `${snapshot}\n\nTASK: ${task.name}\n${task.description || ''}\n`;

  const prompts: Record<string, string> = {
    lead_scoring: `${base}\nScore and analyse ALL leads with score=0. For each, provide: score (0-100), tag (hot/warm/cold), reasoning, recommended action. Return as JSON array.`,
    marketing_report: `${base}\nGenerate a comprehensive marketing performance report. Include: lead acquisition trends, conversion rates, top sources, recommended campaigns, action items. Be specific and data-driven.`,
    post_generation: `${base}\nGenerate 3 high-quality social media posts for Clarity & Co. Each post should be for a different platform (LinkedIn, Instagram, X) and address a real pain point visible in the lead data. Include hashtags and CTAs.`,
    system_monitor: `${base}\nPerform a full system health check. Identify any issues, anomalies, or urgent actions. Check leads, posts, tasks, errors. Provide a severity-ranked list of findings.`,
    digest: `${base}\nCreate a comprehensive weekly digest for Bruno. Include: new leads this week, lead quality trends, social media activity, upcoming tasks, key metrics, and 3 priority actions for next week.`,
    campaign_suggestions: `${base}\nAnalyse the current lead data and suggest 3 specific marketing campaigns for Clarity & Co. For each campaign: target audience, message, channels, expected outcome, and urgency.`,
    error_monitor: `${base}\nReview recent task logs for failures or warnings. Identify patterns. Suggest fixes. Flag anything critical.`,
    custom: `${base}\n${task.context?.prompt || 'Perform the requested analysis and return actionable insights.'}`,
  };

  return prompts[task.taskType] || prompts.custom;
}

function extractSummary(output: string): string {
  const lines = output.split('\n').filter(l => l.trim());
  const firstMeaningful = lines.find(l => l.length > 30 && !l.startsWith('{') && !l.startsWith('['));
  return firstMeaningful?.slice(0, 200) || output.slice(0, 200);
}

function computeNextRun(schedule: string): Date | null {
  if (schedule === 'manual') return null;
  // Simple next run: add 24h for daily, 7 days for weekly, 30 days for monthly
  const now = new Date();
  if (schedule.includes('* * *')) return new Date(now.getTime() + 86400000);
  if (schedule.includes('* * 1')) return new Date(now.getTime() + 604800000);
  return new Date(now.getTime() + 86400000);
}
