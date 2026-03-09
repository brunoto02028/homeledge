import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Public GET — returns active popups (no auth needed, used by frontend)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const adminMode = searchParams.get('admin') === 'true';

  if (adminMode) {
    try {
      const userId = await requireUserId();
      const user = await (prisma as any).user.findUnique({ where: { id: userId }, select: { role: true } });
      if (user?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      const popups = await (prisma as any).popupConfig.findMany({ orderBy: { createdAt: 'desc' } });
      return NextResponse.json(popups);
    } catch (error: any) {
      if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
  }

  // Public: return only active popups
  const popups = await (prisma as any).popupConfig.findMany({
    where: { isActive: true },
    select: {
      id: true, type: true, triggerValue: true,
      titleEn: true, titlePt: true,
      bodyEn: true, bodyPt: true,
      ctaEn: true, ctaPt: true,
      showOnPaths: true,
    },
  });
  return NextResponse.json(popups);
}

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const user = await (prisma as any).user.findUnique({ where: { id: userId }, select: { role: true } });
    if (user?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const { name, type, triggerValue, titleEn, titlePt, bodyEn, bodyPt, ctaEn, ctaPt, resourceId, isActive, showOnPaths } = body;

    if (!name || !type || !titleEn || !bodyEn || !ctaEn) {
      return NextResponse.json({ error: 'name, type, titleEn, bodyEn, ctaEn required' }, { status: 400 });
    }

    const popup = await (prisma as any).popupConfig.create({
      data: {
        name, type,
        triggerValue: triggerValue || 30,
        titleEn, titlePt, bodyEn, bodyPt, ctaEn, ctaPt,
        resourceId: resourceId || null,
        isActive: isActive ?? false,
        showOnPaths: showOnPaths || [],
      },
    });
    return NextResponse.json(popup, { status: 201 });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const userId = await requireUserId();
    const user = await (prisma as any).user.findUnique({ where: { id: userId }, select: { role: true } });
    if (user?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id, ...data } = await req.json();
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const popup = await (prisma as any).popupConfig.update({ where: { id }, data });
    return NextResponse.json(popup);
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
