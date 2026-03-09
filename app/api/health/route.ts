import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * System health check endpoint — no auth required.
 * GET /api/health
 *
 * Returns:
 * - status: "healthy" | "degraded" | "unhealthy"
 * - checks: database, memory, uptime
 * - version, timestamp
 */
export async function GET() {
  const start = Date.now();
  const checks: Record<string, { status: string; latencyMs?: number; detail?: string }> = {};

  // ── Database check ────────────────────────────────────────
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    checks.database = { status: 'ok', latencyMs: Date.now() - dbStart };
  } catch (err: any) {
    checks.database = { status: 'error', detail: err.message?.slice(0, 100) };
  }

  // ── Memory check ──────────────────────────────────────────
  const mem = process.memoryUsage();
  const heapUsedMB = Math.round(mem.heapUsed / 1024 / 1024);
  const heapTotalMB = Math.round(mem.heapTotal / 1024 / 1024);
  const rssMB = Math.round(mem.rss / 1024 / 1024);
  const heapPercent = Math.round((mem.heapUsed / mem.heapTotal) * 100);

  checks.memory = {
    status: heapPercent > 90 ? 'warning' : 'ok',
    detail: `${heapUsedMB}MB / ${heapTotalMB}MB heap (${heapPercent}%), ${rssMB}MB RSS`,
  };

  // ── Uptime ────────────────────────────────────────────────
  const uptimeSeconds = Math.round(process.uptime());
  const uptimeHours = Math.round(uptimeSeconds / 3600 * 10) / 10;
  checks.uptime = { status: 'ok', detail: `${uptimeHours}h (${uptimeSeconds}s)` };

  // ── Overall status ────────────────────────────────────────
  const hasError = Object.values(checks).some(c => c.status === 'error');
  const hasWarning = Object.values(checks).some(c => c.status === 'warning');
  const overallStatus = hasError ? 'unhealthy' : hasWarning ? 'degraded' : 'healthy';
  const httpStatus = hasError ? 503 : 200;

  return NextResponse.json(
    {
      status: overallStatus,
      version: process.env.npm_package_version || '1.0.0',
      timestamp: new Date().toISOString(),
      responseMs: Date.now() - start,
      checks,
    },
    {
      status: httpStatus,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );
}
