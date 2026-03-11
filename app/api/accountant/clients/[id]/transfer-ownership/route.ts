import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId } from '@/lib/auth';
import { auditLog } from '@/lib/audit-log';

export const dynamic = 'force-dynamic';

type TransferMode = 'essential' | 'all';

const ESSENTIAL_MODULES = [
  'statements',
  'transactions',
  'invoices',
  'bills',
  'entities',
  'categories',
  'taxpayer_profile',
  'providers',
  'documents',
];

async function requireAccountant(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user || user.role !== 'accountant') throw new Error('FORBIDDEN');
}

// POST /api/accountant/clients/[id]/transfer-ownership
// Transfers ownership (userId) from client -> accountant, either for essential bookkeeping data or for everything.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const accountantId = await requireUserId();
    await requireAccountant(accountantId);

    const { id } = await params;
    const body = await request.json();
    const mode: TransferMode = body?.mode === 'all' ? 'all' : 'essential';

    const relationship: any = await (prisma as any).accountantClient.findFirst({
      where: { id, accountantId, status: 'active' },
    });

    if (!relationship || !relationship.clientId) {
      return NextResponse.json({ error: 'Client not found or not active' }, { status: 404 });
    }

    const clientId: string = relationship.clientId;

    const results = await prisma.$transaction(async (tx: any) => {
      const counts: Record<string, number> = {};

      const updateMany = async (modelName: string, where: any, data: any) => {
        const model = (tx as any)[modelName];
        if (!model?.updateMany) return;
        const res = await model.updateMany({ where, data });
        counts[modelName] = (res?.count as number) || 0;
      };

      // Essential bookkeeping transfer
      await updateMany('bankStatement', { userId: clientId }, { userId: accountantId });
      await updateMany('invoice', { userId: clientId }, { userId: accountantId });
      await updateMany('bill', { userId: clientId }, { userId: accountantId });
      await updateMany('entity', { userId: clientId }, { userId: accountantId });
      await updateMany('category', { userId: clientId }, { userId: accountantId });
      await updateMany('taxpayerProfile', { userId: clientId }, { userId: accountantId });
      await updateMany('provider', { userId: clientId }, { userId: accountantId });
      await updateMany('scannedDocument', { userId: clientId }, { userId: accountantId });
      await updateMany('correspondence', { userId: clientId }, { userId: accountantId });

      // Optional: transfer everything else
      if (mode === 'all') {
        await updateMany('budget', { userId: clientId }, { userId: accountantId });
        await updateMany('action', { userId: clientId }, { userId: accountantId });
        await updateMany('lifeEvent', { userId: clientId }, { userId: accountantId });
        await updateMany('property', { userId: clientId }, { userId: accountantId });
        await updateMany('savingsGoal', { userId: clientId }, { userId: accountantId });
        await updateMany('debt', { userId: clientId }, { userId: accountantId });
        await updateMany('recurringTransfer', { userId: clientId }, { userId: accountantId });
        await updateMany('invoiceTemplate', { userId: clientId }, { userId: accountantId });
        await updateMany('vaultEntry', { userId: clientId }, { userId: accountantId });
        await updateMany('sharedLink', { userId: clientId }, { userId: accountantId });
        await updateMany('insurancePolicy', { userId: clientId }, { userId: accountantId });
        await updateMany('insuranceClaim', { userId: clientId }, { userId: accountantId });

        // Keep auth/session/security artefacts on the user (do not transfer tokens/sessions).
      }

      return counts;
    });

    await auditLog(accountantId, 'ownership.transferred', 'accountant_client', id, {
      metadata: {
        mode,
        essentialModules: ESSENTIAL_MODULES,
        fromUserId: clientId,
        toUserId: accountantId,
        counts: results,
      },
    });

    return NextResponse.json({ success: true, mode, fromUserId: clientId, toUserId: accountantId, counts: results });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'FORBIDDEN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    console.error('[Accountant] POST transfer ownership error:', error);
    return NextResponse.json({ error: 'Failed to transfer ownership' }, { status: 500 });
  }
}
