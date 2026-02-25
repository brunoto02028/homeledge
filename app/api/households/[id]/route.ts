import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/households/[id] - Get household details
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const { id } = params;

    const household = await prisma.household.findFirst({
      where: {
        id,
        OR: [
          { ownerId: userId },
          { memberships: { some: { userId } } },
        ],
      },
      include: {
        owner: { select: { id: true, fullName: true, email: true } },
        memberships: {
          include: { user: { select: { id: true, fullName: true, email: true } } },
          orderBy: { createdAt: 'asc' },
        },
        invitations: {
          where: { status: 'pending' },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!household) {
      return NextResponse.json({ error: 'Household not found' }, { status: 404 });
    }

    return NextResponse.json(household);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/households/[id] - Update household
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const { id } = params;
    const { name } = await req.json();

    // Only owner can update
    const household = await prisma.household.findFirst({
      where: { id, ownerId: userId },
    });

    if (!household) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const updated = await prisma.household.update({
      where: { id },
      data: { name: name.trim() },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/households/[id] - Delete household
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const { id } = params;

    const household = await prisma.household.findFirst({
      where: { id, ownerId: userId },
    });

    if (!household) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    await prisma.household.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
