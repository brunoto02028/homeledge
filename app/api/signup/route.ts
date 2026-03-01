import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { sendSignupVerificationEmail, isEmailConfigured } from '@/lib/email';
import { getPermissionsForPlan, PURCHASABLE_PLANS } from '@/lib/permissions';

function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, fullName, accountType, selectedPlan } = body;

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
        // If email not configured, auto-verify
        if (!isEmailConfigured()) {
          await prisma.user.update({
            where: { id: existingUser.id },
            data: { status: 'active', emailVerified: true } as any,
          });
          return NextResponse.json({
            success: true,
            requiresVerification: false,
            email: existingUser.email,
            message: 'Account verified. You can now sign in.',
          });
        }

        const code = generateVerificationCode();
        await prisma.emailVerificationToken.create({
          data: {
            userId: existingUser.id,
            token: code,
            expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 min
          },
        });

        const emailResult = await sendSignupVerificationEmail(existingUser.email, existingUser.fullName, code);
        if (!emailResult.success) {
          // Auto-verify if email fails
          await prisma.user.update({
            where: { id: existingUser.id },
            data: { status: 'active', emailVerified: true } as any,
          });
          return NextResponse.json({
            success: true,
            requiresVerification: false,
            email: existingUser.email,
            message: 'Account verified. You can now sign in.',
          });
        }

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
      const plan = selectedPlan && PURCHASABLE_PLANS.includes(selectedPlan) ? selectedPlan : 'none';
      const permissions = getPermissionsForPlan(plan);
      const user = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          passwordHash,
          fullName,
          role: accountType === 'business' ? 'business' : 'user',
          status: 'pending_verification',
          emailVerified: false,
          onboardingCompleted: false,
          plan,
          permissions,
        } as any,
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

    // Send verification email (or auto-verify if email not configured)
    if (!isEmailConfigured()) {
      console.log(`[Signup] Email not configured — auto-verifying ${result.user.email}`);
      await prisma.user.update({
        where: { id: result.user.id },
        data: { status: 'active', emailVerified: true } as any,
      });
      return NextResponse.json({
        success: true,
        requiresVerification: false,
        email: result.user.email,
        message: 'Account created! You can now sign in.',
      });
    }

    const emailResult = await sendSignupVerificationEmail(result.user.email, result.user.fullName, result.code);
    if (!emailResult.success) {
      console.error(`[Signup] Email failed for ${result.user.email} — auto-verifying`);
      await prisma.user.update({
        where: { id: result.user.id },
        data: { status: 'active', emailVerified: true } as any,
      });
      return NextResponse.json({
        success: true,
        requiresVerification: false,
        email: result.user.email,
        message: 'Account created! You can now sign in.',
      });
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
