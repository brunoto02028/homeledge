import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// POST /api/admin/integrations/[id]/sync — Admin only: sync data from external system
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const integration = await prisma.externalIntegration.findUnique({
      where: { id: params.id },
    });

    if (!integration) {
      return NextResponse.json({ error: 'Integration not found' }, { status: 404 });
    }

    // Update status to syncing
    await prisma.externalIntegration.update({
      where: { id: params.id },
      data: { syncStatus: 'syncing', syncError: null },
    });

    const { action } = await req.json().catch(() => ({ action: 'test' }));

    if (action === 'test') {
      // Test connection — try to reach the API
      try {
        const testRes = await fetch(`${integration.baseUrl}/health`, {
          headers: {
            'Authorization': `Bearer ${integration.apiKey}`,
            'X-API-Key': integration.apiKey,
          },
          signal: AbortSignal.timeout(10000),
        });

        if (testRes.ok) {
          await prisma.externalIntegration.update({
            where: { id: params.id },
            data: { syncStatus: 'success', lastSyncAt: new Date(), syncError: null },
          });
          const data = await testRes.json().catch(() => ({}));
          return NextResponse.json({ success: true, message: 'Connection successful', data });
        } else {
          const errText = await testRes.text().catch(() => 'Unknown error');
          await prisma.externalIntegration.update({
            where: { id: params.id },
            data: { syncStatus: 'error', syncError: `HTTP ${testRes.status}: ${errText.slice(0, 200)}` },
          });
          return NextResponse.json({ success: false, message: `HTTP ${testRes.status}`, error: errText.slice(0, 500) }, { status: 502 });
        }
      } catch (err: any) {
        const errorMsg = err.message || 'Connection failed';
        await prisma.externalIntegration.update({
          where: { id: params.id },
          data: { syncStatus: 'error', syncError: errorMsg },
        });
        return NextResponse.json({ success: false, message: errorMsg }, { status: 502 });
      }
    }

    if (action === 'fetch') {
      // Check entity association
      const integrationEntityId = (integration as any).entityId;
      if (!integrationEntityId) {
        return NextResponse.json({
          success: false,
          message: 'No entity associated with this integration. Please assign a company/entity in the integration settings before importing data.',
          requiresEntity: true,
        }, { status: 400 });
      }

      // Verify entity exists
      try {
        const entity = await (prisma as any).entity.findUnique({ where: { id: integrationEntityId } });
        if (!entity) {
          return NextResponse.json({
            success: false,
            message: 'The associated entity no longer exists. Please update the integration settings.',
            requiresEntity: true,
          }, { status: 400 });
        }
      } catch { /* proceed anyway */ }

      // Fetch financial data from external API
      try {
        const endpoints = [
          { path: '/financial/summary', label: 'Financial Summary' },
          { path: '/financial/transactions', label: 'Transactions' },
          { path: '/financial/invoices', label: 'Invoices' },
          { path: '/financial/revenue', label: 'Revenue' },
        ];

        const results: Record<string, any> = {};

        for (const ep of endpoints) {
          try {
            const res = await fetch(`${integration.baseUrl}${ep.path}`, {
              headers: {
                'Authorization': `Bearer ${integration.apiKey}`,
                'X-API-Key': integration.apiKey,
                'Content-Type': 'application/json',
              },
              signal: AbortSignal.timeout(15000),
            });
            if (res.ok) {
              results[ep.label] = await res.json();
            } else {
              results[ep.label] = { error: `HTTP ${res.status}` };
            }
          } catch (err: any) {
            results[ep.label] = { error: err.message || 'Failed' };
          }
        }

        await prisma.externalIntegration.update({
          where: { id: params.id },
          data: { syncStatus: 'success', lastSyncAt: new Date(), syncError: null },
        });

        return NextResponse.json({ success: true, data: results });
      } catch (err: any) {
        const errorMsg = err.message || 'Sync failed';
        await prisma.externalIntegration.update({
          where: { id: params.id },
          data: { syncStatus: 'error', syncError: errorMsg },
        });
        return NextResponse.json({ success: false, message: errorMsg }, { status: 500 });
      }
    }

    return NextResponse.json({ error: 'Invalid action. Use "test" or "fetch".' }, { status: 400 });
  } catch (error) {
    console.error('Error syncing integration:', error);
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
