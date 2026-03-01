import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const uid = (session?.user as any)?.id;
    if (!uid) {
      return NextResponse.json({ hasAccess: false, reason: 'not_logged_in' });
    }

    const user = await prisma.user.findUnique({
      where: { id: uid },
      select: { plan: true, planExpiresAt: true, role: true, permissions: true } as any,
    });

    if (!user) {
      return NextResponse.json({ hasAccess: false, reason: 'user_not_found' });
    }

    // Admin always has access
    if ((user as any).role === 'admin') {
      return NextResponse.json({ hasAccess: true, plan: (user as any).plan, isAdmin: true });
    }

    // Plans that include intelligence access
    const plansWithIntelligence = ['intelligence', 'starter', 'pro', 'business', 'managed'];
    const userPlan = (user as any).plan || 'none';

    if (!plansWithIntelligence.includes(userPlan)) {
      return NextResponse.json({ hasAccess: false, reason: 'no_subscription', plan: userPlan });
    }

    // Check if plan is expired
    const expiresAt = (user as any).planExpiresAt;
    if (expiresAt && new Date(expiresAt) < new Date()) {
      return NextResponse.json({ hasAccess: false, reason: 'expired', plan: userPlan, expiredAt: expiresAt });
    }

    return NextResponse.json({ hasAccess: true, plan: userPlan });
  } catch (error: any) {
    console.error('[Intelligence Check Access] Error:', error);
    return NextResponse.json({ hasAccess: false, reason: 'error' }, { status: 500 });
  }
}
