import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId, getAccessibleUserIds } from '@/lib/auth';

// PUT - Update property
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserId();
    const userIds = await getAccessibleUserIds(userId);
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.property.findFirst({ where: { id, userId: { in: userIds } } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const updated = await prisma.property.update({
      where: { id },
      data: {
        ...(body.name !== undefined && { name: body.name }),
        ...(body.type !== undefined && { type: body.type }),
        ...(body.address !== undefined && { address: body.address || null }),
        ...(body.postcode !== undefined && { postcode: body.postcode || null }),
        ...(body.purchasePrice !== undefined && { purchasePrice: body.purchasePrice ? parseFloat(body.purchasePrice) : null }),
        ...(body.currentValue !== undefined && { currentValue: body.currentValue ? parseFloat(body.currentValue) : null }),
        ...(body.mortgageBalance !== undefined && { mortgageBalance: body.mortgageBalance ? parseFloat(body.mortgageBalance) : null }),
        ...(body.mortgageRate !== undefined && { mortgageRate: body.mortgageRate ? parseFloat(body.mortgageRate) : null }),
        ...(body.mortgageType !== undefined && { mortgageType: body.mortgageType || null }),
        ...(body.monthlyPayment !== undefined && { monthlyPayment: body.monthlyPayment ? parseFloat(body.monthlyPayment) : null }),
        ...(body.rentalIncome !== undefined && { rentalIncome: body.rentalIncome ? parseFloat(body.rentalIncome) : null }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
        ...(body.notes !== undefined && { notes: body.notes || null }),
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

// DELETE - Delete property
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserId();
    const userIds = await getAccessibleUserIds(userId);
    const { id } = await params;

    const existing = await prisma.property.findFirst({ where: { id, userId: { in: userIds } } });
    if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await prisma.property.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
