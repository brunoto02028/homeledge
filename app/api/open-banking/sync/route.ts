import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId } from '@/lib/auth';
import { refreshAccessToken } from '@/lib/truelayer';
import { syncConnectionTransactions } from '@/lib/open-banking-sync';

const REFRESH_BUFFER_MS = 10 * 60 * 1000; // 10 min buffer

async function refreshWithRetry(refreshToken: string, retries = 2) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await refreshAccessToken(refreshToken);
    } catch (err: any) {
      const isPermanent = err.message?.includes('invalid_grant') || err.message?.includes('401') || err.message?.includes('403');
      if (isPermanent || attempt === retries) throw err;
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  throw new Error('Token refresh exhausted retries');
}

// POST /api/open-banking/sync — Refresh: incremental sync from lastSyncAt to now
export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const { connectionId } = await request.json();

    if (!connectionId) {
      return NextResponse.json({ error: 'connectionId is required' }, { status: 400 });
    }

    const conn = await (prisma as any).bankConnection.findFirst({
      where: { id: connectionId, userId },
    });
    if (!conn) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 });
    }
    if (!['active', 'expired', 'error'].includes(conn.status)) {
      return NextResponse.json({ error: 'Connection is not active. Please reconnect your bank.' }, { status: 400 });
    }

    // Proactive token refresh: refresh if expired or about to expire
    let accessToken = conn.accessToken;
    const expiresAt = conn.tokenExpiresAt ? new Date(conn.tokenExpiresAt).getTime() : 0;
    const needsRefresh = expiresAt > 0 && expiresAt < (Date.now() + REFRESH_BUFFER_MS);

    if (needsRefresh || conn.status === 'expired') {
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
            metadata: { ...(conn.metadata || {}), failedRefreshCount: 0 },
          },
        });
      } catch (err: any) {
        const errorMsg = err.message?.substring(0, 200) || 'Token refresh failed';
        const isPermanent = errorMsg.includes('invalid_grant') || errorMsg.includes('consent') || errorMsg.includes('revoked');

        if (isPermanent) {
          await (prisma as any).bankConnection.update({
            where: { id: conn.id },
            data: { status: 'expired', lastSyncError: 'Bank consent expired — please reconnect your bank' },
          });
          return NextResponse.json({ error: 'Bank consent expired. Please click "Reconnect Bank" to re-authorise.', code: 'TOKEN_EXPIRED' }, { status: 401 });
        } else {
          // Temporary failure — don't mark as expired, just report error
          await (prisma as any).bankConnection.update({
            where: { id: conn.id },
            data: { lastSyncError: 'Temporary refresh error — please try again in a few minutes' },
          });
          return NextResponse.json({ error: 'Temporary connection issue. Please try again in a few minutes.', code: 'TEMP_ERROR' }, { status: 503 });
        }
      }
    }

    // Incremental: from lastSyncAt (minus 1 day buffer) to now
    const now = new Date();
    const from = conn.lastSyncAt ? new Date(conn.lastSyncAt) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    from.setDate(from.getDate() - 1);

    const result = await syncConnectionTransactions({
      connectionId: conn.id,
      accessToken,
      userId,
      fromDate: from.toISOString().split('T')[0],
      toDate: now.toISOString().split('T')[0],
    });

    if (result.code === 'ALREADY_SYNCED') {
      return NextResponse.json({
        synced: 0, skipped: 0,
        message: 'All transactions are already synced. Your data is up to date.',
        code: 'ALREADY_SYNCED',
        bank: result.bank,
      });
    }

    if (result.code === 'SCA_EXCEEDED') {
      return NextResponse.json({
        error: 'Bank requires re-authentication. Click "Reconnect & Sync Full History" to fetch all transactions.',
        code: 'SCA_EXCEEDED',
      }, { status: 403 });
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[OpenBanking Sync] Error:', error);
    return NextResponse.json({ error: error.message || 'Sync failed' }, { status: 500 });
  }
}
