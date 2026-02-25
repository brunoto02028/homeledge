import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId } from '@/lib/auth';
import { encrypt, decrypt } from '@/lib/vault-crypto';

async function requireAdmin() {
  const userId = await requireUserId();
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user || user.role !== 'admin') throw new Error('FORBIDDEN');
  return userId;
}

// PUT update credential
export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const data = await request.json();

    const updateData: any = {};
    if (data.provider !== undefined) updateData.provider = data.provider;
    if (data.label !== undefined) updateData.label = data.label;
    if (data.keyName !== undefined) updateData.keyName = data.keyName;
    if (data.value !== undefined) updateData.value = encrypt(data.value);
    if (data.category !== undefined) updateData.category = data.category;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder;

    const credential = await (prisma as any).apiCredential.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ ...credential, value: decrypt(credential.value) });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'FORBIDDEN') return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    console.error('[Credentials] PUT error:', error);
    return NextResponse.json({ error: 'Failed to update credential' }, { status: 500 });
  }
}

// DELETE credential
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;

    await (prisma as any).apiCredential.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'FORBIDDEN') return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    console.error('[Credentials] DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete credential' }, { status: 500 });
  }
}
