import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const existing = await (prisma as any).correspondence.findFirst({ where: { id: params.id, userId } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await req.json();
  const {
    direction, senderCategory, senderName, recipientName, subject, summary,
    referenceNumber, utr, paymentRef, status, priority,
    dateReceived, deadlineDate, resolvedDate,
    amountDue, amountPaid, documentId, attachmentUrl,
    parentId, linkedActionId, notes, tags, entityId,
  } = body;

  const updated = await (prisma as any).correspondence.update({
    where: { id: params.id },
    data: {
      entityId: entityId !== undefined ? (entityId || null) : existing.entityId,
      direction: direction || existing.direction,
      senderCategory: senderCategory || existing.senderCategory,
      senderName: senderName || existing.senderName,
      recipientName: recipientName !== undefined ? (recipientName || null) : existing.recipientName,
      subject: subject || existing.subject,
      summary: summary !== undefined ? (summary || null) : existing.summary,
      referenceNumber: referenceNumber !== undefined ? (referenceNumber || null) : existing.referenceNumber,
      utr: utr !== undefined ? (utr || null) : existing.utr,
      paymentRef: paymentRef !== undefined ? (paymentRef || null) : existing.paymentRef,
      status: status || existing.status,
      priority: priority || existing.priority,
      dateReceived: dateReceived ? new Date(dateReceived) : existing.dateReceived,
      deadlineDate: deadlineDate !== undefined ? (deadlineDate ? new Date(deadlineDate) : null) : existing.deadlineDate,
      resolvedDate: resolvedDate !== undefined ? (resolvedDate ? new Date(resolvedDate) : null) : existing.resolvedDate,
      amountDue: amountDue !== undefined ? (amountDue ? parseFloat(amountDue) : null) : existing.amountDue,
      amountPaid: amountPaid !== undefined ? (amountPaid ? parseFloat(amountPaid) : null) : existing.amountPaid,
      documentId: documentId !== undefined ? (documentId || null) : existing.documentId,
      attachmentUrl: attachmentUrl !== undefined ? (attachmentUrl || null) : existing.attachmentUrl,
      parentId: parentId !== undefined ? (parentId || null) : existing.parentId,
      linkedActionId: linkedActionId !== undefined ? (linkedActionId || null) : existing.linkedActionId,
      notes: notes !== undefined ? (notes || null) : existing.notes,
      tags: tags !== undefined ? tags : existing.tags,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const existing = await (prisma as any).correspondence.findFirst({ where: { id: params.id, userId } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await (prisma as any).correspondence.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
