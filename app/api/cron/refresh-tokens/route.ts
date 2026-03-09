import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { refreshAccessToken, isConfigured } from '@/lib/truelayer';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * GET /api/cron/refresh-tokens — Proactive token refresh (runs every hour)
 * 
 * Lightweight cron that ONLY refreshes tokens about to expire.
 * Does NOT sync transactions — that's handled by sync-banks (3x/day).
 * This prevents connections from appearing "expired" between sync runs.
 */

const REFRESH_BUFFER_MS = 20 * 60 * 1000; // Refresh 20 min before expiry
const RETRY_DELAY_MS = 3000;
const MAX_RETRIES = 3;

async function refreshWithRetry(refreshToken: string): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await refreshAccessToken(refreshToken);
    } catch (err: any) {
      const isPermanent = err.message?.includes('invalid_grant') || err.message?.includes('401') || err.message?.includes('403');
      if (isPermanent || attempt === MAX_RETRIES) throw err;
      console.log(`[RefreshTokens] Attempt ${attempt} failed, retrying in ${RETRY_DELAY_MS}ms...`);
      await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
    }
  }
  throw new Error('Token refresh exhausted retries');
}

export async function GET() {
  if (!isConfigured()) {
    return NextResponse.json({ success: true, message: 'TrueLayer not configured' });
  }

  const results: { id: string; bank: string; result: string }[] = [];

  try {
    // Find all connections that have a refresh token and are active/expired/error
    const connections = await (prisma as any).bankConnection.findMany({
      where: {
        status: { in: ['active', 'expired', 'error'] },
        refreshToken: { not: null },
      },
    });

    const now = Date.now();

    for (const conn of connections) {
      const label = conn.bankName || conn.id;
      const expiresAt = conn.tokenExpiresAt ? new Date(conn.tokenExpiresAt).getTime() : 0;

      // Only refresh if: token expired, about to expire, no expiry recorded, or status is not active
      const needsRefresh = conn.status !== 'active' || expiresAt === 0 || expiresAt < (now + REFRESH_BUFFER_MS);

      if (!needsRefresh) {
        results.push({ id: conn.id, bank: label, result: 'skipped — token still valid' });
        continue;
      }

      try {
        const refreshed = await refreshWithRetry(conn.refreshToken);

        await (prisma as any).bankConnection.update({
          where: { id: conn.id },
          data: {
            accessToken: refreshed.access_token,
            refreshToken: refreshed.refresh_token,
            tokenExpiresAt: new Date(now + refreshed.expires_in * 1000),
            status: 'active',
            lastSyncError: null,
            metadata: { ...(conn.metadata || {}), failedRefreshCount: 0 },
          },
        });

        console.log(`[RefreshTokens] ${label}: Refreshed OK, expires in ${refreshed.expires_in}s`);
        results.push({ id: conn.id, bank: label, result: 'refreshed' });
      } catch (err: any) {
        const errorMsg = err.message?.substring(0, 200) || 'Token refresh failed';
        const isPermanent = errorMsg.includes('invalid_grant') || errorMsg.includes('consent') || errorMsg.includes('revoked');

        if (isPermanent) {
          await (prisma as any).bankConnection.update({
            where: { id: conn.id },
            data: {
              status: 'expired',
              lastSyncError: 'Bank consent expired (90-day limit) — please reconnect your bank',
              metadata: { ...(conn.metadata || {}), failedRefreshCount: 0 },
            },
          });
          console.error(`[RefreshTokens] ${label}: PERMANENT failure — marked expired`);
          results.push({ id: conn.id, bank: label, result: 'expired — consent revoked' });
        } else {
          // Temporary failure: keep status unchanged, increment failure counter
          const prevFails = (conn.metadata as any)?.failedRefreshCount || 0;
          const failCount = prevFails + 1;
          const maxRetries = 10; // More lenient here since this runs hourly

          if (failCount >= maxRetries) {
            await (prisma as any).bankConnection.update({
              where: { id: conn.id },
              data: {
                status: 'expired',
                lastSyncError: `Token refresh failed ${failCount} consecutive times — please reconnect your bank`,
                metadata: { ...(conn.metadata || {}), failedRefreshCount: failCount },
              },
            });
            console.error(`[RefreshTokens] ${label}: ${failCount} consecutive failures — marked expired`);
            results.push({ id: conn.id, bank: label, result: `expired after ${failCount} failures` });
          } else {
            await (prisma as any).bankConnection.update({
              where: { id: conn.id },
              data: {
                lastSyncError: `Token refresh attempt ${failCount}/${maxRetries} failed — will retry next hour`,
                metadata: { ...(conn.metadata || {}), failedRefreshCount: failCount },
              },
            });
            console.log(`[RefreshTokens] ${label}: Temp failure ${failCount}/${maxRetries} — keeping active`);
            results.push({ id: conn.id, bank: label, result: `temp failure ${failCount}/${maxRetries}` });
          }
        }
      }
    }

    console.log(`[RefreshTokens] Complete: ${results.length} connections processed`);
    return NextResponse.json({ success: true, processed: results.length, results });
  } catch (error: any) {
    console.error('[RefreshTokens] Fatal error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
