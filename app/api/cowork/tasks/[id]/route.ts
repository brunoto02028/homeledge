import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { name, description, schedule, isActive, requiresApproval, context, notifyEmail, notifySms, notifyInApp } = body;

  const task = await (prisma as any).claudeTask.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(description !== undefined ? { description } : {}),
      ...(schedule !== undefined ? { schedule } : {}),
      ...(isActive !== undefined ? { isActive } : {}),
      ...(requiresApproval !== undefined ? { requiresApproval } : {}),
      ...(context !== undefined ? { context } : {}),
      ...(notifyEmail !== undefined ? { notifyEmail } : {}),
      ...(notifySms !== undefined ? { notifySms } : {}),
      ...(notifyInApp !== undefined ? { notifyInApp } : {}),
    },
  });

  return NextResponse.json({ task });
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await (prisma as any).claudeTask.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
