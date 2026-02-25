import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from './db';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
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

        // Verify login OTP code
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
      }
      // Refresh user data when session is updated
      if (trigger === 'update') {
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: token.id as string },
            select: { onboardingCompleted: true, fullName: true, permissions: true, plan: true, role: true },
          });
          if (dbUser) {
            token.onboardingCompleted = dbUser.onboardingCompleted;
            token.name = dbUser.fullName;
            token.permissions = dbUser.permissions || [];
            token.plan = dbUser.plan || 'free';
            token.role = dbUser.role;
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
      }
      return session;
    },
  },
};

// Helper to get userId from session
import { getServerSession } from 'next-auth';

export async function getCurrentUserId(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  return (session?.user as any)?.id || null;
}

// Strict version - throws if no user (use in API routes that require auth)
export async function requireUserId(): Promise<string> {
  const userId = await getCurrentUserId();
  if (!userId) {
    throw new Error('UNAUTHORIZED');
  }
  return userId;
}

// Returns all userIds the current user can access via household memberships
// Owner/editor members of the same household share data
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
