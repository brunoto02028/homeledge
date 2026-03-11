import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId } from '@/lib/auth';
import { auditLog } from '@/lib/audit-log';

export const dynamic = 'force-dynamic';

type WorkspaceType = 'household' | 'business';

// POST /api/accountant/clients/[id]/workspace
// Creates (or sets) a Household/Business workspace for this client relationship and ensures memberships for accountant + client.
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const accountantId = await requireUserId();
    const { id } = await params;

    const accountant = await prisma.user.findUnique({ where: { id: accountantId }, select: { role: true } });
    if (!accountant || accountant.role !== 'accountant') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const relationship: any = await (prisma as any).accountantClient.findFirst({
      where: { id, accountantId, status: { in: ['active', 'pending'] } },
    });

    if (!relationship || !relationship.clientId) {
      return NextResponse.json({ error: 'Client not found or not linked to a user yet' }, { status: 404 });
    }

    const body = await request.json();
    const workspaceType: WorkspaceType = body?.type;
    const name: string | undefined = body?.name;

    if (workspaceType !== 'household' && workspaceType !== 'business') {
      return NextResponse.json({ error: 'Invalid workspace type' }, { status: 400 });
    }

    const clientId: string = relationship.clientId;

    const result = await prisma.$transaction(async (tx: any) => {
      if (workspaceType === 'household') {
        const household = await tx.household.create({
          data: {
            name: name || 'Client Household',
            ownerId: accountantId,
          },
        });

        await tx.membership.createMany({
          data: [
            { userId: accountantId, householdId: household.id, role: 'owner' as any },
            { userId: clientId, householdId: household.id, role: 'owner' as any },
          ],
          skipDuplicates: true,
        });

        await (tx as any).accountantClient.update({
          where: { id },
          data: { householdId: household.id, businessId: null, status: 'active', acceptedAt: relationship.acceptedAt || new Date() },
        });

        return { householdId: household.id, businessId: null };
      }

      const business = await tx.business.create({
        data: {
          name: name || 'Client Business',
          ownerId: accountantId,
        },
      });

      await tx.membership.createMany({
        data: [
          { userId: accountantId, businessId: business.id, role: 'owner' as any },
          { userId: clientId, businessId: business.id, role: 'owner' as any },
        ],
        skipDuplicates: true,
      });

      await (tx as any).accountantClient.update({
        where: { id },
        data: { businessId: business.id, householdId: null, status: 'active', acceptedAt: relationship.acceptedAt || new Date() },
      });

      return { householdId: null, businessId: business.id };
    });

    await auditLog(accountantId, 'accountant.client_workspace_created', 'accountant_client', id, {
      metadata: {
        clientId: relationship.clientId,
        workspaceType,
        ...result,
      },
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[Accountant] POST workspace error:', error);
    return NextResponse.json({ error: 'Failed to create workspace' }, { status: 500 });
  }
}
