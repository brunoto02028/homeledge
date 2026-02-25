import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId, getAccessibleUserIds } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const userIds = await getAccessibleUserIds(userId);
    const account = await prisma.account.findFirst({
      where: { id: params.id, provider: { userId: { in: userIds } } },
      include: { provider: true, entity: { select: { id: true, name: true, type: true, companyStatus: true } } },
    });
    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }
    return NextResponse.json(account);
  } catch (error) {
    console.error('Error fetching account:', error);
    return NextResponse.json({ error: 'Failed to fetch account' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const userIds = await getAccessibleUserIds(userId);

    // Verify ownership
    const existing = await prisma.account.findFirst({ where: { id: params.id, provider: { userId: { in: userIds } } } });
    if (!existing) return NextResponse.json({ error: 'Account not found' }, { status: 404 });

    const body = await request.json();
    const { providerId, accountName, accountNumber, accountType, balance, currency, isActive, entityId } = body ?? {};

    if (!providerId || !accountName || !accountType) {
      return NextResponse.json({ error: 'Provider ID, account name, and account type are required' }, { status: 400 });
    }

    const account = await prisma.account.update({
      where: { id: params.id },
      data: {
        providerId,
        accountName,
        accountNumber: accountNumber ?? null,
        accountType,
        balance: balance ?? 0,
        currency: currency ?? 'GBP',
        isActive: isActive ?? true,
        entityId: entityId || null,
      },
      include: { provider: true, entity: { select: { id: true, name: true, type: true, companyStatus: true } } },
    });

    await prisma.event.create({
      data: {
        userId,
        eventType: 'account.updated',
        entityType: 'account',
        entityId: account.id,
        payload: { name: accountName, type: accountType },
      },
    });

    return NextResponse.json(account);
  } catch (error) {
    console.error('Error updating account:', error);
    return NextResponse.json({ error: 'Failed to update account' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const userIds = await getAccessibleUserIds(userId);
    const account = await prisma.account.findFirst({
      where: { id: params.id, provider: { userId: { in: userIds } } },
      select: { accountName: true },
    });

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    await prisma.account.delete({ where: { id: params.id } });

    await prisma.event.create({
      data: {
        userId,
        eventType: 'account.deleted',
        entityType: 'account',
        entityId: params.id,
        payload: { name: account.accountName },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting account:', error);
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
  }
}
