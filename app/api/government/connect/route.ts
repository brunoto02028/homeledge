import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId } from '@/lib/auth';
import { buildCHAuthUrl, buildHMRCAuthUrl } from '@/lib/government-api';
import crypto from 'crypto';

// POST /api/government/connect — Initiate OAuth flow for CH or HMRC
export async function POST(request: Request) {
  try {
    console.log('[Gov Connect] POST received');
    const userId = await requireUserId();
    console.log('[Gov Connect] userId:', userId);
    const body = await request.json();
    const { provider, entityId, companyNumber, authCode } = body;
    console.log('[Gov Connect] Body:', { provider, entityId, companyNumber, authCode: authCode ? '***' : 'none' });

    if (!provider || !['companies_house', 'hmrc'].includes(provider)) {
      return NextResponse.json({ error: 'Invalid provider. Use "companies_house" or "hmrc".' }, { status: 400 });
    }

    if (!entityId) {
      return NextResponse.json({ error: 'entityId is required. Select an entity to connect.' }, { status: 400 });
    }

    // Verify entity belongs to user
    const entity = await (prisma as any).entity.findFirst({
      where: { id: entityId, userId },
    });
    if (!entity) {
      console.log('[Gov Connect] Entity not found:', entityId);
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 });
    }
    console.log('[Gov Connect] Entity found:', entity.name);

    // Generate state token for CSRF protection
    const state = crypto.randomBytes(32).toString('hex');

    // Build authorization URL first (before creating state event)
    let authUrl: string;

    if (provider === 'companies_house') {
      if (!companyNumber) {
        return NextResponse.json({ error: 'companyNumber is required for Companies House connection' }, { status: 400 });
      }

      authUrl = buildCHAuthUrl(state, companyNumber);
      console.log('[Gov Connect] CH Auth URL FULL:', authUrl);

      // Pre-check: test actual OAuth authorize endpoint (not just root health)
      try {
        const testRes = await fetch(authUrl, {
          method: 'GET',
          redirect: 'manual', // don't follow redirects — we just check status
          signal: AbortSignal.timeout(8000),
        });
        console.log('[Gov Connect] CH authorize endpoint status:', testRes.status);
        // 302 = healthy (redirects to sign-in page), 200 with error page = broken
        if (testRes.status === 200) {
          // CH returns 200 with error page HTML when broken; healthy flow returns 302
          const body = await testRes.text();
          if (body.includes('Sorry, there is a problem with the service') || body.includes('there-is-an-error')) {
            console.log('[Gov Connect] CH authorize endpoint is DOWN (error page detected)');
            return NextResponse.json({
              error: 'Companies House OAuth service is currently down — their authorize page shows "Sorry, there is a problem with the service". This is on their side. Please try again later.',
              chDown: true,
            }, { status: 503 });
          }
        }
      } catch (healthErr: any) {
        console.log('[Gov Connect] CH authorize check failed:', healthErr.message);
        return NextResponse.json({
          error: 'Companies House identity service is currently unreachable. Please try again later.',
          chDown: true,
        }, { status: 503 });
      }
    } else {
      // HMRC
      authUrl = buildHMRCAuthUrl(state);
      console.log('[Gov Connect] HMRC Auth URL built');
    }

    // Store state in Event model for validation on callback (AFTER pre-check passes)
    await prisma.event.create({
      data: {
        userId,
        eventType: 'gov.oauth_started',
        entityType: 'government_connection',
        entityId: entityId,
        payload: {
          provider,
          state,
          companyNumber: companyNumber || null,
          authCode: authCode || null,
          entityId,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 min expiry
        },
      },
    });
    console.log('[Gov Connect] State event created, returning authUrl');

    return NextResponse.json({
      authUrl,
      state,
      provider,
      entityId,
    });
  } catch (error: any) {
    console.error('[Gov Connect] POST Error:', error.message, error.stack?.slice(0, 300));
    return NextResponse.json({ error: error.message || 'Failed to initiate connection' }, { status: 500 });
  }
}

// GET /api/government/connect — List connections for user
export async function GET(request: Request) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(request.url);
    const entityId = searchParams.get('entityId');

    const where: any = { userId };
    if (entityId) where.entityId = entityId;

    const connections = await (prisma as any).governmentConnection.findMany({
      where,
      select: {
        id: true,
        entityId: true,
        provider: true,
        companyNumber: true,
        govGatewayId: true,
        status: true,
        lastSyncAt: true,
        lastError: true,
        connectedAt: true,
        scope: true,
        profileData: true,
      },
      orderBy: { connectedAt: 'desc' },
    });

    return NextResponse.json(connections);
  } catch (error: any) {
    console.error('[Government Connect] GET Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch connections' }, { status: 500 });
  }
}
