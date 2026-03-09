import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

const META_APP_ID = process.env.META_APP_ID || '';
const META_APP_SECRET = process.env.META_APP_SECRET || '';
const REDIRECT_URI = `${process.env.NEXTAUTH_URL}/api/marketing/social/meta-callback`;

// GET — returns the OAuth URL to redirect the admin to Meta
export async function GET() {
  try {
    const userId = await requireUserId();
    const user = await (prisma as any).user.findUnique({ where: { id: userId }, select: { role: true } });
    if (user?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    if (!META_APP_ID) {
      return NextResponse.json({ error: 'META_APP_ID not configured. Set META_APP_ID and META_APP_SECRET in .env.production' }, { status: 503 });
    }

    const scopes = [
      'instagram_basic',
      'instagram_content_publish',
      'instagram_manage_insights',
      'pages_show_list',
      'pages_read_engagement',
    ].join(',');

    const authUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${scopes}&response_type=code`;

    return NextResponse.json({ authUrl });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
