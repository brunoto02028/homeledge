import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { exchangeCHToken, getCompanyProfile } from '@/lib/government-api';

// GET /api/government/callback/companies-house — OAuth callback from Companies House
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      console.error('[CH Callback] OAuth error:', error);
      return NextResponse.redirect(new URL(`/entities?error=${encodeURIComponent(error)}`, process.env.NEXTAUTH_URL || 'http://localhost:3000'));
    }

    if (!code || !state) {
      return NextResponse.redirect(new URL('/entities?error=missing_params', process.env.NEXTAUTH_URL || 'http://localhost:3000'));
    }

    // Helper to build redirect URL back to entity page
    const buildRedirect = (entityId: string | null, params: string) => {
      if (entityId) return new URL(`/entities/${entityId}?${params}`, process.env.NEXTAUTH_URL || 'http://localhost:3000');
      return new URL(`/entities?${params}`, process.env.NEXTAUTH_URL || 'http://localhost:3000');
    };

    // Find the OAuth state event
    const stateEvents = await prisma.event.findMany({
      where: {
        eventType: 'gov.oauth_started',
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const stateEvent = stateEvents.find((e: any) => {
      const payload = e.payload as any;
      return payload?.state === state && payload?.provider === 'companies_house';
    });

    if (!stateEvent) {
      return NextResponse.redirect(new URL('/entities?error=invalid_state', process.env.NEXTAUTH_URL || 'http://localhost:3000'));
    }


    const payload = stateEvent.payload as any;
    const { entityId, companyNumber, authCode } = payload;
    const userId = stateEvent.userId;

    // Check expiry
    if (new Date(payload.expiresAt) < new Date()) {
      return NextResponse.redirect(buildRedirect(entityId, 'error=state_expired'));
    }

    // Exchange code for token
    const tokenResult = await exchangeCHToken(code);

    // Fetch company profile
    let profileData = null;
    try {
      profileData = await getCompanyProfile(companyNumber);
    } catch { /* non-fatal */ }

    // Upsert connection
    await (prisma as any).governmentConnection.upsert({
      where: {
        userId_entityId_provider: {
          userId,
          entityId,
          provider: 'companies_house',
        },
      },
      update: {
        accessToken: tokenResult.access_token,
        refreshToken: tokenResult.refresh_token || null,
        tokenExpiresAt: new Date(Date.now() + tokenResult.expires_in * 1000),
        companyNumber,
        authCode: authCode || null,
        status: 'active',
        lastError: null,
        profileData,
      },
      create: {
        userId,
        entityId,
        provider: 'companies_house',
        accessToken: tokenResult.access_token,
        refreshToken: tokenResult.refresh_token || null,
        tokenExpiresAt: new Date(Date.now() + tokenResult.expires_in * 1000),
        scope: tokenResult.scope || null,
        companyNumber,
        authCode: authCode || null,
        status: 'active',
        profileData,
      },
    });

    // Log event
    await prisma.event.create({
      data: {
        userId,
        eventType: 'gov.ch_connected',
        entityType: 'government_connection',
        entityId,
        payload: { companyNumber, provider: 'companies_house' },
      },
    });

    // Cleanup state event
    await prisma.event.delete({ where: { id: stateEvent.id } }).catch(() => {});

    return NextResponse.redirect(buildRedirect(entityId, 'ch_connected=true'));
  } catch (error: any) {
    console.error('[CH Callback] Error:', error);
    return NextResponse.redirect(new URL(`/entities?error=${encodeURIComponent(error.message || 'ch_callback_failed')}`, process.env.NEXTAUTH_URL || 'http://localhost:3000'));
  }
}
