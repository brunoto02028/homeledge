import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sendNotificationEmail } from '@/lib/notifications';

function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function generateVerificationEmailHtml(fullName: string, code: string): string {
  return `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc;">
      <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 40px 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Verify Your Email</h1>
        <p style="color: #bfdbfe; margin: 10px 0 0 0;">HomeLedger Account Setup</p>
      </div>
      <div style="padding: 30px 20px; background: white;">
        <h2 style="color: #1e293b; margin: 0 0 20px 0;">Hello ${fullName}!</h2>
        <p style="color: #475569; line-height: 1.6;">Thank you for registering. Please verify your email with the code below:</p>
        <div style="background: #f1f5f9; border-radius: 12px; padding: 25px; margin: 25px 0; text-align: center;">
          <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1e40af;">${code}</span>
        </div>
        <p style="color: #475569; line-height: 1.6;">This code expires in <strong>30 minutes</strong>.</p>
        <p style="color: #475569;">If you didn't create this account, please ignore this email.</p>
        <p style="color: #1e293b; margin-top: 30px;">Best regards,<br/><strong>The HomeLedger Team</strong></p>
      </div>
      <div style="padding: 20px; text-align: center; color: #94a3b8; font-size: 12px;">
        <p style="margin: 0;">&copy; ${new Date().getFullYear()} HomeLedger</p>
      </div>
    </div>
  `;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, fullName, accountType } = body;

    // Validation
    if (!email || !password || !fullName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      // If user exists but not verified, allow re-sending verification
      if (!existingUser.emailVerified && existingUser.status === 'pending_verification') {
        const code = generateVerificationCode();
        await prisma.emailVerificationToken.create({
          data: {
            userId: existingUser.id,
            token: code,
            expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 min
          },
        });

        try {
          await sendNotificationEmail({
            notificationId: process.env.NOTIF_ID_WELCOME_EMAIL || '',
            recipientEmail: existingUser.email,
            subject: `Your HomeLedger verification code: ${code}`,
            body: generateVerificationEmailHtml(existingUser.fullName, code),
            isHtml: true,
          });
        } catch { /* non-critical */ }

        return NextResponse.json({
          success: true,
          requiresVerification: true,
          email: existingUser.email,
          message: 'Verification code re-sent to your email.',
        });
      }

      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user with transaction — PENDING verification
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          passwordHash,
          fullName,
          role: accountType === 'business' ? 'business' : 'user',
          status: 'pending_verification',
          emailVerified: false,
          onboardingCompleted: false,
        },
      });

      // Create household or business
      if (accountType === 'business') {
        const business = await tx.business.create({
          data: { name: `${fullName}'s Business`, ownerId: user.id },
        });
        await tx.membership.create({
          data: { userId: user.id, businessId: business.id, role: 'owner' },
        });
      } else {
        const household = await tx.household.create({
          data: { name: `${fullName}'s Household`, ownerId: user.id },
        });
        await tx.membership.create({
          data: { userId: user.id, householdId: household.id, role: 'owner' },
        });
      }

      // Create verification token
      const code = generateVerificationCode();
      await tx.emailVerificationToken.create({
        data: {
          userId: user.id,
          token: code,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 min
        },
      });

      // Log event
      await tx.event.create({
        data: {
          userId: user.id,
          eventType: 'user.created',
          entityType: 'User',
          entityId: user.id,
          payload: { email: user.email, accountType },
        },
      });

      return { user, code };
    });

    // Send verification email
    try {
      await sendNotificationEmail({
        notificationId: process.env.NOTIF_ID_WELCOME_EMAIL || '',
        recipientEmail: result.user.email,
        subject: `Your HomeLedger verification code: ${result.code}`,
        body: generateVerificationEmailHtml(result.user.fullName, result.code),
        isHtml: true,
      });
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
    }

    return NextResponse.json({
      success: true,
      requiresVerification: true,
      email: result.user.email,
      message: 'Account created! Please check your email for the verification code.',
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}
