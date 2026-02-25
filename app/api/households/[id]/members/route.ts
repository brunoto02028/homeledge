import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// PUT /api/households/[id]/members - Update member role
export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const { id } = params;
    const { memberId, role } = await req.json();

    // Only owner can change roles
    const household = await prisma.household.findFirst({
      where: { id, ownerId: userId },
    });

    if (!household) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Can't change owner's role
    if (memberId === userId) {
      return NextResponse.json({ error: 'Cannot change your own role' }, { status: 400 });
    }

    const membership = await prisma.membership.findFirst({
      where: { userId: memberId, householdId: id },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Member not found' }, { status: 404 });
    }

    const updated = await prisma.membership.update({
      where: { id: membership.id },
      data: { role },
      include: { user: { select: { id: true, fullName: true, email: true } } },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/households/[id]/members - Remove member
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const { id } = params;
    const { memberId } = await req.json();

    // Owner can remove anyone, members can remove themselves
    const household = await prisma.household.findFirst({
      where: { id, ownerId: userId },
    });

    if (!household && memberId !== userId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Can't remove the owner
    if (household && memberId === household.ownerId) {
      return NextResponse.json({ error: 'Cannot remove the owner' }, { status: 400 });
    }

    await prisma.membership.deleteMany({
      where: { userId: memberId, householdId: id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
