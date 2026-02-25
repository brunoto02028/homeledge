import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId, getAccessibleUserIds } from '@/lib/auth';

// GET: Get a single life event with tasks
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserId();
    const userIds = await getAccessibleUserIds(userId);
    const { id } = await params;
    
    const event = await prisma.lifeEvent.findFirst({
      where: { id, userId: { in: userIds } },
      include: {
        tasks: {
          orderBy: [
            { priority: 'asc' },
            { dueDate: 'asc' }
          ]
        }
      }
    });

    if (!event) {
      return NextResponse.json(
        { error: 'Life event not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ event });
  } catch (error) {
    console.error('Error fetching life event:', error);
    return NextResponse.json(
      { error: 'Failed to fetch life event' },
      { status: 500 }
    );
  }
}

// PATCH: Update a life event
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    const body = await request.json();

    // Verify ownership
    const userIds = await getAccessibleUserIds(userId);
    const existing = await prisma.lifeEvent.findFirst({ where: { id, userId: { in: userIds } } });
    if (!existing) return NextResponse.json({ error: 'Life event not found' }, { status: 404 });

    const event = await prisma.lifeEvent.update({
      where: { id },
      data: body,
      include: {
        tasks: {
          orderBy: [
            { priority: 'asc' },
            { dueDate: 'asc' }
          ]
        }
      }
    });

    return NextResponse.json({ event });
  } catch (error) {
    console.error('Error updating life event:', error);
    return NextResponse.json(
      { error: 'Failed to update life event' },
      { status: 500 }
    );
  }
}

// DELETE: Delete a life event and all its tasks
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserId();
    const { id } = await params;

    // Verify ownership
    const userIds = await getAccessibleUserIds(userId);
    const existing = await prisma.lifeEvent.findFirst({ where: { id, userId: { in: userIds } } });
    if (!existing) return NextResponse.json({ error: 'Life event not found' }, { status: 404 });

    await prisma.lifeEvent.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting life event:', error);
    return NextResponse.json(
      { error: 'Failed to delete life event' },
      { status: 500 }
    );
  }
}
