import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId, getAccessibleUserIds } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const userId = await requireUserId();
    const userIds = await getAccessibleUserIds(userId);
    
    const providers = await prisma.provider.findMany({
      where: { userId: { in: userIds } },
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(providers ?? []);
  } catch (error) {
    console.error('Error fetching providers:', error);
    return NextResponse.json({ error: 'Failed to fetch providers' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const body = await request.json();
    const { name, type, logoUrl, contactInfo } = body ?? {};

    if (!name || !type) {
      return NextResponse.json({ error: 'Name and type are required' }, { status: 400 });
    }

    const provider = await prisma.provider.create({
      data: {
        name,
        type,
        logoUrl: logoUrl ?? null,
        contactInfo: contactInfo ?? null,
        userId,
      },
    });

    // Create event
    await prisma.event.create({
      data: {
        userId,
        eventType: 'provider.created',
        entityType: 'provider',
        entityId: provider.id,
        payload: { name, type },
      },
    });

    return NextResponse.json(provider, { status: 201 });
  } catch (error) {
    console.error('Error creating provider:', error);
    return NextResponse.json({ error: 'Failed to create provider' }, { status: 500 });
  }
}
