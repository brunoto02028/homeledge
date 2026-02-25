import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId, getAccessibleUserIds } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const userIds = await getAccessibleUserIds(userId);
    const accounts = await prisma.account.findMany({
      where: { provider: { userId: { in: userIds } } },
      include: {
        provider: true,
        entity: { select: { id: true, name: true, type: true, companyStatus: true } },
      },
      orderBy: { accountName: 'asc' },
    });

    return NextResponse.json(accounts);
  } catch (error) {
    console.error('Error fetching accounts:', error);
    return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const data = await request.json();

    // Verify the provider belongs to this user
    const provider = await prisma.provider.findFirst({
      where: { id: data.providerId, userId },
    });
    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    const account = await prisma.account.create({
      data: {
        providerId: data.providerId,
        accountName: data.accountName,
        accountNumber: data.accountNumber || null,
        accountType: data.accountType || 'current',
        balance: data.balance || 0,
        currency: data.currency || 'GBP',
        isActive: data.isActive ?? true,
        entityId: data.entityId || null,
      },
      include: {
        provider: true,
        entity: { select: { id: true, name: true, type: true, companyStatus: true } },
      },
    });

    return NextResponse.json(account);
  } catch (error) {
    console.error('Error creating account:', error);
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
}
