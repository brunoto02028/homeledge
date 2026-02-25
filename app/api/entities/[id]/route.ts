import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId, getAccessibleUserIds } from '@/lib/auth';

// GET single entity
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const userIds = await getAccessibleUserIds(userId);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const entity = await prisma.entity.findFirst({
      where: { id: params.id, userId: { in: userIds } },
      include: {
        _count: { select: { bankStatements: true, accounts: true } },
      },
    });

    if (!entity) return NextResponse.json({ error: 'Entity not found' }, { status: 404 });
    return NextResponse.json(entity);
  } catch (error) {
    console.error('Error fetching entity:', error);
    return NextResponse.json({ error: 'Failed to fetch entity' }, { status: 500 });
  }
}

// PUT - update entity
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const userIds = await getAccessibleUserIds(userId);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const existing = await prisma.entity.findFirst({ where: { id: params.id, userId: { in: userIds } } });
    if (!existing) return NextResponse.json({ error: 'Entity not found' }, { status: 404 });

    const data = await request.json();

    // If setting as default, unset others
    if (data.isDefault) {
      await prisma.entity.updateMany({
        where: { userId: { in: userIds }, isDefault: true, id: { not: params.id } },
        data: { isDefault: false },
      });
    }

    const entity = await prisma.entity.update({
      where: { id: params.id },
      data: {
        name: data.name ?? existing.name,
        tradingName: data.tradingName !== undefined ? data.tradingName : existing.tradingName,
        type: data.type ?? existing.type,
        taxRegime: data.taxRegime ?? existing.taxRegime,
        isDefault: data.isDefault ?? existing.isDefault,
        companyNumber: data.companyNumber !== undefined ? data.companyNumber : existing.companyNumber,
        companyStatus: data.companyStatus !== undefined ? data.companyStatus : existing.companyStatus,
        sicCodes: data.sicCodes ?? existing.sicCodes,
        incorporationDate: data.incorporationDate ? new Date(data.incorporationDate) : existing.incorporationDate,
        utr: data.utr !== undefined ? data.utr : existing.utr,
        vatNumber: data.vatNumber !== undefined ? data.vatNumber : existing.vatNumber,
        isVatRegistered: data.isVatRegistered ?? existing.isVatRegistered,
        vatScheme: data.vatScheme !== undefined ? data.vatScheme : existing.vatScheme,
        payeReference: data.payeReference !== undefined ? data.payeReference : existing.payeReference,
        niNumber: data.niNumber !== undefined ? data.niNumber : existing.niNumber,
        registeredAddress: data.registeredAddress !== undefined ? data.registeredAddress : existing.registeredAddress,
        tradingAddress: data.tradingAddress !== undefined ? data.tradingAddress : existing.tradingAddress,
        financialYearStart: data.financialYearStart ? new Date(data.financialYearStart) : existing.financialYearStart,
        financialYearEnd: data.financialYearEnd ? new Date(data.financialYearEnd) : existing.financialYearEnd,
        accountingBasis: data.accountingBasis !== undefined ? data.accountingBasis : existing.accountingBasis,
        officers: data.officers !== undefined ? data.officers : existing.officers,
        logoUrl: data.logoUrl !== undefined ? data.logoUrl : existing.logoUrl,
        notes: data.notes !== undefined ? data.notes : existing.notes,
      },
    });

    return NextResponse.json(entity);
  } catch (error) {
    console.error('Error updating entity:', error);
    return NextResponse.json({ error: 'Failed to update entity' }, { status: 500 });
  }
}

// DELETE entity
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const userId = await requireUserId();
    const userIds = await getAccessibleUserIds(userId);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const existing = await prisma.entity.findFirst({ where: { id: params.id, userId: { in: userIds } } });
    if (!existing) return NextResponse.json({ error: 'Entity not found' }, { status: 404 });

    await prisma.entity.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting entity:', error);
    return NextResponse.json({ error: 'Failed to delete entity' }, { status: 500 });
  }
}
