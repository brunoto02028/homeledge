import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const resources = await (prisma as any).marketingResource.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(resources);
  } catch {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const user = await (prisma as any).user.findUnique({ where: { id: userId }, select: { role: true } });
    if (user?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { title, titlePt, description, descriptionPt, type, slug, fileUrl, coverImage, requiresEmail } = await req.json();
    if (!title || !type || !slug) return NextResponse.json({ error: 'title, type, slug required' }, { status: 400 });

    const resource = await (prisma as any).marketingResource.create({
      data: { title, titlePt, description, descriptionPt, type, slug, fileUrl, coverImage, requiresEmail: requiresEmail ?? true },
    });
    return NextResponse.json(resource, { status: 201 });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error.code === 'P2002') return NextResponse.json({ error: 'Slug already exists' }, { status: 409 });
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
