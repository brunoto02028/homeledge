/**
 * Prisma client singleton.
 *
 * Uses a global reference to prevent multiple PrismaClient instances
 * during Next.js hot module replacement in development.
 * In production, a single instance is created and reused.
 *
 * @module db
 */
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/** Shared Prisma client instance — import this in all server-side code. */
export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
