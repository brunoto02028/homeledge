import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/admin/integrations — Admin only: list all integrations
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const integrations = await prisma.externalIntegration.findMany({
      orderBy: { createdAt: 'desc' },
    });
    // Mask API keys in response
    const masked = integrations.map(i => ({
      ...i,
      apiKey: i.apiKey ? `${i.apiKey.slice(0, 8)}...${i.apiKey.slice(-4)}` : '',
    }));
    return NextResponse.json(masked);
  } catch (error) {
    console.error('Error fetching integrations:', error);
    return NextResponse.json({ error: 'Failed to fetch integrations' }, { status: 500 });
  }
}

// POST /api/admin/integrations — Admin only: create an integration
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { name, slug, baseUrl, apiKey, config } = await req.json();

    if (!name || !slug || !baseUrl || !apiKey) {
      return NextResponse.json({ error: 'name, slug, baseUrl, and apiKey are required' }, { status: 400 });
    }

    const integration = await prisma.externalIntegration.create({
      data: {
        name,
        slug: slug.toLowerCase().replace(/\s+/g, '-'),
        baseUrl: baseUrl.replace(/\/+$/, ''),
        apiKey,
        config: config || {},
      },
    });

    return NextResponse.json({
      ...integration,
      apiKey: `${integration.apiKey.slice(0, 8)}...${integration.apiKey.slice(-4)}`,
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'An integration with this slug already exists' }, { status: 409 });
    }
    console.error('Error creating integration:', error);
    return NextResponse.json({ error: 'Failed to create integration' }, { status: 500 });
  }
}
