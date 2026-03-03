import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { deleteFile } from '@/lib/s3';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const existing = await prisma.insurancePolicy.findFirst({ where: { id: params.id, userId } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = await req.json();
    const {
      type, providerName, policyNumber, holderName, coverageAmount,
      premiumAmount, premiumFrequency, excessAmount, startDate, endDate,
      isActive, autoRenewal, notes, entityId,
      vehicleReg, vehicleMake, vehicleModel, vehicleYear, coverType, ncdYears,
      beneficiary, termYears,
      propertyAddress, buildingsValue, contentsValue,
      documentPath,
    } = body;

    const data: any = {
      type, providerName,
      policyNumber: policyNumber || null,
      holderName: holderName || null,
      entityId: entityId || null,
      coverageAmount: coverageAmount != null ? parseFloat(coverageAmount) : null,
      premiumAmount: premiumAmount != null ? parseFloat(premiumAmount) : existing.premiumAmount,
      premiumFrequency: premiumFrequency || existing.premiumFrequency,
      excessAmount: excessAmount != null ? parseFloat(excessAmount) : null,
      startDate: startDate ? new Date(startDate) : existing.startDate,
      endDate: endDate ? new Date(endDate) : null,
      isActive: isActive != null ? isActive : existing.isActive,
      autoRenewal: autoRenewal != null ? autoRenewal : existing.autoRenewal,
      notes: notes ?? existing.notes,
      vehicleReg: vehicleReg ?? null,
      vehicleMake: vehicleMake ?? null,
      vehicleModel: vehicleModel ?? null,
      vehicleYear: vehicleYear != null ? parseInt(vehicleYear) : null,
      coverType: coverType ?? null,
      ncdYears: ncdYears != null ? parseInt(ncdYears) : null,
      beneficiary: beneficiary ?? null,
      termYears: termYears != null ? parseInt(termYears) : null,
      propertyAddress: propertyAddress ?? null,
      buildingsValue: buildingsValue != null ? parseFloat(buildingsValue) : null,
      contentsValue: contentsValue != null ? parseFloat(contentsValue) : null,
    };

    if (documentPath !== undefined) {
      data.documentPath = documentPath || null;
    }

    const updated = await prisma.insurancePolicy.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[Insurance] PUT error:', error);
    return NextResponse.json({ error: 'Failed to update policy' }, { status: 500 });
  }
}

// PATCH /api/insurance/[id] — Partial update (document path, etc.)
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const existing = await prisma.insurancePolicy.findFirst({ where: { id: params.id, userId } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const body = await req.json();
    const { documentPath } = body;

    const updated = await prisma.insurancePolicy.update({
      where: { id: params.id },
      data: { documentPath: documentPath ?? null },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('[Insurance] PATCH error:', error);
    return NextResponse.json({ error: 'Failed to update policy' }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const existing = await prisma.insurancePolicy.findFirst({ where: { id: params.id, userId } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    // Clean up stored document
    if ((existing as any).documentPath) {
      try { await deleteFile((existing as any).documentPath); } catch { /* best effort */ }
    }

    await prisma.insurancePolicy.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Insurance] DELETE error:', error);
    return NextResponse.json({ error: 'Failed to delete policy' }, { status: 500 });
  }
}
