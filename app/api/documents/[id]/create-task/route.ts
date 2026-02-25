import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId, getAccessibleUserIds } from '@/lib/auth';

// POST: Create an action/task from scanned document
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserId();
    const userIds = await getAccessibleUserIds(userId);
    const { id } = await params;
    const body = await request.json();
    const { title, priority, dueDate } = body;

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

    // Create action from document data
    const action = await prisma.action.create({
      data: {
        actionType: 'other' as any,
        title: title || document.suggestedTaskTitle || `Action: ${document.senderName}`,
        description: document.summary ? `${document.summary}${document.amountDue ? ` - Amount: £${document.amountDue}` : ''}` : '',
        dueDate: dueDate ? new Date(dueDate) : (document.dueDate ? new Date(document.dueDate) : null),
        priority: (priority || 'medium') as any,
        status: 'pending' as any,
        userId,
      },
    });

    // Link document to action
    await prisma.scannedDocument.update({
      where: { id },
      data: {
        linkedActionId: action.id,
        status: 'filed',
      },
    });

    return NextResponse.json({
      success: true,
      action,
    });
  } catch (error) {
    console.error('Error creating task from document:', error);
    return NextResponse.json(
      { error: 'Failed to create task' },
      { status: 500 }
    );
  }
}
