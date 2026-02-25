import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getFileUrl, deleteFile } from '@/lib/s3';
import { requireUserId, getAccessibleUserIds } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserId();
    const userIds = await getAccessibleUserIds(userId);
    const { id } = await params;
    const invoice = await prisma.invoice.findFirst({
      where: { id, userId: { in: userIds } },
      include: { category: true },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Get download URL
    const downloadUrl = await getFileUrl(invoice.cloudStoragePath, invoice.isPublic);

    return NextResponse.json({ ...invoice, downloadUrl });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserId();
    const userIds = await getAccessibleUserIds(userId);
    const { id } = await params;

    // Verify ownership
    const existing = await prisma.invoice.findFirst({ where: { id, userId: { in: userIds } } });
    if (!existing) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });

    const body = await request.json();
    const {
      providerName,
      invoiceNumber,
      invoiceDate,
      dueDate,
      amount,
      currency,
      categoryId,
      expenseType,
      description,
      status,
    } = body;

    const invoice = await prisma.invoice.update({
      where: { id },
      data: {
        providerName,
        invoiceNumber,
        invoiceDate: invoiceDate ? new Date(invoiceDate) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        amount: amount !== undefined ? parseFloat(amount) : undefined,
        currency,
        categoryId: categoryId || null,
        expenseType,
        description,
        status,
        processedAt: status === 'reviewed' ? new Date() : undefined,
      },
      include: { category: true },
    });

    await prisma.event.create({
      data: {
        userId,
        eventType: 'invoice.updated',
        entityType: 'invoice',
        entityId: invoice.id,
        payload: { fileName: invoice.fileName, providerName: invoice.providerName },
      },
    });

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Error updating invoice:', error);
    return NextResponse.json({ error: 'Failed to update invoice' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserId();
    const userIds = await getAccessibleUserIds(userId);
    const { id } = await params;
    const invoice = await prisma.invoice.findFirst({ where: { id, userId: { in: userIds } } });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    // Delete file from S3
    try {
      await deleteFile(invoice.cloudStoragePath);
    } catch (s3Error) {
      console.error('Error deleting file from S3:', s3Error);
    }

    await prisma.invoice.delete({ where: { id } });

    await prisma.event.create({
      data: {
        userId,
        eventType: 'invoice.deleted',
        entityType: 'invoice',
        entityId: id,
        payload: { fileName: invoice.fileName },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 });
  }
}
