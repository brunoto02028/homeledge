import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId } from '@/lib/auth';

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

// POST - Invite a new client
export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, fullName: true } });
    if (!user || user.role !== 'accountant') {
      return NextResponse.json({ error: 'Only accountants can invite clients' }, { status: 403 });
    }

    const { email, label, notes, permissions } = await request.json();
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
        status: clientUser ? 'active' : 'pending', // Auto-activate if user exists
        label: label || null,
        notes: notes || null,
        permissions: permissions || ["view_reports", "view_statements", "view_invoices", "view_bills", "view_entities", "view_categories", "view_documents"],
        acceptedAt: clientUser ? new Date() : null,
      },
    });

    // Log event
    await prisma.event.create({
      data: {
        userId,
        eventType: 'accountant.client_invited',
        entityType: 'accountant_client',
        entityId: client.id,
        payload: { clientEmail: email, label },
      },
    });

    return NextResponse.json(client, { status: 201 });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[Accountant] POST client error:', error);
    return NextResponse.json({ error: 'Failed to invite client' }, { status: 500 });
  }
}
