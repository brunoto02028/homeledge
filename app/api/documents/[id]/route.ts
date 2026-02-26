import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId, getAccessibleUserIds } from '@/lib/auth';

// GET: Get a single document
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserId();
    const userIds = await getAccessibleUserIds(userId);
    const { id } = await params;
    
    const document = await prisma.scannedDocument.findFirst({
      where: { id, userId: { in: userIds } },
    });

    if (!document) {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ document });
  } catch (error) {
    console.error('Error fetching document:', error);
    return NextResponse.json(
      { error: 'Failed to fetch document' },
      { status: 500 }
    );
  }
}

// PUT: Update document (status, notes, link to bill/action)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    const body = await request.json();

    // Verify ownership
    const userIds = await getAccessibleUserIds(userId);
    const existing = await prisma.scannedDocument.findFirst({ where: { id, userId: { in: userIds } } });
    if (!existing) return NextResponse.json({ error: 'Document not found' }, { status: 404 });

    // Build update data — only include fields that are present in the request body
    const updateData: any = {};
    if (body.status !== undefined) updateData.status = body.status;
    if (body.notes !== undefined) updateData.notes = body.notes;
    if (body.linkedBillId !== undefined) updateData.linkedBillId = body.linkedBillId;
    if (body.linkedActionId !== undefined) updateData.linkedActionId = body.linkedActionId;
    if (body.tags !== undefined) updateData.tags = body.tags;
    if (body.entityId !== undefined) updateData.entityId = body.entityId;

    const document = await prisma.scannedDocument.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ document });
  } catch (error) {
    console.error('Error updating document:', error);
    return NextResponse.json(
      { error: 'Failed to update document' },
      { status: 500 }
    );
  }
}

// DELETE: Remove a scanned document
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserId();
    const { id } = await params;

    // Verify ownership
    const userIds = await getAccessibleUserIds(userId);
    const existing = await prisma.scannedDocument.findFirst({ where: { id, userId: { in: userIds } } });
    if (!existing) return NextResponse.json({ error: 'Document not found' }, { status: 404 });

    await prisma.scannedDocument.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}
