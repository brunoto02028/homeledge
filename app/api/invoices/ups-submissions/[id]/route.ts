import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET - Get a single submission
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserId();
    const { id } = await params;

    const submission = await (prisma as any).invoiceSubmission.findFirst({
      where: { id, userId },
      include: {
        profile: true,
      },
    });

    if (!submission) return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    return NextResponse.json(submission);
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[UPS Submissions] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch submission' }, { status: 500 });
  }
}

// PUT - Update submission (mark success/failed, update DCN, notes, etc.)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserId();
    const { id } = await params;

    const existing = await (prisma as any).invoiceSubmission.findFirst({
      where: { id, userId },
    });
    if (!existing) return NextResponse.json({ error: 'Submission not found' }, { status: 404 });

    const body = await request.json();
    const updateData: Record<string, unknown> = {};

    if (body.status !== undefined) {
      updateData.status = body.status;
      if (body.status === 'success') updateData.responseAt = new Date();
    }
    if (body.responseDcn !== undefined) updateData.responseDcn = body.responseDcn;
    if (body.responseRaw !== undefined) updateData.responseRaw = body.responseRaw;
    if (body.errorMessage !== undefined) updateData.errorMessage = body.errorMessage;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.pdfPath !== undefined) updateData.pdfPath = body.pdfPath;
    if (body.amount !== undefined) updateData.amount = parseFloat(body.amount);

    const submission = await (prisma as any).invoiceSubmission.update({
      where: { id },
      data: updateData,
      include: {
        profile: { select: { name: true } },
      },
    });

    return NextResponse.json(submission);
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[UPS Submissions] Error:', error);
    return NextResponse.json({ error: 'Failed to update submission' }, { status: 500 });
  }
}

// DELETE - Delete a submission
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserId();
    const { id } = await params;

    const existing = await (prisma as any).invoiceSubmission.findFirst({
      where: { id, userId },
    });
    if (!existing) return NextResponse.json({ error: 'Submission not found' }, { status: 404 });

    await (prisma as any).invoiceSubmission.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[UPS Submissions] Error:', error);
    return NextResponse.json({ error: 'Failed to delete submission' }, { status: 500 });
  }
}
