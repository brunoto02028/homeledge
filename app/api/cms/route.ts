import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

// GET /api/cms — Public: returns published sections. Admin with ?all=true gets all.
export async function GET(req: NextRequest) {
  try {
    const showAll = req.nextUrl.searchParams.get('all') === 'true';
    let where: any = { isPublished: true };

    if (showAll) {
      const session = await getServerSession(authOptions);
      if (session?.user && (session.user as any).role === 'admin') {
        where = {}; // admin sees everything
      }
    }

    const sections = await prisma.landingPageSection.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    });
    return NextResponse.json(sections);
  } catch (error) {
    console.error('Error fetching CMS sections:', error);
    return NextResponse.json({ error: 'Failed to fetch sections' }, { status: 500 });
  }
}

// PUT /api/cms — Admin only: update a section
export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { sectionKey, title, subtitle, content, imageUrl, isPublished, sortOrder } = body;

    if (!sectionKey) {
      return NextResponse.json({ error: 'sectionKey is required' }, { status: 400 });
    }

    const section = await prisma.landingPageSection.upsert({
      where: { sectionKey },
      update: {
        ...(title !== undefined && { title }),
        ...(subtitle !== undefined && { subtitle }),
        ...(content !== undefined && { content }),
        ...(imageUrl !== undefined && { imageUrl }),
        ...(isPublished !== undefined && { isPublished }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
      create: {
        sectionKey,
        title: title || '',
        subtitle: subtitle || '',
        content: content || {},
        imageUrl: imageUrl || null,
        isPublished: isPublished ?? true,
        sortOrder: sortOrder ?? 0,
      },
    });

    return NextResponse.json(section);
  } catch (error) {
    console.error('Error updating CMS section:', error);
    return NextResponse.json({ error: 'Failed to update section' }, { status: 500 });
  }
}
