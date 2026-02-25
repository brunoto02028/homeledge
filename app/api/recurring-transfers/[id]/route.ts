import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId, getAccessibleUserIds } from '@/lib/auth';

// PUT - Update recurring transfer
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserId();
    const userIds = await getAccessibleUserIds(userId);
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.recurringTransfer.findFirst({ where: { id, userId: { in: userIds } } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const updated = await prisma.recurringTransfer.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.type !== undefined && { type: body.type }),
        ...(body.fromAccount !== undefined && { fromAccount: body.fromAccount || null }),
        ...(body.toAccount !== undefined && { toAccount: body.toAccount || null }),
        ...(body.toName !== undefined && { toName: body.toName || null }),
        ...(body.reference !== undefined && { reference: body.reference || null }),
        ...(body.amount !== undefined && { amount: parseFloat(body.amount) }),
        ...(body.frequency !== undefined && { frequency: body.frequency }),
        ...(body.dayOfMonth !== undefined && { dayOfMonth: body.dayOfMonth ? parseInt(body.dayOfMonth) : null }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.categoryId !== undefined && { categoryId: body.categoryId || null }),
        ...(body.notes !== undefined && { notes: body.notes || null }),
      },
      include: { category: { select: { id: true, name: true, color: true } } },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

// DELETE - Delete recurring transfer
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserId();
    const userIds = await getAccessibleUserIds(userId);
    const { id } = await params;

    const existing = await prisma.recurringTransfer.findFirst({ where: { id, userId: { in: userIds } } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await prisma.recurringTransfer.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
