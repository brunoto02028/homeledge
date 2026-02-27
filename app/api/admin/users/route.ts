import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { sendAdminCreatedAccountEmail } from '@/lib/email';

export const dynamic = 'force-dynamic';

async function requireAdmin() {
  const userId = await requireUserId();
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (user?.role !== 'admin') {
    throw new Error('FORBIDDEN');
  }
  return userId;
}

// GET - List all users
export async function GET() {
  try {
    await requireAdmin();

    const users = await (prisma as any).user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        status: true,
        emailVerified: true,
        plan: true,
        permissions: true,
        mustChangePassword: true,
        createdAt: true,
        lastLoginAt: true,
        _count: {
          select: {
            invoices: true,
            bills: true,
            bankStatements: true,
            events: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(users);
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    console.error('Admin list users error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create new user
export async function POST(request: Request) {
  try {
    await requireAdmin();

    const { email, fullName, password, role = 'user', permissions = [], plan = 'free' } = await request.json();

    if (!email || !fullName || !password) {
      return NextResponse.json({ error: 'Email, full name, and password are required' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          passwordHash,
          fullName,
          role,
          status: 'active',
          emailVerified: true,
          plan,
          permissions,
          mustChangePassword: true,
        } as any,
      });

      // Create household or business based on role
      if (role === 'business') {
        const business = await tx.business.create({
          data: { name: `${fullName}'s Business`, ownerId: newUser.id },
        });
        await tx.membership.create({
          data: { userId: newUser.id, businessId: business.id, role: 'owner' },
        });
      } else {
        const household = await tx.household.create({
          data: { name: `${fullName}'s Household`, ownerId: newUser.id },
        });
        await tx.membership.create({
          data: { userId: newUser.id, householdId: household.id, role: 'owner' },
        });
      }

      await tx.event.create({
        data: {
          userId: newUser.id,
          eventType: 'user.created_by_admin',
          entityType: 'User',
          entityId: newUser.id,
          payload: { email: newUser.email, createdBy: 'admin' },
        },
      });

      return newUser;
    });

    // Send welcome email with temp password + must-change notice
    let emailSent = false;
    try {
      const result = await sendAdminCreatedAccountEmail(email, fullName, role, password);
      emailSent = result?.success ?? false;
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
    }

    return NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, fullName: user.fullName, role: user.role },
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (error.message === 'FORBIDDEN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
    console.error('Admin create user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
