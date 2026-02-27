import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

// GET - Get user profile
export async function GET() {
  try {
    const userId = await requireUserId();
    const user = await (prisma as any).user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        lastLoginAt: true,
        plan: true,
        idVerified: true,
        idVerifiedAt: true,
        amlRiskLevel: true,
        amlScreenedAt: true,
        categorizationMode: true,
        _count: {
          select: {
            bills: true,
            invoices: true,
            bankStatements: true,
            entities: true,
            lifeEvents: true,
            vaultEntries: true,
            sharedLinks: true,
            recurringTransfers: true,
          },
        },
      },
    });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json(user);
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// PUT - Update user profile
export async function PUT(request: Request) {
  try {
    const userId = await requireUserId();
    const body = await request.json();
    const { fullName, currentPassword, newPassword, categorizationMode } = body;

    const updateData: Record<string, unknown> = {};

    if (fullName !== undefined) {
      if (!fullName || fullName.length < 2) {
        return NextResponse.json({ error: 'Name must be at least 2 characters' }, { status: 400 });
      }
      updateData.fullName = fullName;
    }

    if (newPassword) {
      if (newPassword.length < 8) {
        return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 });
      }

      updateData.passwordHash = await bcrypt.hash(newPassword, 12);
    }

    if (categorizationMode && ['conservative', 'smart', 'autonomous'].includes(categorizationMode)) {
      updateData.categorizationMode = categorizationMode;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No changes provided' }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: { id: true, fullName: true, email: true },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[Settings] Error:', error);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}
