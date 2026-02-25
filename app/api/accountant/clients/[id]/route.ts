import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId } from '@/lib/auth';

// PUT - Update client relationship (permissions, label, status)
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUserId();
    const { id } = await params;

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!user || user.role !== 'accountant') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const existing = await (prisma as any).accountantClient.findFirst({
      where: { id, accountantId: userId },
    });
    if (!existing) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

    const data = await request.json();
    const updateData: any = {};
    if (data.label !== undefined) updateData.label = data.label;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.permissions !== undefined) updateData.permissions = data.permissions;
    if (data.status === 'revoked') {
      updateData.status = 'revoked';
      updateData.revokedAt = new Date();
    }
    if (data.status === 'active' && existing.status === 'revoked') {
      updateData.status = 'active';
      updateData.revokedAt = null;
    }

    const updated = await (prisma as any).accountantClient.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[Accountant] PUT client error:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

// DELETE - Remove client relationship
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUserId();
    const { id } = await params;

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!user || user.role !== 'accountant') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const existing = await (prisma as any).accountantClient.findFirst({
      where: { id, accountantId: userId },
    });
    if (!existing) return NextResponse.json({ error: 'Client not found' }, { status: 404 });

    await (prisma as any).accountantClient.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[Accountant] DELETE client error:', error);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
