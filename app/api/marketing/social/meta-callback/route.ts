import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

const META_APP_ID = process.env.META_APP_ID || '';
const META_APP_SECRET = process.env.META_APP_SECRET || '';
const REDIRECT_URI = `${process.env.NEXTAUTH_URL}/api/marketing/social/meta-callback`;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/admin/marketing/social?error=meta_denied`);
  }

  if (!code) {
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/admin/marketing/social?error=no_code`);
  }

  try {
    // 1. Exchange code for short-lived user access token
    const tokenUrl = `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&client_secret=${META_APP_SECRET}&code=${code}`;
    const tokenRes = await fetch(tokenUrl);
    const tokenData = await tokenRes.json();

    if (tokenData.error || !tokenData.access_token) {
      console.error('[Meta OAuth] Token exchange failed:', tokenData.error);
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/admin/marketing/social?error=token_failed`);
    }

    const shortToken = tokenData.access_token;

    // 2. Exchange for long-lived token (60 days)
    const longTokenUrl = `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${META_APP_ID}&client_secret=${META_APP_SECRET}&fb_exchange_token=${shortToken}`;
    const longTokenRes = await fetch(longTokenUrl);
    const longTokenData = await longTokenRes.json();
    const longToken = longTokenData.access_token || shortToken;
    const expiresIn = longTokenData.expires_in || 5184000; // default 60 days

    // 3. Get list of Facebook Pages
    const pagesRes = await fetch(`https://graph.facebook.com/v21.0/me/accounts?access_token=${longToken}`);
    const pagesData = await pagesRes.json();
    const pages = pagesData.data || [];

    if (pages.length === 0) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/admin/marketing/social?error=no_pages`);
    }

    // 4. For each page, find connected Instagram Business Account
    let saved = 0;
    for (const page of pages) {
      const igRes = await fetch(
        `https://graph.facebook.com/v21.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`
      );
      const igData = await igRes.json();

      if (!igData.instagram_business_account?.id) continue;

      const igAccountId = igData.instagram_business_account.id;

      // Get Instagram account name
      const igInfoRes = await fetch(
        `https://graph.facebook.com/v21.0/${igAccountId}?fields=name,username&access_token=${page.access_token}`
      );
      const igInfo = await igInfoRes.json();
      const accountName = igInfo.username || igInfo.name || page.name;

      const expiresAt = new Date(Date.now() + expiresIn * 1000);

      await (prisma as any).socialAccount.upsert({
        where: { id: igAccountId },
        create: {
          id: igAccountId,
          platform: 'instagram',
          accountId: igAccountId,
          accountName,
          pageId: page.id,
          accessToken: page.access_token,
          tokenExpiresAt: expiresAt,
          isActive: true,
        },
        update: {
          accountName,
          pageId: page.id,
          accessToken: page.access_token,
          tokenExpiresAt: expiresAt,
          isActive: true,
        },
      });
      saved++;
    }

    if (saved === 0) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/admin/marketing/social?error=no_instagram`);
    }

    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/admin/marketing/social?connected=true`);
  } catch (err) {
    console.error('[Meta Callback]', err);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/admin/marketing/social?error=server_error`);
  }
}
