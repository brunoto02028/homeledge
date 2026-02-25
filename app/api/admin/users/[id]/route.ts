import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId } from '@/lib/auth';
import bcrypt from 'bcryptjs';

async function requireAdmin() {
  const userId = await requireUserId();
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } });
  if (user?.role !== 'admin') {
    throw new Error('FORBIDDEN');
  }
  return user.id;
}

// PUT - Update user (role, status, password reset)
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const adminId = await requireAdmin();
    const { id } = params;
    const body = await request.json();

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updateData: Record<string, any> = {};

    if (body.role && ['user', 'business', 'accountant', 'admin'].includes(body.role)) {
      updateData.role = body.role;
    }
    if (body.status && ['active', 'suspended', 'pending_verification'].includes(body.status)) {
      updateData.status = body.status;
    }
    if (body.fullName) {
      updateData.fullName = body.fullName;
    }
    if (body.newPassword && body.newPassword.length >= 8) {
      updateData.passwordHash = await bcrypt.hash(body.newPassword, 12);
    }
    if (body.plan) {
      updateData.plan = body.plan;
    }
    if (Array.isArray(body.permissions)) {
      updateData.permissions = body.permissions;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, email: true, fullName: true, role: true, status: true },
    });

    await prisma.event.create({
      data: {
        userId: adminId,
        eventType: 'admin.user_updated',
        entityType: 'User',
        entityId: id,
        payload: { changes: Object.keys(updateData), updatedBy: adminId },
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    console.error('Admin update user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Delete user
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const adminId = await requireAdmin();
    const { id } = params;

    // Prevent self-deletion
    if (id === adminId) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await prisma.user.delete({ where: { id } });

    await prisma.event.create({
      data: {
        userId: adminId,
        eventType: 'admin.user_deleted',
        entityType: 'User',
        entityId: id,
        payload: { deletedEmail: user.email, deletedBy: adminId },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    console.error('Admin delete user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
