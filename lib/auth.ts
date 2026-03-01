import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from './db';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    // Google OAuth — only active if env vars are set
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? [
      GoogleProvider({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        allowDangerousEmailAccountLinking: true,
      }),
    ] : []),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        loginCode: { label: 'Login Code', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Invalid credentials');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        });

        if (!user) {
          throw new Error('Invalid credentials');
        }

        if (user.status === 'suspended') {
          throw new Error('Account suspended');
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!isValid) {
          throw new Error('Invalid credentials');
        }

        // Verify login OTP code (skip if SMTP not configured — bypass mode)
        const smtpConfigured = !!(process.env.SMTP_USER && process.env.SMTP_PASS);
        const isBypass = !smtpConfigured && credentials.loginCode === 'SMTP_BYPASS';

        if (!isBypass) {
          if (!credentials.loginCode) {
            throw new Error('Login code required');
          }

          const validCode = await prisma.emailVerificationToken.findFirst({
            where: {
              userId: user.id,
              token: credentials.loginCode,
              expiresAt: { gt: new Date() },
              usedAt: null,
            },
          });

          if (!validCode) {
            throw new Error('Invalid or expired verification code');
          }

          // Mark code as used
          await prisma.emailVerificationToken.update({
            where: { id: validCode.id },
            data: { usedAt: new Date() },
          });
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        // Log login event
        await prisma.event.create({
          data: {
            userId: user.id,
            eventType: 'user.logged_in',
            entityType: 'User',
            entityId: user.id,
            payload: { email: user.email },
          },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          role: user.role,
          permissions: (user as any).permissions || [],
          plan: (user as any).plan || 'free',
          onboardingCompleted: (user as any).onboardingCompleted ?? true,
          mustChangePassword: (user as any).mustChangePassword ?? false,
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.permissions = (user as any).permissions || [];
        token.plan = (user as any).plan || 'free';
        token.onboardingCompleted = (user as any).onboardingCompleted ?? true;
        token.mustChangePassword = (user as any).mustChangePassword ?? false;
      }
      // Refresh user data when session is updated
      if (trigger === 'update') {
        try {
          const dbUser: any = await (prisma as any).user.findUnique({
            where: { id: token.id as string },
            select: { onboardingCompleted: true, fullName: true, permissions: true, plan: true, role: true, mustChangePassword: true },
          });
          if (dbUser) {
            token.onboardingCompleted = dbUser.onboardingCompleted;
            token.name = dbUser.fullName;
            token.permissions = dbUser.permissions || [];
            token.plan = dbUser.plan || 'free';
            token.role = dbUser.role;
            token.mustChangePassword = dbUser.mustChangePassword ?? false;
          }
        } catch {}
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).permissions = token.permissions || [];
        (session.user as any).plan = token.plan || 'free';
        (session.user as any).mustChangePassword = token.mustChangePassword ?? false;
      }
      return session;
    },
  },
};

import { getServerSession } from 'next-auth';

/**
 * Get the current authenticated user's ID from the session.
 *
 * @returns The user ID string, or `null` if not authenticated
 */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return (session?.user as any)?.id || null;
}

/**
 * Get the current user ID or throw an `'UNAUTHORIZED'` error.
 *
 * Use this in API routes that require authentication.
 * The error message `'UNAUTHORIZED'` is caught by route handlers to return 401.
 *
 * @returns The authenticated user's ID
 * @throws Error with message `'UNAUTHORIZED'` if no session exists
 */
export async function requireUserId(): Promise<string> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error('UNAUTHORIZED');
  }
  return userId;
}

/**
 * Get all user IDs accessible to the current user via household memberships.
 *
 * Owner and editor members of the same household share data access.
 * Used for data isolation — queries should filter by these IDs.
 *
 * @param userId - The current user's ID
 * @returns Array of user IDs (always includes the input `userId`)
 */
/**
 * Resolve a userId from a mobile upload token.
 *
 * Mobile upload pages have no session — they authenticate via a
 * time-limited token stored in the Event table.
 *
 * @returns The userId that created the token, or `null` if invalid/expired
 */
export async function resolveUserIdFromMobileToken(token: string | null | undefined): Promise<string | null> {
  if (!token) return null;
  try {
    const event = await prisma.event.findFirst({
      where: { eventType: 'mobile_upload_token', entityId: token },
      orderBy: { createdAt: 'desc' },
    });
    if (!event) return null;
    const payload = event.payload as any;
    if (new Date(payload?.expiresAt) < new Date()) return null;
    return event.userId;
  } catch {
    return null;
  }
}

/**
 * Get the current user ID from session OR from a mobile upload token.
 *
 * Tries session first. If no session, falls back to mobile token.
 * Throws 'UNAUTHORIZED' if both fail.
 */
export async function requireUserIdOrMobileToken(mobileToken?: string | null): Promise<string> {
  const sessionUserId = await getCurrentUserId();
  if (sessionUserId) return sessionUserId;
  const tokenUserId = await resolveUserIdFromMobileToken(mobileToken);
  if (tokenUserId) return tokenUserId;
  throw new Error('UNAUTHORIZED');
}

export async function getAccessibleUserIds(userId: string): Promise<string[]> {
  const memberships = await prisma.membership.findMany({
    where: {
      userId,
      role: { in: ['owner', 'editor'] },
    },
    select: { householdId: true, businessId: true },
  });

  const householdIds = memberships.map(m => m.householdId).filter(Boolean) as string[];
  const businessIds = memberships.map(m => m.businessId).filter(Boolean) as string[];

  if (householdIds.length === 0 && businessIds.length === 0) {
    return [userId];
  }

  const sharedMemberships = await prisma.membership.findMany({
    where: {
      OR: [
        ...(householdIds.length > 0 ? [{ householdId: { in: householdIds } }] : []),
        ...(businessIds.length > 0 ? [{ businessId: { in: businessIds } }] : []),
      ],
    },
    select: { userId: true },
  });

  const userIds = new Set(sharedMemberships.map(m => m.userId));
  userIds.add(userId);
  return Array.from(userIds);
}
