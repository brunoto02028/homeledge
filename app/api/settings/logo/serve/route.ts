import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId } from '@/lib/auth';
import fs from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic';

const MIME_MAP: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
};

/**
 * GET /api/settings/logo/serve — Serve the user's uploaded logo directly from disk.
 * This bypasses Next.js static file serving which doesn't serve dynamically uploaded files.
 */
export async function GET() {
  try {
    const userId = await requireUserId();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { logoUrl: true } as any,
    });

    const logoUrl = (user as any)?.logoUrl;
    if (!logoUrl || !logoUrl.startsWith('/uploads/logos/')) {
      return new NextResponse(null, { status: 404 });
    }

    const filePath = path.join(process.cwd(), 'public', logoUrl);

    let raw: Buffer;
    try {
      raw = await fs.readFile(filePath) as unknown as Buffer;
    } catch {
      // File missing on disk — clear stale DB reference
      await prisma.user.update({
        where: { id: userId },
        data: { logoUrl: null } as any,
      });
      return new NextResponse(null, { status: 404 });
    }

    const ext = path.extname(filePath).replace('.', '').toLowerCase();
    const contentType = MIME_MAP[ext] || 'application/octet-stream';

    return new Response(raw as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=60',
        'Content-Length': String(raw.length),
      },
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return new NextResponse(null, { status: 401 });
    }
    return new NextResponse(null, { status: 500 });
  }
}
