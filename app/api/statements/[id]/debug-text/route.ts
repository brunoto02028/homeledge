import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId, getAccessibleUserIds } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireUserId();
    const userIds = await getAccessibleUserIds(userId);
    const statement = await prisma.bankStatement.findFirst({
      where: { id: params.id, userId: { in: userIds } },
      select: {
        id: true,
        fileName: true,
        extractedText: true,
        parseStatus: true,
        parseError: true,
        createdAt: true,
      },
    });

    if (!statement) {
      return NextResponse.json({ error: 'Statement not found' }, { status: 404 });
    }

    const extractedText = statement.extractedText || '';
    const preview = extractedText.substring(0, 3000);
    const totalLength = extractedText.length;

    return NextResponse.json({
      id: statement.id,
      fileName: statement.fileName,
      parseStatus: statement.parseStatus,
      parseError: statement.parseError,
      textLength: totalLength,
      textPreview: preview,
      hasMoreText: totalLength > 3000,
    });
  } catch (error) {
    console.error('Error fetching debug text:', error);
    return NextResponse.json(
      { error: 'Failed to fetch debug text' },
      { status: 500 }
    );
  }
}
