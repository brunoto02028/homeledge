import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId, getAccessibleUserIds } from '@/lib/auth';

export async function GET() {
  try {
    const userId = await requireUserId();
    const userIds = await getAccessibleUserIds(userId);
    const templates = await prisma.invoiceTemplate.findMany({
      where: { userId: { in: userIds } },
      orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
    });
    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireUserId();
    const data = await request.json();
    
    // If this is set as default, unset any existing default for this user
    if (data.isDefault) {
      await prisma.invoiceTemplate.updateMany({
        where: { isDefault: true, userId },
        data: { isDefault: false },
      });
    }
    
    const template = await prisma.invoiceTemplate.create({
      data: {
        name: data.name,
        userId,
        isDefault: data.isDefault ?? false,
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
        currency: data.currency ?? 'GBP',
        vatRate: data.vatRate ?? 20,
        paymentTerms: data.paymentTerms ?? 30,
        footerNotes: data.footerNotes,
      },
    });
    
    return NextResponse.json(template, { status: 201 });
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 });
  }
}
