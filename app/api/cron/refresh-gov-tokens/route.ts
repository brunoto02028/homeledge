import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { refreshCHToken, refreshHMRCToken } from '@/lib/government-api';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/cron/refresh-gov-tokens — Proactive government token refresh (runs every 30 min)
 * 
 * Keeps Companies House and HMRC OAuth tokens alive by refreshing before expiry.
 * CH tokens expire every 60 min, HMRC tokens every 4 hours.
 * Refresh buffer: 15 min before expiry.
 */

const REFRESH_BUFFER_MS = 15 * 60 * 1000; // Refresh 15 min before expiry
const MAX_RETRIES = 2;
const RETRY_DELAY_MS = 3000;

async function refreshWithRetry(
  provider: string,
  refreshToken: string
): Promise<{ access_token: string; refresh_token?: string; expires_in: number }> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      if (provider === 'companies_house') {
        return await refreshCHToken(refreshToken);
      } else {
        return await refreshHMRCToken(refreshToken);
      }
    } catch (err: any) {
      const isPermanent =
        err.message?.includes('invalid_grant') ||
        err.message?.includes('RECONNECT_REQUIRED') ||
        err.message?.includes('401') ||
        err.message?.includes('403');
      if (isPermanent || attempt === MAX_RETRIES) throw err;
      console.log(`[RefreshGovTokens] ${provider} attempt ${attempt} failed, retrying...`);
      await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
    }
  }
  throw new Error('Gov token refresh exhausted retries');
}

export async function GET() {
  const results: { id: string; provider: string; entity: string; result: string }[] = [];

  try {
    const connections = await (prisma as any).governmentConnection.findMany({
      where: {
        status: { in: ['active', 'expired', 'error'] },
        refreshToken: { not: null },
      },
    });

    if (connections.length === 0) {
      return NextResponse.json({ success: true, message: 'No government connections to refresh', results: [] });
    }

    const now = Date.now();

    for (const conn of connections) {
      const label = `${conn.provider.toUpperCase()} (${conn.companyNumber || conn.entityId || '?'})`;
      const expiresAt = conn.tokenExpiresAt ? new Date(conn.tokenExpiresAt).getTime() : 0;

      // Refresh if: expired, about to expire, no expiry recorded, or status is not active
      const needsRefresh =
        conn.status !== 'active' ||
        expiresAt === 0 ||
        expiresAt < now + REFRESH_BUFFER_MS;

      if (!needsRefresh) {
        const minsLeft = Math.round((expiresAt - now) / 60000);
        results.push({ id: conn.id, provider: conn.provider, entity: label, result: `skipped — ${minsLeft}min left` });
        continue;
      }

      try {
        const refreshed = await refreshWithRetry(conn.provider, conn.refreshToken);

        await (prisma as any).governmentConnection.update({
          where: { id: conn.id },
          data: {
            accessToken: refreshed.access_token,
            refreshToken: refreshed.refresh_token || conn.refreshToken,
            tokenExpiresAt: new Date(now + refreshed.expires_in * 1000),
            status: 'active',
            lastError: null,
          },
        });

        console.log(`[RefreshGovTokens] ${label}: Refreshed OK, expires in ${refreshed.expires_in}s`);
        results.push({ id: conn.id, provider: conn.provider, entity: label, result: 'refreshed' });
      } catch (err: any) {
        const errorMsg = err.message?.substring(0, 300) || 'Token refresh failed';
        const isPermanent =
          errorMsg.includes('invalid_grant') ||
          errorMsg.includes('RECONNECT_REQUIRED') ||
          errorMsg.includes('consent') ||
          errorMsg.includes('revoked');

        if (isPermanent) {
          await (prisma as any).governmentConnection.update({
            where: { id: conn.id },
            data: {
              status: 'expired',
              lastError: 'Token expired — please reconnect your account',
            },
          });
          console.error(`[RefreshGovTokens] ${label}: PERMANENT failure — marked expired`);
          results.push({ id: conn.id, provider: conn.provider, entity: label, result: 'expired — reconnect required' });
        } else {
          // Temporary failure — keep status, log error
          await (prisma as any).governmentConnection.update({
            where: { id: conn.id },
            data: {
              lastError: `Temp refresh failure: ${errorMsg.slice(0, 200)}`,
            },
          });
          console.log(`[RefreshGovTokens] ${label}: Temp failure — will retry next cycle`);
          results.push({ id: conn.id, provider: conn.provider, entity: label, result: `temp failure — ${errorMsg.slice(0, 100)}` });
        }
      }
    }

    console.log(`[RefreshGovTokens] Complete: ${results.length} connections processed`);
    return NextResponse.json({ success: true, processed: results.length, results });
  } catch (error: any) {
    console.error('[RefreshGovTokens] Fatal error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
