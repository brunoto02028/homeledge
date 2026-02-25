import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId } from '@/lib/auth';
import { performAmlCheck } from '@/lib/yoti-client';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const body = await request.json();
    const { givenNames, familyName, dateOfBirth, country } = body;

    if (!givenNames || !familyName) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Perform AML check via Yoti
    const result = await performAmlCheck({
      givenNames,
      familyName,
      dateOfBirth,
      country: country || 'GBR',
    });

    // Save identity check record
    await (prisma as any).identityCheck.create({
      data: {
        userId,
        type: 'aml',
        provider: 'yoti',
        status: 'completed',
        result: result as any,
        completedAt: new Date(),
      },
    });

    // Update user AML fields
    await prisma.user.update({
      where: { id: userId },
      data: {
        amlScreenedAt: new Date(),
        amlRiskLevel: result.riskLevel,
      } as any,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[AML Check] Error:', error);
    return NextResponse.json({ error: 'AML check failed' }, { status: 500 });
  }
}
