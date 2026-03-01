import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { uploadBuffer } from '@/lib/s3';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const entityId = formData.get('entityId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Read file into buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const fileName = file.name;
    const contentType = file.type || 'application/octet-stream';

    // Upload to S3
    const cloudStoragePath = await uploadBuffer(buffer, fileName, contentType);

    // Save as ScannedDocument in database
    const doc = await (prisma as any).scannedDocument.create({
      data: {
        userId,
        entityId: entityId && entityId !== 'none' ? entityId : null,
        originalFileName: fileName,
        cloudStoragePath,
        mimeType: contentType,
        fileSize: buffer.length,
        status: 'uploaded',
        extractedData: {},
      },
    });

    // Try to scan with Docling in background (non-blocking)
    if (contentType === 'application/pdf' || contentType.startsWith('image/')) {
      fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/documents/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId: doc.id, cloudStoragePath, entityId: entityId || null }),
      }).catch(() => {});
    }

    return NextResponse.json({
      id: doc.id,
      fileName,
      cloudStoragePath,
      message: 'File uploaded successfully',
    });
  } catch (error: any) {
    console.error('[Files Upload]', error);
    return NextResponse.json({ error: error.message || 'Upload failed' }, { status: 500 });
  }
}
