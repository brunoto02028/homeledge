import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// PUT /api/admin/integrations/[id] — Admin only: update
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name, baseUrl, apiKey, isActive, config } = await req.json();

    const data: Record<string, any> = {};
    if (name !== undefined) data.name = name;
    if (baseUrl !== undefined) data.baseUrl = baseUrl.replace(/\/+$/, '');
    if (apiKey !== undefined) data.apiKey = apiKey;
    if (isActive !== undefined) data.isActive = isActive;
    if (config !== undefined) data.config = config;

    const integration = await prisma.externalIntegration.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json({
      ...integration,
      apiKey: `${integration.apiKey.slice(0, 8)}...${integration.apiKey.slice(-4)}`,
    });
  } catch (error) {
    console.error('Error updating integration:', error);
    return NextResponse.json({ error: 'Failed to update integration' }, { status: 500 });
  }
}

// DELETE /api/admin/integrations/[id] — Admin only: delete
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await prisma.externalIntegration.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting integration:', error);
    return NextResponse.json({ error: 'Failed to delete integration' }, { status: 500 });
  }
}
