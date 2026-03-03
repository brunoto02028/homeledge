import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const entityId = searchParams.get('entityId');
  const status = searchParams.get('status');
  const category = searchParams.get('category');

  const where: any = { userId };
  if (entityId) where.entityId = entityId;
  if (status && status !== 'all') where.status = status;
  if (category && category !== 'all') where.senderCategory = category;

  const items = await (prisma as any).correspondence.findMany({
    where,
    orderBy: { dateReceived: 'desc' },
    include: {
      entity: { select: { id: true, name: true } },
      parent: { select: { id: true, subject: true, senderName: true } },
      replies: { select: { id: true, subject: true, direction: true, dateReceived: true, status: true }, orderBy: { dateReceived: 'asc' } },
    },
  });

  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const {
    direction, senderCategory, senderName, recipientName, subject, summary,
    referenceNumber, utr, paymentRef, status, priority,
    dateReceived, deadlineDate, resolvedDate,
    amountDue, amountPaid, documentId, attachmentUrl,
    parentId, linkedActionId, notes, tags, entityId,
  } = body;

  if (!senderCategory || !senderName || !subject || !dateReceived) {
    return NextResponse.json({ error: 'Missing required fields: senderCategory, senderName, subject, dateReceived' }, { status: 400 });
  }

  const item = await (prisma as any).correspondence.create({
    data: {
      userId,
      entityId: entityId || null,
      direction: direction || 'incoming',
      senderCategory,
      senderName,
      recipientName: recipientName || null,
      subject,
      summary: summary || null,
      referenceNumber: referenceNumber || null,
      utr: utr || null,
      paymentRef: paymentRef || null,
      status: status || 'received',
      priority: priority || 'normal',
      dateReceived: new Date(dateReceived),
      deadlineDate: deadlineDate ? new Date(deadlineDate) : null,
      resolvedDate: resolvedDate ? new Date(resolvedDate) : null,
      amountDue: amountDue ? parseFloat(amountDue) : null,
      amountPaid: amountPaid ? parseFloat(amountPaid) : null,
      documentId: documentId || null,
      attachmentUrl: attachmentUrl || null,
      parentId: parentId || null,
      linkedActionId: linkedActionId || null,
      notes: notes || null,
      tags: tags || [],
    },
  });

  return NextResponse.json(item, { status: 201 });
}
