import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId } from '@/lib/auth';
import { refreshAccessToken } from '@/lib/truelayer';
import { syncConnectionTransactions } from '@/lib/open-banking-sync';

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
    if (conn.status !== 'active') {
      return NextResponse.json({ error: 'Connection is not active' }, { status: 400 });
    }

    // Refresh token if expired
    let accessToken = conn.accessToken;
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
          data: { status: 'expired', lastSyncError: 'Token refresh failed: ' + err.message },
        });
        return NextResponse.json({ error: 'Token expired. Please reconnect.' }, { status: 401 });
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
