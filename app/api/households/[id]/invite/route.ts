import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId } from '@/lib/auth';
import { sendInvitationEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

// POST /api/households/[id]/invite - Send invitation
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const { id } = params;
    const { email, role = 'viewer' } = await req.json();

    if (!email?.trim()) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Verify user is owner or editor
    const membership = await prisma.membership.findFirst({
      where: { userId, householdId: id, role: { in: ['owner', 'editor'] } },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Not authorized to invite members' }, { status: 403 });
    }

    // Check if already a member
    const existingUser = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (existingUser) {
      const existingMembership = await prisma.membership.findFirst({
        where: { userId: existingUser.id, householdId: id },
      });
      if (existingMembership) {
        return NextResponse.json({ error: 'User is already a member' }, { status: 400 });
      }
    }

    // Check for existing pending invite
    const existingInvite = await prisma.invitation.findFirst({
      where: { email: email.trim().toLowerCase(), householdId: id, status: 'pending' },
    });
    if (existingInvite) {
      return NextResponse.json({ error: 'Invitation already sent to this email' }, { status: 400 });
    }

    // Get inviter name and household name
    const [inviter, household] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { fullName: true } }),
      prisma.household.findUnique({ where: { id }, select: { name: true } }),
    ]);

    // Create invitation (expires in 7 days)
    const invitation = await prisma.invitation.create({
      data: {
        email: email.trim().toLowerCase(),
        householdId: id,
        role: role as any,
        invitedBy: userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Send invitation email
    let emailSent = false;
    try {
      const emailResult = await sendInvitationEmail(
        email.trim().toLowerCase(),
        inviter?.fullName || 'A HomeLedger user',
        household?.name || 'a household',
        invitation.token,
      );
      emailSent = emailResult?.success === true;
    } catch (emailErr) {
      console.error('[Invite] Email failed:', emailErr);
    }

    return NextResponse.json({ ...invitation, emailSent });
  } catch (error: any) {
    console.error('Error sending invitation:', error);
    return NextResponse.json({ error: error.message || 'Failed to send invitation' }, { status: 500 });
  }
}

// DELETE /api/households/[id]/invite - Revoke invitation
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const { id } = params;
    const { invitationId } = await req.json();

    // Verify user is owner
    const household = await prisma.household.findFirst({
      where: { id, ownerId: userId },
    });

    if (!household) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    await prisma.invitation.update({
      where: { id: invitationId },
      data: { status: 'revoked' },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
