import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// POST /api/invitations/accept/[token] - Accept an invitation
export async function POST(_req: Request, { params }: { params: { token: string } }) {
  try {
    const userId = await requireUserId();
    const { token } = params;

    const invitation = await prisma.invitation.findUnique({ where: { token } });

    if (!invitation) {
      return NextResponse.json({ error: 'Invitation not found' }, { status: 404 });
    }

    if (invitation.status !== 'pending') {
      return NextResponse.json({ error: `Invitation is ${invitation.status}` }, { status: 400 });
    }

    if (new Date() > invitation.expiresAt) {
      await prisma.invitation.update({ where: { id: invitation.id }, data: { status: 'expired' } });
      return NextResponse.json({ error: 'Invitation has expired' }, { status: 400 });
    }

    // Verify the logged-in user's email matches the invitation
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    if (user?.email !== invitation.email) {
      return NextResponse.json({
        error: `This invitation was sent to ${invitation.email}. Please log in with that email address.`,
      }, { status: 403 });
    }

    // Check if already a member
    const existingMembership = await prisma.membership.findFirst({
      where: {
        userId,
        ...(invitation.householdId ? { householdId: invitation.householdId } : {}),
        ...(invitation.businessId ? { businessId: invitation.businessId } : {}),
      },
    });

    if (existingMembership) {
      return NextResponse.json({ error: 'You are already a member' }, { status: 400 });
    }

    // Accept: create membership and update invitation
    await prisma.$transaction([
      prisma.membership.create({
        data: {
          userId,
          householdId: invitation.householdId,
          businessId: invitation.businessId,
          role: invitation.role,
        },
      }),
      prisma.invitation.update({
        where: { id: invitation.id },
        data: { status: 'accepted', acceptedAt: new Date() },
      }),
    ]);

    return NextResponse.json({ success: true, householdId: invitation.householdId, businessId: invitation.businessId });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Please log in first' }, { status: 401 });
    }
    console.error('[Accept Invite] Error:', error);
    return NextResponse.json({ error: 'Failed to accept invitation' }, { status: 500 });
  }
}
