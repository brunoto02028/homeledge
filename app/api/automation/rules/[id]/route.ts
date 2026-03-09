import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session!.user as any).id;

  const body = await req.json();
  const rule = await prisma.automationRule.findFirst({ where: { id: params.id, userId } });
  if (!rule) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const updated = await prisma.automationRule.update({
    where: { id: params.id },
    data: {
      name: body.name ?? rule.name,
      description: body.description !== undefined ? body.description : rule.description,
      trigger: body.trigger ?? rule.trigger,
      triggerConfig: body.triggerConfig !== undefined ? body.triggerConfig : rule.triggerConfig,
      action: body.action ?? rule.action,
      actionConfig: body.actionConfig !== undefined ? body.actionConfig : rule.actionConfig,
      isActive: body.isActive !== undefined ? body.isActive : rule.isActive,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session!.user as any).id;

  const rule = await prisma.automationRule.findFirst({ where: { id: params.id, userId } });
  if (!rule) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.automationRule.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
