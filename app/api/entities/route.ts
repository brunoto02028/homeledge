import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId, getAccessibleUserIds } from '@/lib/auth';

// GET all entities for the current user
export async function GET() {
  try {
    const userId = await requireUserId();
    const userIds = await getAccessibleUserIds(userId);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const entities = await prisma.entity.findMany({
      where: { userId: { in: userIds } },
      include: {
        _count: {
          select: {
            bankStatements: true,
            accounts: true,
          },
        },
      },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });

    return NextResponse.json(entities);
  } catch (error) {
    console.error('Error fetching entities:', error);
    return NextResponse.json({ error: 'Failed to fetch entities' }, { status: 500 });
  }
}

// POST - create a new entity
export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const userIds = await getAccessibleUserIds(userId);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();

    // If this is the first entity or marked as default, unset other defaults
    const existingCount = await prisma.entity.count({ where: { userId: { in: userIds } } });
    const isDefault = data.isDefault || existingCount === 0;

    if (isDefault) {
      await prisma.entity.updateMany({
        where: { userId: { in: userIds }, isDefault: true },
        data: { isDefault: false },
      });
    }

    // Auto-set tax regime based on type
    let taxRegime = data.taxRegime || 'self_assessment';
    if (data.type === 'limited_company' || data.type === 'llp') {
      taxRegime = 'corporation_tax';
    } else if (data.type === 'sole_trader') {
      taxRegime = 'self_assessment';
    }

    const entity = await prisma.entity.create({
      data: {
        userId,
        name: data.name,
        tradingName: data.tradingName || null,
        type: data.type || 'individual',
        taxRegime,
        isDefault,
        companyNumber: data.companyNumber || null,
        companyStatus: data.companyStatus || null,
        sicCodes: data.sicCodes || [],
        incorporationDate: data.incorporationDate ? new Date(data.incorporationDate) : null,
        utr: data.utr || null,
        vatNumber: data.vatNumber || null,
        isVatRegistered: data.isVatRegistered || false,
        vatScheme: data.vatScheme || null,
        payeReference: data.payeReference || null,
        niNumber: data.niNumber || null,
        registeredAddress: data.registeredAddress || null,
        tradingAddress: data.tradingAddress || null,
        financialYearStart: data.financialYearStart ? new Date(data.financialYearStart) : null,
        financialYearEnd: data.financialYearEnd ? new Date(data.financialYearEnd) : null,
        accountingBasis: data.accountingBasis || null,
        officers: data.officers || null,
        logoUrl: data.logoUrl || null,
        notes: data.notes || null,
      },
    });

    return NextResponse.json(entity, { status: 201 });
  } catch (error) {
    console.error('Error creating entity:', error);
    return NextResponse.json({ error: 'Failed to create entity' }, { status: 500 });
  }
}
