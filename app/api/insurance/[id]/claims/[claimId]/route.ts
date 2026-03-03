import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// PUT /api/insurance/[id]/claims/[claimId] — Update a claim
export async function PUT(req: NextRequest, { params }: { params: { id: string; claimId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const existing = await (prisma as any).insuranceClaim.findFirst({
      where: { id: params.claimId, policyId: params.id, userId },
    });
    if (!existing) return NextResponse.json({ error: 'Claim not found' }, { status: 404 });

    const body = await req.json();
    const { claimDate, claimReference, status, amount, settledAmount, description, outcome } = body;

    const updated = await (prisma as any).insuranceClaim.update({
      where: { id: params.claimId },
      data: {
        claimDate: claimDate ? new Date(claimDate) : existing.claimDate,
        claimReference: claimReference ?? existing.claimReference,
        status: status || existing.status,
        amount: amount != null ? parseFloat(amount) : existing.amount,
        settledAmount: settledAmount != null ? parseFloat(settledAmount) : existing.settledAmount,
        description: description ?? existing.description,
        outcome: outcome ?? existing.outcome,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[Insurance Claims] PUT error:', error);
    return NextResponse.json({ error: 'Failed to update claim' }, { status: 500 });
  }
}

// DELETE /api/insurance/[id]/claims/[claimId] — Delete a claim
export async function DELETE(req: NextRequest, { params }: { params: { id: string; claimId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const existing = await (prisma as any).insuranceClaim.findFirst({
      where: { id: params.claimId, policyId: params.id, userId },
    });
    if (!existing) return NextResponse.json({ error: 'Claim not found' }, { status: 404 });

    await (prisma as any).insuranceClaim.delete({ where: { id: params.claimId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Insurance Claims] DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete claim' }, { status: 500 });
  }
}
