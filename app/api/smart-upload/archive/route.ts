import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId, getAccessibleUserIds } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// GET /api/smart-upload/archive — List uploaded documents grouped by year/month
export async function GET(request: Request) {
  try {
    const userId = await requireUserId();
    const userIds = await getAccessibleUserIds(userId);
    const { searchParams } = new URL(request.url);
    const entityId = searchParams.get('entityId');

    const where: any = { userId: { in: userIds } };
    if (entityId && entityId !== 'none') where.entityId = entityId;

    const docs = await (prisma as any).scannedDocument.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        fileName: true,
        cloudStoragePath: true,
        documentType: true,
        senderName: true,
        summary: true,
        amountDue: true,
        currency: true,
        linkedBillId: true,
        entityId: true,
        createdAt: true,
        status: true,
      },
    });

    // Fetch entity names for display
    const entityIds = [...new Set(docs.filter((d: any) => d.entityId).map((d: any) => d.entityId))];
    let entityMap: Record<string, string> = {};
    if (entityIds.length > 0) {
      try {
        const entities = await (prisma as any).entity.findMany({
          where: { id: { in: entityIds } },
          select: { id: true, name: true },
        });
        entityMap = Object.fromEntries(entities.map((e: any) => [e.id, e.name]));
      } catch { /* ignore */ }
    }

    // Group by year/month
    const groupMap = new Map<string, any>();
    for (const doc of docs) {
      const date = new Date(doc.createdAt);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const key = `${year}-${month}`;

      if (!groupMap.has(key)) {
        groupMap.set(key, {
          year,
          month,
          label: `${MONTH_NAMES[month - 1]} ${year}`,
          files: [],
        });
      }

      groupMap.get(key).files.push({
        ...doc,
        entityName: doc.entityId ? entityMap[doc.entityId] || null : null,
      });
    }

    // Sort groups by date descending
    const groups = Array.from(groupMap.values()).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month - a.month;
    });

    return NextResponse.json({ groups, totalFiles: docs.length });
  } catch (error: any) {
    console.error('[Archive] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
