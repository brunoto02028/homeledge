import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId, getAccessibleUserIds } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const userIds = await getAccessibleUserIds(userId);
    const provider = await prisma.provider.findFirst({
      where: { id: params.id, userId: { in: userIds } },
      include: { accounts: true },
    });
    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }
    return NextResponse.json(provider);
  } catch (error) {
    console.error('Error fetching provider:', error);
    return NextResponse.json({ error: 'Failed to fetch provider' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const userIds = await getAccessibleUserIds(userId);
    const existing = await prisma.provider.findFirst({ where: { id: params.id, userId: { in: userIds } } });
    if (!existing) return NextResponse.json({ error: 'Provider not found' }, { status: 404 });

    const body = await request.json();
    const { name, type, logoUrl, contactInfo } = body ?? {};

    if (!name || !type) {
      return NextResponse.json({ error: 'Name and type are required' }, { status: 400 });
    }

    const provider = await prisma.provider.update({
      where: { id: params.id },
      data: {
        name,
        type,
        logoUrl: logoUrl ?? null,
        contactInfo: contactInfo ?? null,
      },
    });

    await prisma.event.create({
      data: {
        userId,
        eventType: 'provider.updated',
        entityType: 'provider',
        entityId: provider.id,
        payload: { name, type },
      },
    });

    return NextResponse.json(provider);
  } catch (error) {
    console.error('Error updating provider:', error);
    return NextResponse.json({ error: 'Failed to update provider' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const userIds = await getAccessibleUserIds(userId);
    const provider = await prisma.provider.findFirst({
      where: { id: params.id, userId: { in: userIds } },
      select: { name: true },
    });

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    await prisma.provider.delete({ where: { id: params.id } });

    await prisma.event.create({
      data: {
        userId,
        eventType: 'provider.deleted',
        entityType: 'provider',
        entityId: params.id,
        payload: { name: provider.name },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting provider:', error);
    return NextResponse.json({ error: 'Failed to delete provider' }, { status: 500 });
  }
}
