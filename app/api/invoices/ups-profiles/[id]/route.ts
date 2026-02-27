import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// PUT - Update a submission profile
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserId();
    const { id } = await params;

    const existing = await (prisma as any).submissionProfile.findFirst({
      where: { id, userId },
    });
    if (!existing) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    const fields = [
      'name', 'prefix', 'poNumber', 'siteCode', 'siteName',
      'recipientEmail', 'senderEmail', 'senderName', 'companyName',
      'companyLogo', 'emailSignature', 'smtpHost', 'smtpPort', 'smtpUser', 'smtpPass', 'isActive',
    ];
    for (const f of fields) {
      if (body[f] !== undefined) updateData[f] = body[f];
    }

    const profile = await (prisma as any).submissionProfile.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(profile);
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[UPS Profiles] Error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}

// DELETE - Delete a submission profile
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserId();
    const { id } = await params;

    const existing = await (prisma as any).submissionProfile.findFirst({
      where: { id, userId },
    });
    if (!existing) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

    await (prisma as any).submissionProfile.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[UPS Profiles] Error:', error);
    return NextResponse.json({ error: 'Failed to delete profile' }, { status: 500 });
  }
}
