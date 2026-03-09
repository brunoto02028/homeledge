import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session!.user as any).id;

  const { searchParams } = req.nextUrl;
  const ruleId = searchParams.get('ruleId');
  const limit = parseInt(searchParams.get('limit') || '50');

  const logs = await prisma.automationLog.findMany({
    where: {
      userId,
      ...(ruleId ? { ruleId } : {}),
    },
    orderBy: { runAt: 'desc' },
    take: limit,
    include: { rule: { select: { name: true, trigger: true, action: true } } },
  });

  return NextResponse.json(logs);
}
