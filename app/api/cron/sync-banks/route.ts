import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { refreshAccessToken } from '@/lib/truelayer';
import { syncConnectionTransactions } from '@/lib/open-banking-sync';

// GET /api/cron/sync-banks — Auto-sync for all active bank connections (runs 3x/day)
export async function GET() {
  const results: { connectionId: string; bank: string; synced: number; skipped: number; error?: string }[] = [];

  try {
    const connections = await (prisma as any).bankConnection.findMany({
      where: { status: 'active' },
    });

    console.log(`[CronSyncBanks] Found ${connections.length} active connections to sync`);

    for (const conn of connections) {
      try {
        let accessToken = conn.accessToken;

        // Refresh token if expired
        if (conn.tokenExpiresAt && new Date(conn.tokenExpiresAt) < new Date()) {
          try {
            const refreshed = await refreshAccessToken(conn.refreshToken);
            accessToken = refreshed.access_token;
            await (prisma as any).bankConnection.update({
              where: { id: conn.id },
              data: {
                accessToken: refreshed.access_token,
                refreshToken: refreshed.refresh_token,
                tokenExpiresAt: new Date(Date.now() + refreshed.expires_in * 1000),
              },
            });
          } catch (err: any) {
            await (prisma as any).bankConnection.update({
              where: { id: conn.id },
              data: { status: 'expired', lastSyncError: 'Token refresh failed' },
            });
            results.push({ connectionId: conn.id, bank: conn.bankName || '?', synced: 0, skipped: 0, error: 'Token expired' });
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
