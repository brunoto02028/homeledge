import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId, getAccessibleUserIds } from '@/lib/auth';

// GET: List all scanned documents
export async function GET(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const userIds = await getAccessibleUserIds(userId);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const documentType = searchParams.get('documentType');
    const limit = parseInt(searchParams.get('limit') || '50');

    const entityId = searchParams.get('entityId');

    const where: Record<string, unknown> = { userId: { in: userIds } };
    if (status) where.status = status;
    if (documentType) where.documentType = documentType;
    if (entityId) where.entityId = entityId;

    const documents = await prisma.scannedDocument.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return NextResponse.json({ documents });
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json(
      { error: 'Failed to fetch documents' },
      { status: 500 }
    );
  }
}
