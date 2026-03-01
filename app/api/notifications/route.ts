import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId, getAccessibleUserIds } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Build synthetic deadline notifications from CH profile data
async function getDeadlineAlerts(userIds: string[]) {
  const alerts: any[] = [];
  const now = new Date();

  try {
    const chConns = await (prisma as any).governmentConnection.findMany({
      where: {
        userId: { in: userIds },
        provider: 'companies_house',
        profileData: { not: null },
      },
      select: { companyNumber: true, profileData: true, entityId: true },
    });

    for (const conn of chConns) {
      const profile = conn.profileData?.profile || conn.profileData;
      const companyName = profile?.company_name || conn.companyNumber;

      const deadlines: { title: string; date: string; type: string }[] = [];

      const accountsDue = profile?.accounts?.next_due || profile?.accounts?.next_accounts?.due_on;
      if (accountsDue) deadlines.push({ title: `Annual Accounts — ${companyName}`, date: accountsDue, type: 'accounts' });

      const csDue = profile?.confirmation_statement?.next_due;
      if (csDue) deadlines.push({ title: `Confirmation Statement — ${companyName}`, date: csDue, type: 'confirmation_statement' });

      for (const dl of deadlines) {
        const dueDate = new Date(dl.date);
        const daysUntil = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        // Only show deadlines that are overdue or due within 60 days
        if (daysUntil > 60) continue;

        const urgency = daysUntil < 0 ? 'overdue' : daysUntil <= 14 ? 'due_soon' : 'upcoming';
        const daysText = daysUntil < 0 ? `${Math.abs(daysUntil)}d overdue` : daysUntil === 0 ? 'Due today' : `${daysUntil}d left`;

        alerts.push({
          id: `deadline-${conn.companyNumber}-${dl.type}`,
          eventType: `deadline.${urgency}`,
          entityType: 'deadline',
          payload: {
            title: dl.title,
            dueDate: dueDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
            daysUntil,
            daysText,
            urgency,
            companyNumber: conn.companyNumber,
            type: dl.type,
          },
          readAt: urgency === 'upcoming' ? new Date().toISOString() : null, // overdue + due_soon show as unread
          createdAt: now.toISOString(),
          isDeadline: true,
        });
      }
    }
  } catch (err) {
    console.error('[Notifications] Error fetching deadline alerts:', err);
  }

  return alerts;
}

// GET - Fetch recent events as notifications
export async function GET(request: Request) {
  try {
    const userId = await requireUserId();
    const userIds = await getAccessibleUserIds(userId);
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const unreadOnly = searchParams.get('unread') === 'true';

    const where: Record<string, unknown> = { userId: { in: userIds } };
    if (unreadOnly) where.readAt = null;

    const [events, deadlineAlerts] = await Promise.all([
      prisma.event.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: Math.min(limit, 50),
      }),
      getDeadlineAlerts(userIds),
    ]);

    // Merge: deadline alerts first (sorted by urgency), then regular events
    const urgencyOrder: Record<string, number> = { overdue: 0, due_soon: 1, upcoming: 2 };
    const sortedAlerts = deadlineAlerts.sort((a, b) => {
      const ua = urgencyOrder[a.payload?.urgency] ?? 3;
      const ub = urgencyOrder[b.payload?.urgency] ?? 3;
      return ua - ub;
    });

    const combined = [...sortedAlerts, ...events].slice(0, Math.min(limit, 50));

    const eventUnreadCount = await prisma.event.count({
      where: { userId: { in: userIds }, readAt: null },
    });
    const deadlineUnreadCount = deadlineAlerts.filter(a => !a.readAt).length;

    return NextResponse.json({
      events: combined,
      unreadCount: eventUnreadCount + deadlineUnreadCount,
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// POST - Mark notifications as read
export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const { eventIds, markAll } = await request.json();

    if (markAll) {
      await prisma.event.updateMany({
        where: { userId, readAt: null },
        data: { readAt: new Date() },
      });
    } else if (eventIds?.length) {
      await prisma.event.updateMany({
        where: { id: { in: eventIds }, userId },
        data: { readAt: new Date() },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
