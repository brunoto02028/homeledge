import { NextRequest, NextResponse } from 'next/server';
import { getFileUrl } from '@/lib/s3';
import { requireUserId } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    await requireUserId();
    const { cloudStoragePath, isPublic } = await request.json();

    if (!cloudStoragePath) {
      return NextResponse.json({ error: 'cloudStoragePath is required' }, { status: 400 });
    }

    const url = await getFileUrl(cloudStoragePath, isPublic ?? false);

    return NextResponse.json({ url });
  } catch (error) {
    console.error('Error getting file URL:', error);
    return NextResponse.json({ error: 'Failed to get file URL' }, { status: 500 });
  }
}
