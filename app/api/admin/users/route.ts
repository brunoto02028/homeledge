import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { sendNotificationEmail } from '@/lib/notifications';

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

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        status: true,
        emailVerified: true,
        plan: true,
        permissions: true,
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

    const { email, fullName, password, role = 'user' } = await request.json();

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
        },
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

    // Send welcome email — NO plain password, just login link
    const appUrl = process.env.NEXTAUTH_URL || 'https://homeledger.co.uk';
    try {
      const welcomeHtml = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc;">
          <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to HomeLedger!</h1>
            <p style="color: #bfdbfe; margin: 10px 0 0 0;">Your account has been created</p>
          </div>
          <div style="padding: 30px 20px; background: white;">
            <h2 style="color: #1e293b; margin: 0 0 20px 0;">Hello ${fullName}!</h2>
            <p style="color: #475569;">An administrator has created a HomeLedger account for you.</p>
            <div style="background: #f1f5f9; border-radius: 12px; padding: 20px; margin: 25px 0;">
              <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
              <p style="margin: 5px 0;"><strong>Role:</strong> ${role}</p>
            </div>
            <p style="color: #475569;">Your temporary password has been set by the administrator. Please sign in and change it as soon as possible.</p>
            <div style="text-align: center; margin: 25px 0;">
              <a href="${appUrl}/login" style="display: inline-block; background: #1e40af; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold;">Sign In to HomeLedger</a>
            </div>
            <p style="color: #1e293b; margin-top: 30px;">Best regards,<br/><strong>The HomeLedger Team</strong></p>
          </div>
          <div style="padding: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
            <p style="margin: 0;">&copy; ${new Date().getFullYear()} HomeLedger</p>
          </div>
        </div>
      `;

      await sendNotificationEmail({
        notificationId: process.env.NOTIF_ID_WELCOME_EMAIL || '',
        recipientEmail: email,
        subject: `Welcome to HomeLedger, ${fullName}!`,
        body: welcomeHtml,
        isHtml: true,
      });
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
