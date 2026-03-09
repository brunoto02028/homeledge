import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session!.user as any).id;

  const rules = await prisma.automationRule.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { logs: true } },
      logs: { take: 1, orderBy: { runAt: 'desc' }, select: { status: true, message: true, runAt: true } },
    },
  });

  return NextResponse.json(rules);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session!.user as any).id;

  const body = await req.json();
  const { name, description, trigger, triggerConfig, action, actionConfig } = body;

  if (!name || !trigger || !action) {
    return NextResponse.json({ error: 'name, trigger and action are required' }, { status: 400 });
  }

  const rule = await prisma.automationRule.create({
    data: {
      userId,
      name,
      description: description || null,
      trigger,
      triggerConfig: triggerConfig || null,
      action,
      actionConfig: actionConfig || null,
      isActive: true,
    },
  });

  return NextResponse.json(rule, { status: 201 });
}
