import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const entityId = searchParams.get('entityId');

    const where: any = { userId };
    if (entityId) where.entityId = entityId;

    const policies = await prisma.insurancePolicy.findMany({
      where,
      orderBy: { endDate: 'asc' },
      include: { entity: { select: { id: true, name: true } } },
    });

    return NextResponse.json(policies);
  } catch (error) {
    console.error('[Insurance] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch policies' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const {
      type, providerName, policyNumber, holderName, coverageAmount,
      premiumAmount, premiumFrequency, excessAmount, startDate, endDate,
      isActive, autoRenewal, notes, entityId,
      vehicleReg, vehicleMake, vehicleModel, vehicleYear, coverType, ncdYears,
      beneficiary, termYears,
      propertyAddress, buildingsValue, contentsValue,
    } = body;

    if (!type || !providerName || !premiumAmount || !startDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const policy = await prisma.insurancePolicy.create({
      data: {
        userId,
        entityId: entityId || null,
        type,
        providerName,
        policyNumber: policyNumber || null,
        holderName: holderName || null,
        coverageAmount: coverageAmount ? parseFloat(coverageAmount) : null,
        premiumAmount: parseFloat(premiumAmount),
        premiumFrequency: premiumFrequency || 'monthly',
        excessAmount: excessAmount ? parseFloat(excessAmount) : null,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        isActive: isActive !== false,
        autoRenewal: autoRenewal !== false,
        notes: notes || null,
        vehicleReg: vehicleReg || null,
        vehicleMake: vehicleMake || null,
        vehicleModel: vehicleModel || null,
        vehicleYear: vehicleYear ? parseInt(vehicleYear) : null,
        coverType: coverType || null,
        ncdYears: ncdYears ? parseInt(ncdYears) : null,
        beneficiary: beneficiary || null,
        termYears: termYears ? parseInt(termYears) : null,
        propertyAddress: propertyAddress || null,
        buildingsValue: buildingsValue ? parseFloat(buildingsValue) : null,
        contentsValue: contentsValue ? parseFloat(contentsValue) : null,
      },
    });

    return NextResponse.json(policy, { status: 201 });
  } catch (error) {
    console.error('[Insurance] POST error:', error);
    return NextResponse.json({ error: 'Failed to create policy' }, { status: 500 });
  }
}
