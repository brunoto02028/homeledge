import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId, getAccessibleUserIds } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireUserId();
    const userIds = await getAccessibleUserIds(userId);
    const template = await prisma.invoiceTemplate.findFirst({
      where: { id: params.id, userId: { in: userIds } },
    });
    
    if (!template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }
    
    return NextResponse.json(template);
  } catch (error) {
    console.error('Error fetching template:', error);
    return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireUserId();
    const userIds = await getAccessibleUserIds(userId);
    const existing = await prisma.invoiceTemplate.findFirst({ where: { id: params.id, userId: { in: userIds } } });
    if (!existing) return NextResponse.json({ error: 'Template not found' }, { status: 404 });

    const data = await request.json();
    
    // If this is set as default, unset any existing default for this user
    if (data.isDefault) {
      await prisma.invoiceTemplate.updateMany({
        where: { isDefault: true, userId, NOT: { id: params.id } },
        data: { isDefault: false },
      });
    }
    
    const template = await prisma.invoiceTemplate.update({
      where: { id: params.id },
      data: {
        name: data.name,
        isDefault: data.isDefault,
        businessName: data.businessName,
        businessAddress: data.businessAddress,
        businessEmail: data.businessEmail,
        businessPhone: data.businessPhone,
        vatNumber: data.vatNumber,
        companyNumber: data.companyNumber,
        logoUrl: data.logoUrl,
        bankName: data.bankName,
        accountName: data.accountName,
        sortCode: data.sortCode,
        accountNumber: data.accountNumber,
        iban: data.iban,
        bic: data.bic,
        currency: data.currency,
        vatRate: data.vatRate,
        paymentTerms: data.paymentTerms,
        footerNotes: data.footerNotes,
      },
    });
    
    return NextResponse.json(template);
  } catch (error) {
    console.error('Error updating template:', error);
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = await requireUserId();
    const userIds = await getAccessibleUserIds(userId);
    const existing = await prisma.invoiceTemplate.findFirst({ where: { id: params.id, userId: { in: userIds } } });
    if (!existing) return NextResponse.json({ error: 'Template not found' }, { status: 404 });

    await prisma.invoiceTemplate.delete({
      where: { id: params.id },
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 });
  }
}
