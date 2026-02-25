import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId } from '@/lib/auth';
import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'logos');
const MAX_SIZE = 500 * 1024; // 500KB

// GET - Get current logo URL
export async function GET() {
  try {
    const userId = await requireUserId();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { logoUrl: true } as any,
    });
    return NextResponse.json({ logoUrl: (user as any)?.logoUrl || null });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

// POST - Upload logo (base64 data URL)
export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const { dataUrl } = await request.json();

    if (!dataUrl || !dataUrl.startsWith('data:image/')) {
      return NextResponse.json({ error: 'Invalid image data' }, { status: 400 });
    }

    // Extract base64 data and mime type
    const matches = dataUrl.match(/^data:image\/(png|jpeg|jpg|svg\+xml|webp|gif);base64,(.+)$/);
    if (!matches) {
      return NextResponse.json({ error: 'Unsupported image format' }, { status: 400 });
    }

    const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1] === 'svg+xml' ? 'svg' : matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    if (buffer.length > MAX_SIZE) {
      return NextResponse.json({ error: 'Image too large (max 500KB)' }, { status: 400 });
    }

    // Ensure upload directory exists
    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    // Delete old logo if exists
    const oldUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { logoUrl: true } as any,
    });
    const oldLogoUrl = (oldUser as any)?.logoUrl;
    if (oldLogoUrl && oldLogoUrl.startsWith('/uploads/logos/')) {
      const oldPath = path.join(process.cwd(), 'public', oldLogoUrl);
      try { await fs.unlink(oldPath); } catch { /* ignore */ }
    }

    // Save new file
    const filename = `${userId}-${crypto.randomBytes(4).toString('hex')}.${ext}`;
    const filepath = path.join(UPLOAD_DIR, filename);
    await fs.writeFile(filepath, new Uint8Array(buffer));

    const logoUrl = `/uploads/logos/${filename}`;

    // Update user in DB
    await prisma.user.update({
      where: { id: userId },
      data: { logoUrl } as any,
    });

    return NextResponse.json({ logoUrl });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[Logo Upload] Error:', error);
    return NextResponse.json({ error: 'Failed to upload logo' }, { status: 500 });
  }
}

// DELETE - Remove logo
export async function DELETE() {
  try {
    const userId = await requireUserId();

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { logoUrl: true } as any,
    });

    const logoUrl = (user as any)?.logoUrl;
    if (logoUrl && logoUrl.startsWith('/uploads/logos/')) {
      const filepath = path.join(process.cwd(), 'public', logoUrl);
      try { await fs.unlink(filepath); } catch { /* ignore */ }
    }

    await prisma.user.update({
      where: { id: userId },
      data: { logoUrl: null } as any,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[Logo Delete] Error:', error);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
