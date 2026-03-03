import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/insurance/[id]/claims — List claims for a policy
export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Verify policy belongs to user
    const policy = await prisma.insurancePolicy.findFirst({ where: { id: params.id, userId } });
    if (!policy) return NextResponse.json({ error: 'Policy not found' }, { status: 404 });

    const claims = await (prisma as any).insuranceClaim.findMany({
      where: { policyId: params.id, userId },
      orderBy: { claimDate: 'desc' },
    });

    return NextResponse.json(claims);
  } catch (error) {
    console.error('[Insurance Claims] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch claims' }, { status: 500 });
  }
}

// POST /api/insurance/[id]/claims — Create a new claim
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const policy = await prisma.insurancePolicy.findFirst({ where: { id: params.id, userId } });
    if (!policy) return NextResponse.json({ error: 'Policy not found' }, { status: 404 });

    const body = await req.json();
    const { claimDate, claimReference, status, amount, description } = body;

    if (!claimDate) {
      return NextResponse.json({ error: 'Claim date is required' }, { status: 400 });
    }

    const claim = await (prisma as any).insuranceClaim.create({
      data: {
        policyId: params.id,
        userId,
        claimDate: new Date(claimDate),
        claimReference: claimReference || null,
        status: status || 'submitted',
        amount: amount != null ? parseFloat(amount) : null,
        description: description || null,
      },
    });

    return NextResponse.json(claim, { status: 201 });
  } catch (error) {
    console.error('[Insurance Claims] POST error:', error);
    return NextResponse.json({ error: 'Failed to create claim' }, { status: 500 });
  }
}
