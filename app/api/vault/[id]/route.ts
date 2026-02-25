import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId, getAccessibleUserIds } from '@/lib/auth';
import { encrypt, decrypt } from '@/lib/vault-crypto';

// GET - Get single vault entry
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const userIds = await getAccessibleUserIds(userId);
    const entry = await prisma.vaultEntry.findFirst({
      where: { id: params.id, userId: { in: userIds } },
    });

    if (!entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    // Update last accessed
    await prisma.vaultEntry.update({
      where: { id: params.id },
      data: { lastAccessedAt: new Date() },
    });

    return NextResponse.json({
      ...entry,
      passwordEnc: entry.passwordEnc ? decrypt(entry.passwordEnc) : null,
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT - Update vault entry
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const userIds = await getAccessibleUserIds(userId);
    const existing = await prisma.vaultEntry.findFirst({
      where: { id: params.id, userId: { in: userIds } },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    const body = await request.json();
    const updateData: Record<string, any> = {};

    if (body.title !== undefined) updateData.title = body.title;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.username !== undefined) updateData.username = body.username;
    if (body.password !== undefined) updateData.passwordEnc = body.password ? encrypt(body.password) : null;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.referenceNumber !== undefined) updateData.referenceNumber = body.referenceNumber;
    if (body.accountNumber !== undefined) updateData.accountNumber = body.accountNumber;
    if (body.sortCode !== undefined) updateData.sortCode = body.sortCode;
    if (body.websiteUrl !== undefined) updateData.websiteUrl = body.websiteUrl;
    if (body.phoneNumber !== undefined) updateData.phoneNumber = body.phoneNumber;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.tags !== undefined) updateData.tags = body.tags;
    if (body.isFavorite !== undefined) updateData.isFavorite = body.isFavorite;

    const updated = await prisma.vaultEntry.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({
      ...updated,
      passwordEnc: updated.passwordEnc ? decrypt(updated.passwordEnc) : null,
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete vault entry
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const userIds = await getAccessibleUserIds(userId);
    const existing = await prisma.vaultEntry.findFirst({
      where: { id: params.id, userId: { in: userIds } },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    await prisma.vaultEntry.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
