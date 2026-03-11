import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId } from '@/lib/auth';
import { auditLog } from '@/lib/audit-log';

// GET - List all clients for the logged-in accountant
export async function GET() {
  try {
    const userId = await requireUserId();
    
    // Verify user is an accountant
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!user || user.role !== 'accountant') {
      return NextResponse.json({ error: 'Only accountants can access this endpoint' }, { status: 403 });
    }

    const clients = await (prisma as any).accountantClient.findMany({
      where: { accountantId: userId },
      orderBy: { createdAt: 'desc' },
    });

    // Enrich with client user data where available
    const enriched = await Promise.all(clients.map(async (c: any) => {
      let clientUser = null;
      if (c.clientId) {
        clientUser = await prisma.user.findUnique({
          where: { id: c.clientId },
          select: { id: true, fullName: true, email: true, plan: true, createdAt: true },
        });
      }
      // Count client entities
      let entityCount = 0;
      if (c.clientId) {
        entityCount = await (prisma as any).entity.count({ where: { userId: c.clientId } });
      }
      return { ...c, clientUser, entityCount };
    }));

    return NextResponse.json(enriched);
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[Accountant] GET clients error:', error);
    return NextResponse.json({ error: 'Failed to fetch clients' }, { status: 500 });
  }
}

// POST - Invite a new client OR create an offline/walk-in client
export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, fullName: true } });
    if (!user || (user.role !== 'accountant' && user.role !== 'admin')) {
      return NextResponse.json({ error: 'Only accountants can manage clients' }, { status: 403 });
    }

    const body = await request.json();
    const {
      email, label, notes, permissions, essentialOverrides, householdId, businessId,
      // Offline / walk-in client fields
      isOffline,
      offlineFullName, offlinePhone, offlineNino, offlineUtr,
      offlineDob, offlineAddress, offlineService, offlineTaxYear,
      offlineFee, offlineFeePaid,
    } = body;

    // ── Offline client (no Clarity & Co account needed) ──────────────────────
    if (isOffline) {
      if (!offlineFullName) {
        return NextResponse.json({ error: 'Full name is required for walk-in clients' }, { status: 400 });
      }
      // Generate a unique placeholder email so the @@unique constraint is satisfied
      const placeholderEmail = `offline-${userId}-${Date.now()}@clarity-internal`;

      const client = await (prisma as any).accountantClient.create({
        data: {
          accountantId: userId,
          clientId: null,
          clientEmail: placeholderEmail,
          status: 'offline',
          label: label || offlineFullName,
          notes: notes || null,
          permissions: [],
          essentialOverrides: [],
          isOffline: true,
          offlineFullName: offlineFullName || null,
          offlinePhone: offlinePhone || null,
          offlineNino: offlineNino ? offlineNino.toUpperCase().replace(/\s/g, '') : null,
          offlineUtr: offlineUtr || null,
          offlineDob: offlineDob || null,
          offlineAddress: offlineAddress || null,
          offlineService: offlineService || null,
          offlineTaxYear: offlineTaxYear || null,
          offlineFee: offlineFee ? parseFloat(offlineFee) : null,
          offlineFeePaid: offlineFeePaid || false,
        },
      });

      await auditLog(userId, 'accountant.offline_client_created', 'accountant_client', client.id, {
        metadata: { offlineFullName, offlineService, offlineTaxYear },
      });

      return NextResponse.json(client, { status: 201 });
    }

    // ── Online client (invite via email) ─────────────────────────────────────
    if (!email) {
      return NextResponse.json({ error: 'Client email is required' }, { status: 400 });
    }

    // Check if already invited
    const existing = await (prisma as any).accountantClient.findFirst({
      where: { accountantId: userId, clientEmail: email.toLowerCase() },
    });
    if (existing) {
      return NextResponse.json({ error: 'Client already invited' }, { status: 409 });
    }

    // Check if client user exists
    const clientUser = await prisma.user.findUnique({ where: { email: email.toLowerCase() }, select: { id: true } });

    const client = await (prisma as any).accountantClient.create({
      data: {
        accountantId: userId,
        clientId: clientUser?.id || null,
        clientEmail: email.toLowerCase(),
        status: clientUser ? 'active' : 'pending',
        label: label || null,
        notes: notes || null,
        permissions: permissions || ["view_reports", "view_statements", "view_invoices", "view_bills", "view_entities", "view_categories", "view_documents"],
        essentialOverrides: Array.isArray(essentialOverrides) ? essentialOverrides : [],
        householdId: householdId || null,
        businessId: businessId || null,
        acceptedAt: clientUser ? new Date() : null,
      },
    });

    await auditLog(userId, 'accountant.client_invited', 'accountant_client', client.id, {
      metadata: { clientEmail: email, label, householdId: householdId || null, businessId: businessId || null },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[Accountant] POST client error:', error);
    return NextResponse.json({ error: 'Failed to create client' }, { status: 500 });
  }
}
