import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

// POST /api/documents/mobile-upload — Generate a temporary upload token
export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    let uploadType = 'document';
    let entityId: string | undefined;
    try {
      const body = await req.json();
      uploadType = body.uploadType || 'document';
      entityId = body.entityId;
    } catch { /* no body is fine, defaults to document */ }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store token in Event model as a temporary mechanism
    await prisma.event.create({
      data: {
        userId,
        eventType: 'mobile_upload_token',
        entityType: 'document',
        entityId: token,
        payload: {
          expiresAt: expiresAt.toISOString(),
          uploadType,
          entityId: entityId || null,
          completed: false,
        },
      },
    });

    return NextResponse.json({ token, expiresAt: expiresAt.toISOString(), uploadType });
  } catch (error) {
    console.error('Error generating upload token:', error);
    return NextResponse.json({ error: 'Failed to generate token' }, { status: 500 });
  }
}

// GET /api/documents/mobile-upload?token=xxx — Validate token and get userId
export async function GET(req: NextRequest) {
  try {
    const token = req.nextUrl.searchParams.get('token');
    if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 });

    const event = await prisma.event.findFirst({
      where: {
        eventType: 'mobile_upload_token',
        entityId: token,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!event) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 404 });
    }

    const payload = event.payload as any;
    if (new Date(payload.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'Token expired' }, { status: 410 });
    }

    // Check if caller just wants completion status
    const checkComplete = req.nextUrl.searchParams.get('checkComplete');
    if (checkComplete === 'true') {
      return NextResponse.json({ completed: payload.completed === true });
    }

    return NextResponse.json({
      valid: true,
      userId: event.userId,
      uploadType: payload.uploadType || 'document',
      entityId: payload.entityId || null,
    });
  } catch (error) {
    console.error('Error validating token:', error);
    return NextResponse.json({ error: 'Validation failed' }, { status: 500 });
  }
}

// PATCH /api/documents/mobile-upload — Mark token as completed
export async function PATCH(req: NextRequest) {
  try {
    const { token } = await req.json();
    if (!token) return NextResponse.json({ error: 'Token required' }, { status: 400 });

    const event = await prisma.event.findFirst({
      where: { eventType: 'mobile_upload_token', entityId: token },
      orderBy: { createdAt: 'desc' },
    });
    if (!event) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const payload = event.payload as any;
    await prisma.event.update({
      where: { id: event.id },
      data: { payload: { ...payload, completed: true } },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking token complete:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
