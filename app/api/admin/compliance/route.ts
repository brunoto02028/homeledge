import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const userId = await requireUserId();

    // Verify admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });
    if (user?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all identity checks with user info
    const checks = await (prisma as any).identityCheck.findMany({
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            idVerified: true,
            amlRiskLevel: true,
          },
        },
      },
    });

    // Compute stats
    const totalUsers = await prisma.user.count();
    const verifiedUsers = await prisma.user.count({
      where: { idVerified: true } as any,
    });
    const pendingChecks = await (prisma as any).identityCheck.count({
      where: { status: 'pending' },
    });
    const failedChecks = await (prisma as any).identityCheck.count({
      where: { status: 'failed' },
    });
    const amlHighRisk = await prisma.user.count({
      where: { amlRiskLevel: 'high' } as any,
    });

    return NextResponse.json({
      checks,
      stats: {
        totalUsers,
        verifiedUsers,
        pendingChecks,
        failedChecks,
        amlHighRisk,
      },
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[Admin Compliance] Error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
