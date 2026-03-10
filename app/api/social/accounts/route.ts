import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const accounts = await (prisma as any).socialAccount.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ accounts });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { platform, accountId, accountName, pageId, accessToken } = body;

  if (!platform || !accountId || !accountName || !accessToken) {
    return NextResponse.json({ error: 'platform, accountId, accountName and accessToken required' }, { status: 400 });
  }

  const account = await (prisma as any).socialAccount.upsert({
    where: { id: accountId },
    create: { platform, accountId, accountName, pageId: pageId || null, accessToken, isActive: true },
    update: { accountName, pageId: pageId || null, accessToken, isActive: true },
  });

  return NextResponse.json({ account });
}
