import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { getFileBuffer } from '@/lib/s3';
import path from 'path';

export const dynamic = 'force-dynamic';

// GET /api/files/serve?path=local://uploads/... — Serve locally stored files
export async function GET(req: NextRequest) {
  try {
    const userId = await requireUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const filePath = req.nextUrl.searchParams.get('path');
    if (!filePath || !filePath.startsWith('local://')) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    // Prevent path traversal
    const relPath = filePath.replace('local://', '');
    if (relPath.includes('..') || relPath.includes('~')) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    const buffer = await getFileBuffer(filePath);
    const ext = path.extname(relPath).toLowerCase();

    const mimeMap: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.csv': 'text/csv',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
      '.ofx': 'application/x-ofx',
      '.qif': 'application/x-qif',
    };

    const contentType = mimeMap[ext] || 'application/octet-stream';
    const fileName = path.basename(relPath);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${fileName}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error: any) {
    console.error('[Files Serve]', error);
    if (error.code === 'ENOENT') {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to serve file' }, { status: 500 });
  }
}
