import { NextResponse } from 'next/server';
import { generatePresignedUploadUrl } from '@/lib/s3';
import { requireUserIdOrMobileToken } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fileName, contentType, isPublic = false, mobileToken } = body;
    await requireUserIdOrMobileToken(mobileToken);

    if (!fileName || !contentType) {
      return NextResponse.json(
        { error: 'fileName and contentType are required' },
        { status: 400 }
      );
    }

    const { uploadUrl, cloudStoragePath } = await generatePresignedUploadUrl(
      fileName,
      contentType,
      isPublic
    );

    return NextResponse.json({ uploadUrl, cloudStoragePath });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}
