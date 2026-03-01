import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/files — List all user files across the system
export async function GET(req: NextRequest) {
  try {
    const userId = await requireUserId();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const category = req.nextUrl.searchParams.get('category');
    const entityId = req.nextUrl.searchParams.get('entityId');

    // Fetch bank statements
    const statementsWhere: any = { userId };
    if (entityId) statementsWhere.entityId = entityId;
    const statements = await prisma.bankStatement.findMany({
      where: statementsWhere,
      select: {
        id: true,
        fileName: true,
        cloudStoragePath: true,
        statementDate: true,
        createdAt: true,
        entityId: true,
        entity: { select: { name: true, type: true } },
        account: { select: { accountName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch scanned documents
    const docsWhere: any = { userId };
    if (entityId) docsWhere.entityId = entityId;
    const documents = await prisma.scannedDocument.findMany({
      where: docsWhere,
      select: {
        id: true,
        fileName: true,
        cloudStoragePath: true,
        createdAt: true,
        documentType: true,
        senderName: true,
        status: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch invoices with files (NOT at top level for Prisma compatibility)
    const invoicesWhere: any = { userId, NOT: { cloudStoragePath: null } };
    if (entityId) invoicesWhere.entityId = entityId;
    const invoices = await prisma.invoice.findMany({
      where: invoicesWhere,
      select: {
        id: true,
        invoiceNumber: true,
        cloudStoragePath: true,
        createdAt: true,
        description: true,
        entityId: true,
        entity: { select: { name: true, type: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Normalize into a unified file list
    const files: any[] = [];

    for (const s of statements) {
      files.push({
        id: s.id,
        name: s.fileName || 'Bank Statement',
        path: s.cloudStoragePath,
        category: 'statement',
        date: s.createdAt,
        detail: (s as any).account?.accountName || '',
        entityId: (s as any).entityId || null,
        entityName: (s as any).entity?.name || null,
        entityType: (s as any).entity?.type || null,
        fileType: guessFileType(s.fileName),
      });
    }

    for (const d of documents) {
      files.push({
        id: d.id,
        name: d.fileName || `Document - ${d.senderName}`,
        path: d.cloudStoragePath,
        category: 'document',
        date: d.createdAt,
        detail: d.senderName || d.documentType || '',
        entityId: null,
        entityName: null,
        entityType: null,
        fileType: guessFileType(d.fileName),
        status: d.status,
      });
    }

    for (const inv of invoices) {
      files.push({
        id: inv.id,
        name: `Invoice ${inv.invoiceNumber}`,
        path: inv.cloudStoragePath,
        category: 'invoice',
        date: inv.createdAt,
        detail: inv.description || '',
        entityId: (inv as any).entityId || null,
        entityName: (inv as any).entity?.name || null,
        entityType: (inv as any).entity?.type || null,
        fileType: 'pdf',
      });
    }

    // Filter by category
    const filtered = category && category !== 'all'
      ? files.filter(f => f.category === category)
      : files;

    // Sort by date descending
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Summary stats
    const stats = {
      total: files.length,
      statements: files.filter(f => f.category === 'statement').length,
      documents: files.filter(f => f.category === 'document').length,
      invoices: files.filter(f => f.category === 'invoice').length,
    };

    return NextResponse.json({ files: filtered, stats });
  } catch (error) {
    console.error('Error fetching files:', error);
    return NextResponse.json({ error: 'Failed to fetch files' }, { status: 500 });
  }
}

function guessFileType(fileName: string | null): string {
  if (!fileName) return 'unknown';
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (['pdf'].includes(ext || '')) return 'pdf';
  if (['csv', 'ofx', 'qif'].includes(ext || '')) return 'data';
  if (['jpg', 'jpeg', 'png', 'webp', 'heic', 'gif'].includes(ext || '')) return 'image';
  return 'other';
}
