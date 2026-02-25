import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId } from '@/lib/auth';
import { buildAuthUrl, isConfigured } from '@/lib/truelayer';
import { randomBytes } from 'crypto';

// GET /api/open-banking/connect — List user's bank connections + config status
export async function GET() {
  try {
    const userId = await requireUserId();
    const rawConnections = await (prisma as any).bankConnection.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    // Enrich with entity name
    const entityIds = [...new Set(rawConnections.filter((c: any) => c.entityId).map((c: any) => c.entityId))];
    const entitiesMap = new Map<string, string>();
    if (entityIds.length > 0) {
      const entities = await (prisma as any).entity.findMany({
        where: { id: { in: entityIds as string[] } },
        select: { id: true, name: true, type: true },
      });
      entities.forEach((e: any) => entitiesMap.set(e.id, e.name));
    }

    // Count transactions per connection (via statements linked to this bank)
    const connIds = rawConnections.map((c: any) => c.id);
    const txCountMap = new Map<string, number>();
    if (connIds.length > 0) {
      for (const c of rawConnections) {
        const bankPrefix = c.bankName ? `${c.bankName}-` : null;
        if (bankPrefix && c.userId) {
          const stmts = await (prisma as any).bankStatement.findMany({
            where: { userId: c.userId, fileName: { startsWith: bankPrefix }, entityId: c.entityId || undefined },
            select: { id: true },
          });
          if (stmts.length > 0) {
            const count = await prisma.bankTransaction.count({
              where: { statementId: { in: stmts.map((s: any) => s.id) } },
            });
            txCountMap.set(c.id, count);
          }
        }
      }
    }

    const connections = rawConnections.map((c: any) => ({
      ...c,
      entityName: c.entityId ? entitiesMap.get(c.entityId) || null : null,
      transactionCount: txCountMap.get(c.id) || 0,
    }));
    return NextResponse.json({
      connections,
      configured: isConfigured(),
    });
  } catch (error) {
    console.error('[OpenBanking] Error fetching connections:', error);
    return NextResponse.json({ error: 'Failed to fetch connections' }, { status: 500 });
  }
}

// POST /api/open-banking/connect — Initiate OAuth flow
export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserId();

    if (!isConfigured()) {
      return NextResponse.json({
        error: 'Open Banking not configured',
        message: 'TrueLayer credentials are not set. Please add TRUELAYER_CLIENT_ID, TRUELAYER_CLIENT_SECRET, and TRUELAYER_REDIRECT_URI to environment variables.',
      }, { status: 503 });
    }

    const body = await request.json();
    const { accountId, entityId } = body;

    // Generate a state token to track this connection attempt
    const state = randomBytes(32).toString('hex');

    // Store the pending connection
    await (prisma as any).bankConnection.create({
      data: {
        userId,
        accountId: accountId || null,
        entityId: entityId || null,
        provider: 'truelayer',
        status: 'pending',
        consentToken: state,
      },
    });

    const authUrl = buildAuthUrl(state);
    return NextResponse.json({ authUrl, state });
  } catch (error) {
    console.error('[OpenBanking] Error initiating connection:', error);
    return NextResponse.json({ error: 'Failed to initiate connection' }, { status: 500 });
  }
}

// DELETE /api/open-banking/connect — Disconnect a bank connection
export async function DELETE(request: NextRequest) {
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

    // Revoke the token if we have one
    if (conn.accessToken) {
      try {
        const { revokeToken } = await import('@/lib/truelayer');
        await revokeToken(conn.accessToken);
      } catch { /* best effort */ }
    }

    // If already disconnected/revoked/error, permanently delete
    if (['revoked', 'error', 'expired'].includes(conn.status)) {
      await (prisma as any).bankConnection.delete({
        where: { id: connectionId },
      });
      return NextResponse.json({ success: true, deleted: true });
    }

    await (prisma as any).bankConnection.update({
      where: { id: connectionId },
      data: { status: 'revoked', accessToken: null, refreshToken: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[OpenBanking] Error disconnecting:', error);
    return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 });
  }
}
