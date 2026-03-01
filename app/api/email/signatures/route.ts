import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/email/signatures
export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const signatures = await (prisma as any).emailSignature.findMany({
    where: { userId },
    orderBy: { createdAt: 'asc' },
  });
  return NextResponse.json(signatures);
}

// POST /api/email/signatures
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { name, bodyHtml, isDefault } = body;

  if (!name || !bodyHtml) {
    return NextResponse.json({ error: 'Name and body are required' }, { status: 400 });
  }

  // If setting as default, unset other defaults
  if (isDefault) {
    await (prisma as any).emailSignature.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });
  }

  const sig = await (prisma as any).emailSignature.create({
    data: { userId, name, bodyHtml, isDefault: isDefault || false },
  });
  return NextResponse.json(sig);
}

// PUT /api/email/signatures
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { id, name, bodyHtml, isDefault } = body;
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  const sig = await (prisma as any).emailSignature.findFirst({ where: { id, userId } });
  if (!sig) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (isDefault) {
    await (prisma as any).emailSignature.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });
  }

  const updated = await (prisma as any).emailSignature.update({
    where: { id },
    data: { name: name || sig.name, bodyHtml: bodyHtml || sig.bodyHtml, isDefault: isDefault ?? sig.isDefault },
  });
  return NextResponse.json(updated);
}

// DELETE /api/email/signatures?id=xxx
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

  const sig = await (prisma as any).emailSignature.findFirst({ where: { id, userId } });
  if (!sig) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await (prisma as any).emailSignature.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
