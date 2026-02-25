import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { exchangeHMRCToken, hmrcApiGet } from '@/lib/government-api';

// GET /api/government/callback/hmrc — OAuth callback from HMRC Government Gateway
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      console.error('[HMRC Callback] OAuth error:', error);
      return NextResponse.redirect(new URL(`/entities?error=${encodeURIComponent(error)}`, process.env.NEXTAUTH_URL || 'http://localhost:3000'));
    }

    if (!code || !state) {
      return NextResponse.redirect(new URL('/entities?error=missing_params', process.env.NEXTAUTH_URL || 'http://localhost:3000'));
    }

    // Find the OAuth state event
    const stateEvents = await prisma.event.findMany({
      where: { eventType: 'gov.oauth_started' },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const stateEvent = stateEvents.find((e: any) => {
      const payload = e.payload as any;
      return payload?.state === state && payload?.provider === 'hmrc';
    });

    if (!stateEvent) {
      return NextResponse.redirect(new URL('/entities?error=invalid_state', process.env.NEXTAUTH_URL || 'http://localhost:3000'));
    }

    const payload = stateEvent.payload as any;
    const { entityId } = payload;
    const userId = stateEvent.userId;

    // Check expiry
    if (new Date(payload.expiresAt) < new Date()) {
      const hmrcRedirect = entityId ? `/entities/${entityId}?error=state_expired` : '/entities?error=state_expired';
      return NextResponse.redirect(new URL(hmrcRedirect, process.env.NEXTAUTH_URL || 'http://localhost:3000'));
    }

    // Exchange code for token
    const tokenResult = await exchangeHMRCToken(code);

    // Upsert connection
    await (prisma as any).governmentConnection.upsert({
      where: {
        userId_entityId_provider: {
          userId,
          entityId,
          provider: 'hmrc',
        },
      },
      update: {
        accessToken: tokenResult.access_token,
        refreshToken: tokenResult.refresh_token || null,
        tokenExpiresAt: new Date(Date.now() + tokenResult.expires_in * 1000),
        status: 'active',
        lastError: null,
      },
      create: {
        userId,
        entityId,
        provider: 'hmrc',
        accessToken: tokenResult.access_token,
        refreshToken: tokenResult.refresh_token || null,
        tokenExpiresAt: new Date(Date.now() + tokenResult.expires_in * 1000),
        scope: tokenResult.token_type || null,
        status: 'active',
      },
    });

    // Auto-fetch profile data from HMRC and update entity
    try {
      // Try individual details first
      let profileData: any = null;
      try {
        profileData = await hmrcApiGet('/individuals/details', tokenResult.access_token, '2.0');
      } catch {
        // May not have scope, try alternative
        try {
          profileData = await hmrcApiGet('/individual-income', tokenResult.access_token, '1.2');
        } catch { /* ignore */ }
      }

      if (profileData && entityId) {
        const updateData: any = {};

        // Extract name from HMRC profile
        if (profileData.individual?.firstName && profileData.individual?.lastName) {
          updateData.name = `${profileData.individual.firstName} ${profileData.individual.lastName}`;
        } else if (profileData.name?.forename && profileData.name?.surname) {
          updateData.name = `${profileData.name.forename} ${profileData.name.surname}`;
        }

        // Extract NI number
        if (profileData.individual?.nino) {
          updateData.niNumber = profileData.individual.nino;
        } else if (profileData.nino) {
          updateData.niNumber = profileData.nino;
        }

        // Extract address
        if (profileData.individual?.address) {
          const a = profileData.individual.address;
          updateData.registeredAddress = [a.line1, a.line2, a.line3, a.line4, a.postcode].filter(Boolean).join(', ');
        } else if (profileData.address) {
          const a = profileData.address;
          updateData.registeredAddress = [a.line1, a.line2, a.line3, a.postcode].filter(Boolean).join(', ');
        }

        // Only update non-empty fields
        const filteredUpdate = Object.fromEntries(Object.entries(updateData).filter(([_, v]) => v));
        if (Object.keys(filteredUpdate).length > 0) {
          await (prisma as any).entity.update({
            where: { id: entityId },
            data: filteredUpdate,
          });
        }

        // Cache profile data on connection
        await (prisma as any).governmentConnection.update({
          where: { userId_entityId_provider: { userId, entityId, provider: 'hmrc' } },
          data: { profileData },
        });
      }
    } catch (profileError: any) {
      console.warn('[HMRC Callback] Auto-fetch profile failed (non-critical):', profileError.message);
    }

    // Log event
    await prisma.event.create({
      data: {
        userId,
        eventType: 'gov.hmrc_connected',
        entityType: 'government_connection',
        entityId,
        payload: { provider: 'hmrc' },
      },
    });

    // Cleanup state event
    await prisma.event.delete({ where: { id: stateEvent.id } }).catch(() => {});

    const successUrl = entityId ? `/entities/${entityId}?hmrc_connected=true` : '/entities?hmrc_connected=true';
    return NextResponse.redirect(new URL(successUrl, process.env.NEXTAUTH_URL || 'http://localhost:3000'));
  } catch (error: any) {
    console.error('[HMRC Callback] Error:', error);
    return NextResponse.redirect(new URL(`/entities?error=${encodeURIComponent(error.message || 'hmrc_callback_failed')}`, process.env.NEXTAUTH_URL || 'http://localhost:3000'));
  }
}
