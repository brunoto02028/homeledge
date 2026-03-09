import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs/promises';
import { randomUUID } from 'crypto';

export const runtime = 'nodejs';
export const maxDuration = 60;

const LOCAL_UPLOADS_DIR = process.env.LOCAL_UPLOADS_DIR || path.join(process.cwd(), 'public/uploads');
const PUBLIC_URL_BASE = process.env.UPLOADS_URL_BASE || '/uploads';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 });

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const allowed = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'avif'];
    if (!allowed.includes(ext)) {
      return NextResponse.json({ error: 'File type not allowed' }, { status: 400 });
    }

    const fileName = `${randomUUID()}.${ext}`;
    const destDir = path.join(LOCAL_UPLOADS_DIR, 'blog');
    const fullPath = path.join(destDir, fileName);

    await fs.mkdir(destDir, { recursive: true });
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(fullPath, new Uint8Array(buffer));

    const url = `${PUBLIC_URL_BASE}/blog/${fileName}`;
    return NextResponse.json({ url });
  } catch (error) {
    console.error('[LocalUpload POST] Error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const filePath = searchParams.get('path');

    if (!filePath) {
      return NextResponse.json({ error: 'path parameter required' }, { status: 400 });
    }

    // Security: prevent path traversal
    const sanitized = filePath.replace(/\.\./g, '').replace(/^\/+/, '');
    const fullPath = path.join(LOCAL_UPLOADS_DIR, sanitized);

    // Ensure it's still under the uploads dir
    if (!fullPath.startsWith(LOCAL_UPLOADS_DIR)) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 400 });
    }

    // Read the request body as ArrayBuffer
    const body = await req.arrayBuffer();
    const buffer = Buffer.from(body);

    // Ensure directory exists and write
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.writeFile(fullPath, new Uint8Array(buffer));

    console.log(`[LocalUpload] Saved ${buffer.length} bytes to ${fullPath}`);

    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error('[LocalUpload] Error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
