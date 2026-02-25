import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId, getAccessibleUserIds } from '@/lib/auth';

// GET - Get single statement with transactions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserId();
    const userIds = await getAccessibleUserIds(userId);
    const { id } = await params;

    const statement = await prisma.bankStatement.findFirst({
      where: { id, userId: { in: userIds } },
      include: {
        account: {
          include: {
            provider: true,
          },
        },
        transactions: {
          include: {
            category: true,
          },
          orderBy: { date: 'desc' },
        },
      },
    });

    if (!statement) {
      return NextResponse.json({ error: 'Statement not found' }, { status: 404 });
    }

    return NextResponse.json(statement);
  } catch (error) {
    console.error('Error fetching statement:', error);
    return NextResponse.json({ error: 'Failed to fetch statement' }, { status: 500 });
  }
}

// PUT - Update statement
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserId();
    const userIds = await getAccessibleUserIds(userId);
    const { id } = await params;
    const data = await request.json();

    const existing = await prisma.bankStatement.findFirst({ where: { id, userId: { in: userIds } } });
    if (!existing) {
      return NextResponse.json({ error: 'Statement not found' }, { status: 404 });
    }

    const statement = await prisma.bankStatement.update({
      where: { id },
      data: {
        accountId: data.accountId,
        periodStart: data.periodStart ? new Date(data.periodStart) : null,
        periodEnd: data.periodEnd ? new Date(data.periodEnd) : null,
      },
      include: {
        account: {
          include: {
            provider: true,
          },
        },
        transactions: {
          include: {
            category: true,
          },
        },
      },
    });

    return NextResponse.json(statement);
  } catch (error) {
    console.error('Error updating statement:', error);
    return NextResponse.json({ error: 'Failed to update statement' }, { status: 500 });
  }
}

// DELETE - Delete statement and all its transactions
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserId();
    const userIds = await getAccessibleUserIds(userId);
    const { id } = await params;

    const existing = await prisma.bankStatement.findFirst({ where: { id, userId: { in: userIds } } });
    if (!existing) {
      return NextResponse.json({ error: 'Statement not found' }, { status: 404 });
    }

    await prisma.bankStatement.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting statement:', error);
    return NextResponse.json({ error: 'Failed to delete statement' }, { status: 500 });
  }
}
