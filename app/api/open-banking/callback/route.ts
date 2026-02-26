import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { exchangeCode, getAccounts } from '@/lib/truelayer';
import { syncConnectionTransactions } from '@/lib/open-banking-sync';

// GET /api/open-banking/callback — TrueLayer OAuth callback (public route)
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  const baseUrl = process.env.NEXTAUTH_URL || 'https://homeledger.co.uk';

  if (error) {
    console.error('[OpenBanking Callback] Error:', error);
    if (state) {
      await (prisma as any).bankConnection.updateMany({
        where: { consentToken: state, status: 'pending' },
        data: { status: 'error', lastSyncError: `OAuth error: ${error}` },
      });
    }
    return NextResponse.redirect(`${baseUrl}/providers?ob_error=${encodeURIComponent(error)}`);
  }

  if (!code || !state) {
    return NextResponse.redirect(`${baseUrl}/providers?ob_error=missing_params`);
  }

  try {
    // Find the pending connection by state token
    const connection = await (prisma as any).bankConnection.findFirst({
      where: { consentToken: state, status: 'pending' },
    });

    if (!connection) {
      return NextResponse.redirect(`${baseUrl}/providers?ob_error=invalid_state`);
    }

    // Exchange code for tokens
    const tokens = await exchangeCode(code);
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    // Fetch accounts to get bank name
    let bankName = 'Unknown Bank';
    let truelayerAccountId: string | null = null;
    try {
      const accounts = await getAccounts(tokens.access_token);
      if (accounts.length > 0) {
        bankName = accounts[0].provider?.display_name || 'Connected Bank';
        truelayerAccountId = accounts[0].account_id;
      }
    } catch (e) {
      console.error('[OpenBanking Callback] Error fetching accounts:', e);
    }

    // Update the connection with tokens and status
    await (prisma as any).bankConnection.update({
      where: { id: connection.id },
      data: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        tokenExpiresAt: expiresAt,
        truelayerAccountId,
        bankName,
        status: 'active',
        consentToken: null,
      },
    });

    // === AUTO-SYNC: Fire-and-forget — redirect immediately, sync in background ===
    // The sync + AI categorization can take minutes; don't block the redirect.
    const connId = connection.id;
    const accessToken = tokens.access_token;
    const userId = connection.userId;

    // Start sync in background (non-blocking)
    const now = new Date();
    const twentyFourMonthsAgo = new Date();
    twentyFourMonthsAgo.setMonth(twentyFourMonthsAgo.getMonth() - 24);

    console.log(`[OpenBanking Callback] Starting background sync for ${bankName} (${connId})`);

    // Fire-and-forget: sync runs after redirect
    syncConnectionTransactions({
      connectionId: connId,
      accessToken,
      userId,
      fromDate: twentyFourMonthsAgo.toISOString().split('T')[0],
      toDate: now.toISOString().split('T')[0],
    }).then((result) => {
      console.log(`[OpenBanking Callback] Background sync complete: ${result.synced} new, ${result.skipped} skipped, ${result.categorised} categorised`);
    }).catch((syncErr: any) => {
      console.error('[OpenBanking Callback] Background sync error:', syncErr.message);
    });

    // Redirect immediately — don't wait for sync
    return NextResponse.redirect(`${baseUrl}/providers?ob_success=true&bank=${encodeURIComponent(bankName)}&syncing=true`);
  } catch (err: any) {
    console.error('[OpenBanking Callback] Error:', err);
    if (state) {
      await (prisma as any).bankConnection.updateMany({
        where: { consentToken: state, status: 'pending' },
        data: { status: 'error', lastSyncError: err.message?.substring(0, 500) },
      });
    }
    return NextResponse.redirect(`${baseUrl}/providers?ob_error=${encodeURIComponent('Connection failed')}`);
  }
}
