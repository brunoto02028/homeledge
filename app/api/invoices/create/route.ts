import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const body = await request.json();
    const {
      yourName,
      yourAddress,
      yourEmail,
      yourPhone,
      yourCompanyNumber,
      yourVatNumber,
      clientName,
      clientAddress,
      clientEmail,
      invoiceNumber,
      invoiceDate,
      dueDate,
      bankName,
      accountName,
      sortCode,
      accountNumber,
      items,
      subtotal,
      vatRate,
      vatAmount,
      total,
      notes,
      paymentTerms,
      isPaid,
    } = body;

    if (!clientName || !invoiceNumber) {
      return NextResponse.json(
        { error: 'Client name and invoice number are required' },
        { status: 400 }
      );
    }

    // Find or create the "Other Income" category for created invoices
    let incomeCategory = await prisma.category.findFirst({
      where: { name: 'Other Income', type: 'income' },
    });

    if (!incomeCategory) {
      incomeCategory = await prisma.category.create({
        data: {
          name: 'Other Income',
          description: 'Income from invoices',
          icon: 'Plus',
          color: '#65a30d',
          type: 'income',
          isDefault: true,
        },
      });
    }

    // Create the invoice record
    const invoice = await prisma.invoice.create({
      data: {
        userId,
        fileName: `Invoice-${invoiceNumber}.json`,
        cloudStoragePath: `invoices/created/${Date.now()}-${invoiceNumber}.json`,
        isPublic: false,
        status: isPaid ? 'reviewed' : 'processed',
        providerName: yourName || 'Self',
        invoiceNumber,
        invoiceDate: invoiceDate ? new Date(invoiceDate) : new Date(),
        dueDate: dueDate ? new Date(dueDate) : null,
        amount: total,
        currency: 'GBP',
        categoryId: incomeCategory.id,
        expenseType: 'one_off',
        description: `Invoice to ${clientName}`,
        extractedData: {
          type: 'created_invoice',
          yourDetails: {
            name: yourName,
            address: yourAddress,
            email: yourEmail,
            phone: yourPhone,
            companyNumber: yourCompanyNumber,
            vatNumber: yourVatNumber,
          },
          clientDetails: {
            name: clientName,
            address: clientAddress,
            email: clientEmail,
          },
          bankDetails: {
            bankName,
            accountName,
            sortCode,
            accountNumber,
          },
          items,
          totals: {
            subtotal,
            vatRate,
            vatAmount,
            total,
          },
          notes,
          paymentTerms,
          isPaid,
        },
        processedAt: new Date(),
      },
      include: { category: true },
    });

    // Create an event
    await prisma.event.create({
      data: {
        userId,
        eventType: 'invoice.created',
        entityType: 'invoice',
        entityId: invoice.id,
        payload: {
          invoiceNumber,
          clientName,
          total,
          isPaid,
        },
      },
    });

    // If not paid, create a reminder action
    if (!isPaid && dueDate) {
      await prisma.action.create({
        data: {
          actionType: 'other',
          title: `Payment reminder: Invoice ${invoiceNumber}`,
          description: `Invoice ${invoiceNumber} to ${clientName} for ${new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(total)} is due on ${new Date(dueDate).toLocaleDateString('en-GB')}`,
          status: 'pending',
          priority: 'medium',
          dueDate: new Date(dueDate),
          createdBy: 'system',
          userId,
        },
      });
    }

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error('Error creating invoice:', error);
    return NextResponse.json(
      { error: 'Failed to create invoice' },
      { status: 500 }
    );
  }
}
