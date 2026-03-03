import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// Lightweight endpoint that returns fresh permissions + hiddenModules from DB
// Used by sidebar for real-time permission updates without JWT caching
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    if (!userId) {
      return NextResponse.json({ error: 'No user ID' }, { status: 400 });
    }

    const user = await (prisma as any).user.findUnique({
      where: { id: userId },
      select: { permissions: true, hiddenModules: true, role: true, plan: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      permissions: user.permissions || [],
      hiddenModules: user.hiddenModules || [],
      role: user.role,
      plan: user.plan,
    });
  } catch (error) {
    console.error('[permissions] Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
