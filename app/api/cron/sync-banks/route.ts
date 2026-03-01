import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { refreshAccessToken, isConfigured } from '@/lib/truelayer';
import { syncConnectionTransactions } from '@/lib/open-banking-sync';

const REFRESH_BUFFER_MS = 10 * 60 * 1000; // Refresh 10 min before expiry
const RETRY_DELAY_MS = 2000;
const MAX_REFRESH_RETRIES = 2;

async function refreshWithRetry(refreshToken: string, retries = MAX_REFRESH_RETRIES): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await refreshAccessToken(refreshToken);
    } catch (err: any) {
      const isPermanent = err.message?.includes('invalid_grant') || err.message?.includes('401') || err.message?.includes('403');
      if (isPermanent || attempt === retries) throw err;
      console.log(`[CronSyncBanks] Token refresh attempt ${attempt} failed, retrying in ${RETRY_DELAY_MS}ms...`);
      await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
    }
  }
  throw new Error('Token refresh exhausted retries');
}

// GET /api/cron/sync-banks — Auto-sync for all active bank connections (runs 3x/day)
export async function GET() {
  const results: { connectionId: string; bank: string; synced: number; skipped: number; error?: string }[] = [];

  if (!isConfigured()) {
    console.log('[CronSyncBanks] TrueLayer not configured — skipping');
    return NextResponse.json({ success: true, connections: 0, results: [], message: 'TrueLayer not configured' });
  }

  try {
    // Include active AND expired connections that have a refresh token (attempt recovery)
    const connections = await (prisma as any).bankConnection.findMany({
      where: {
        status: { in: ['active', 'expired', 'error'] },
        refreshToken: { not: null },
      },
    });

    const activeCount = connections.filter((c: any) => c.status === 'active').length;
    const expiredCount = connections.filter((c: any) => c.status !== 'active').length;
    console.log(`[CronSyncBanks] Found ${connections.length} connections (${activeCount} active, ${expiredCount} expired/error) to process`);

    for (const conn of connections) {
      try {
        let accessToken = conn.accessToken;

        // Always refresh if: expired status, OR token about to expire, OR no token expiry recorded
        const expiresAt = conn.tokenExpiresAt ? new Date(conn.tokenExpiresAt).getTime() : 0;
        const needsRefresh = conn.status !== 'active' || expiresAt === 0 || expiresAt < (Date.now() + REFRESH_BUFFER_MS);

        if (needsRefresh) {
          const label = conn.bankName || conn.id;
          console.log(`[CronSyncBanks] ${label}: Status=${conn.status}, attempting token refresh...`);
          try {
            const refreshed = await refreshWithRetry(conn.refreshToken);
            accessToken = refreshed.access_token;
            await (prisma as any).bankConnection.update({
              where: { id: conn.id },
              data: {
                accessToken: refreshed.access_token,
                refreshToken: refreshed.refresh_token,
                tokenExpiresAt: new Date(Date.now() + refreshed.expires_in * 1000),
                status: 'active',
                lastSyncError: null,
              },
            });
            console.log(`[CronSyncBanks] ${label}: Token refreshed OK → active, new expiry in ${refreshed.expires_in}s`);
          } catch (err: any) {
            const errorMsg = err.message?.substring(0, 200) || 'Token refresh failed';
            const isPermanent = errorMsg.includes('invalid_grant') || errorMsg.includes('consent') || errorMsg.includes('revoked');
            console.error(`[CronSyncBanks] ${conn.bankName || conn.id}: Token refresh FAILED (${isPermanent ? 'PERMANENT' : 'temporary'}):`, errorMsg);
            await (prisma as any).bankConnection.update({
              where: { id: conn.id },
              data: {
                status: 'expired',
                lastSyncError: isPermanent
                  ? 'Bank consent expired (90-day limit) — please reconnect your bank'
                  : 'Token refresh failed — will retry next sync cycle',
              },
            });
            results.push({ connectionId: conn.id, bank: conn.bankName || '?', synced: 0, skipped: 0, error: isPermanent ? 'Consent expired — reconnect required' : 'Token refresh failed — will retry' });
            continue;
          }
        }

        // Incremental sync: from last sync (or 30 days ago) to now
        const now = new Date();
        const from = conn.lastSyncAt ? new Date(conn.lastSyncAt) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        // Add 1 day buffer before lastSyncAt to catch any pending transactions
        from.setDate(from.getDate() - 1);

        const result = await syncConnectionTransactions({
          connectionId: conn.id,
          accessToken,
          userId: conn.userId,
          fromDate: from.toISOString().split('T')[0],
          toDate: now.toISOString().split('T')[0],
        });

        if (result.code === 'SCA_EXCEEDED' || result.code === 'ALREADY_SYNCED') {
          results.push({ connectionId: conn.id, bank: result.bank || conn.bankName, synced: 0, skipped: 0, error: result.code });
          continue;
        }

        results.push({ connectionId: conn.id, bank: result.bank, synced: result.synced, skipped: result.skipped });
      } catch (err: any) {
        console.error(`[CronSyncBanks] Error syncing ${conn.id}:`, err.message);
        await (prisma as any).bankConnection.update({
          where: { id: conn.id },
          data: { lastSyncError: err.message?.substring(0, 500) },
        }).catch(() => {});
        results.push({ connectionId: conn.id, bank: conn.bankName || '?', synced: 0, skipped: 0, error: err.message });
      }
    }

    console.log(`[CronSyncBanks] Complete. Results:`, JSON.stringify(results));
    return NextResponse.json({ success: true, connections: connections.length, results });
  } catch (error: any) {
    console.error('[CronSyncBanks] Fatal error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
