import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId, getAccessibleUserIds } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const userId = await requireUserId();
    const userIds = await getAccessibleUserIds(userId);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const categoryId = searchParams.get('categoryId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const entityId = searchParams.get('entityId');

    const where: Record<string, unknown> = { userId: { in: userIds } };
    if (status) where.status = status;
    if (categoryId) where.categoryId = categoryId;
    if (entityId) where.entityId = entityId;
    if (dateFrom || dateTo) {
      where.invoiceDate = {};
      if (dateFrom) (where.invoiceDate as Record<string, Date>).gte = new Date(dateFrom);
      if (dateTo) (where.invoiceDate as Record<string, Date>).lte = new Date(dateTo);
    }

    const invoices = await prisma.invoice.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(invoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const body = await request.json();
    const {
      fileName,
      cloudStoragePath,
      isPublic = false,
      providerName,
      invoiceNumber,
      invoiceDate,
      dueDate,
      amount,
      currency = 'GBP',
      categoryId,
      entityId,
      expenseType,
      description,
      extractedData,
      status = 'pending',
    } = body;

    if (!fileName || !cloudStoragePath) {
      return NextResponse.json(
        { error: 'fileName and cloudStoragePath are required' },
        { status: 400 }
      );
    }

    const invoice = await prisma.invoice.create({
      data: {
        fileName,
        cloudStoragePath,
        isPublic,
        status,
        userId: userId ?? null,
        providerName,
        invoiceNumber,
        invoiceDate: invoiceDate ? new Date(invoiceDate) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        amount: amount ? parseFloat(amount) : null,
        currency,
        categoryId,
        entityId: entityId || null,
        expenseType,
        description,
        extractedData,
        processedAt: status === 'processed' ? new Date() : null,
      },
      include: { category: true },
    });

    await prisma.event.create({
      data: {
        userId,
        eventType: 'invoice.created',
        entityType: 'invoice',
        entityId: invoice.id,
        payload: { fileName, providerName, amount },
      },
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}
