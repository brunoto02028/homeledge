import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId, getAccessibleUserIds } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const userIds = await getAccessibleUserIds(userId);
    const { invoiceId } = await request.json();

    if (!invoiceId) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 });
    }

    // Get the invoice
    const invoice = await prisma.invoice.findFirst({
      where: { id: invoiceId, userId: { in: userIds } },
      include: { category: true },
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    if (!invoice.providerName || !invoice.amount) {
      return NextResponse.json(
        { error: 'Invoice must have provider name and amount to create a bill' },
        { status: 400 }
      );
    }

    // Find or create provider
    let provider = await prisma.provider.findFirst({
      where: { name: { contains: invoice.providerName, mode: 'insensitive' }, userId: { in: userIds } },
    });

    if (!provider) {
      // Determine provider type based on category
      let providerType: 'bank' | 'utility' | 'subscription' | 'insurance' | 'other' = 'other';
      const categoryName = invoice.category?.name?.toLowerCase() || '';
      
      if (categoryName.includes('utilities') || categoryName.includes('telecoms')) {
        providerType = 'utility';
      } else if (categoryName.includes('insurance')) {
        providerType = 'insurance';
      } else if (categoryName.includes('subscriptions')) {
        providerType = 'subscription';
      } else if (categoryName.includes('bank')) {
        providerType = 'bank';
      }

      provider = await prisma.provider.create({
        data: {
          name: invoice.providerName,
          type: providerType,
          userId,
        },
      });
    }

    // Find the first account or create a default one
    let account = await prisma.account.findFirst({
      where: { isActive: true, provider: { userId: { in: userIds } } },
    });

    if (!account) {
      // Create a default account
      account = await prisma.account.create({
        data: {
          providerId: provider.id,
          accountName: 'Default Account',
          accountType: 'current',
          balance: 0,
          currency: 'GBP',
          isActive: true,
        },
      });
    }

    // Determine frequency and due day from invoice
    const invoiceDate = invoice.invoiceDate ? new Date(invoice.invoiceDate) : new Date();
    const dueDate = invoice.dueDate ? new Date(invoice.dueDate) : invoiceDate;
    const dueDay = dueDate.getDate();

    // Determine frequency based on expense type
    let frequency: 'one_time' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' = 'monthly';
    if (invoice.expenseType === 'one_off') {
      frequency = 'one_time';
    } else if (invoice.expenseType === 'fixed' || invoice.expenseType === 'recurring') {
      frequency = 'monthly';
    }

    // Check if a similar bill already exists
    const existingBill = await prisma.bill.findFirst({
      where: {
        billName: { contains: invoice.providerName, mode: 'insensitive' },
        accountId: account.id,
      },
    });

    if (existingBill) {
      return NextResponse.json(
        { error: 'A similar bill already exists', existingBillId: existingBill.id },
        { status: 409 }
      );
    }

    // Create the bill
    const bill = await prisma.bill.create({
      data: {
        accountId: account.id,
        billName: invoice.providerName,
        amount: invoice.amount,
        currency: invoice.currency,
        frequency,
        dueDay,
        categoryId: invoice.categoryId,
        expenseType: invoice.expenseType || 'recurring',
        userId,
        isActive: true,
      },
      include: {
        account: { include: { provider: true } },
        category: true,
      },
    });

    // Create event
    await prisma.event.create({
      data: {
        userId,
        eventType: 'bill.created_from_invoice',
        entityType: 'bill',
        entityId: bill.id,
        payload: {
          billName: bill.billName,
          amount: bill.amount,
          invoiceId: invoice.id,
          invoiceFileName: invoice.fileName,
        },
      },
    });

    return NextResponse.json(bill);
  } catch (error) {
    console.error('Error creating bill from invoice:', error);
    return NextResponse.json({ error: 'Failed to create bill' }, { status: 500 });
  }
}
