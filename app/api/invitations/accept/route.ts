import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// POST /api/invitations/accept - Accept an invitation
export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

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

    if (invitation.email !== user.email) {
      return NextResponse.json({ error: 'This invitation was sent to a different email' }, { status: 403 });
    }

    // Create membership and mark invitation as accepted
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

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error accepting invitation:', error);
    return NextResponse.json({ error: error.message || 'Failed to accept invitation' }, { status: 500 });
  }
}
