import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST /api/admin/plans/assign — Admin only: assign a plan to a user
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { userId, planName, expiresAt } = await req.json();

    if (!userId || !planName) {
      return NextResponse.json({ error: 'userId and planName are required' }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        plan: planName,
        planExpiresAt: expiresAt ? new Date(expiresAt) : null,
      },
      select: { id: true, email: true, fullName: true, plan: true, planExpiresAt: true },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error('Error assigning plan:', error);
    return NextResponse.json({ error: 'Failed to assign plan' }, { status: 500 });
  }
}
