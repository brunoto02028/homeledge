import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId, getAccessibleUserIds } from '@/lib/auth';

// POST: Create a bill from scanned document
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserId();
    const userIds = await getAccessibleUserIds(userId);
    const { id } = await params;
    const body = await request.json();
    const { accountId, billName, frequency, dueDay, categoryId } = body;

    // Get the document (verify ownership)
    const document = await prisma.scannedDocument.findFirst({
      where: { id, userId: { in: userIds } },
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    if (!accountId) {
      return NextResponse.json(
        { error: 'accountId is required to create a bill' },
        { status: 400 }
      );
    }

    // Create bill from document data
    const bill = await prisma.bill.create({
      data: {
        accountId,
        billName: billName || document.senderName || 'Unknown Bill',
        amount: document.amountDue || 0,
        currency: document.currency || 'GBP',
        frequency: (frequency || 'monthly') as any,
        dueDay: dueDay || (document.dueDate ? new Date(document.dueDate).getDate() : 1),
        categoryId: categoryId || null,
        userId,
        isActive: true,
      },
      include: {
        account: {
          include: { provider: true },
        },
        category: true,
      },
    });

    // Link document to bill
    await prisma.scannedDocument.update({
      where: { id },
      data: {
        linkedBillId: bill.id,
        status: 'filed',
      },
    });

    return NextResponse.json({
      success: true,
      bill,
    });
  } catch (error) {
    console.error('Error creating bill from document:', error);
    return NextResponse.json(
      { error: 'Failed to create bill' },
      { status: 500 }
    );
  }
}
