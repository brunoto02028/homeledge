import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId } from '@/lib/auth';

// GET /api/households - List user's households (owned + member)
export async function GET() {
  try {
    const userId = await requireUserId();

    const [owned, memberships] = await Promise.all([
      prisma.household.findMany({
        where: { ownerId: userId },
        include: {
          memberships: {
            include: { user: { select: { id: true, fullName: true, email: true } } },
          },
          invitations: {
            where: { status: 'pending' },
            select: { id: true, email: true, role: true, status: true, expiresAt: true, createdAt: true },
          },
          _count: { select: { memberships: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.membership.findMany({
        where: { userId, household: { isNot: null } },
        include: {
          household: {
            include: {
              owner: { select: { id: true, fullName: true, email: true } },
              _count: { select: { memberships: true } },
            },
          },
        },
      }),
    ]);

    // Merge owned + member-of (avoid duplicates)
    const ownedIds = new Set(owned.map(h => h.id));
    const memberOf = memberships
      .filter(m => m.household && !ownedIds.has(m.household.id))
      .map(m => ({
        ...m.household,
        myRole: m.role,
        memberships: [],
        invitations: [],
      }));

    return NextResponse.json({
      owned: owned.map(h => ({ ...h, myRole: 'owner' })),
      memberOf,
    });
  } catch (error: any) {
    console.error('Error fetching households:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch households' }, { status: 500 });
  }
}

// POST /api/households - Create a new household
export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const { name } = await req.json();

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Household name is required' }, { status: 400 });
    }

    const household = await prisma.household.create({
      data: {
        name: name.trim(),
        ownerId: userId,
        memberships: {
          create: { userId, role: 'owner' },
        },
      },
      include: {
        memberships: {
          include: { user: { select: { id: true, fullName: true, email: true } } },
        },
      },
    });

    return NextResponse.json(household);
  } catch (error: any) {
    console.error('Error creating household:', error);
    return NextResponse.json({ error: error.message || 'Failed to create household' }, { status: 500 });
  }
}
