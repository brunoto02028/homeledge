import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId } from '@/lib/auth';
import { encrypt, decrypt } from '@/lib/vault-crypto';

async function requireAdmin() {
  const userId = await requireUserId();
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
  if (!user || user.role !== 'admin') throw new Error('FORBIDDEN');
  return userId;
}

// GET all credentials (admin only)
export async function GET() {
  try {
    await requireAdmin();

    const credentials = await (prisma as any).apiCredential.findMany({
      orderBy: [{ provider: 'asc' }, { sortOrder: 'asc' }],
    });

    // Decrypt values for display (masked by default)
    const decrypted = credentials.map((c: any) => ({
      ...c,
      value: decrypt(c.value),
    }));

    return NextResponse.json(decrypted);
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'FORBIDDEN') return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    console.error('[Credentials] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch credentials' }, { status: 500 });
  }
}

// POST create credential
export async function POST(request: Request) {
  try {
    await requireAdmin();
    const { provider, label, keyName, value, category, notes, isActive, sortOrder } = await request.json();

    if (!provider || !label || !keyName || !value) {
      return NextResponse.json({ error: 'provider, label, keyName, and value are required' }, { status: 400 });
    }

    const credential = await (prisma as any).apiCredential.create({
      data: {
        provider,
        label,
        keyName,
        value: encrypt(value),
        category: category || 'api_key',
        notes: notes || null,
        isActive: isActive !== false,
        sortOrder: sortOrder || 0,
      },
    });

    return NextResponse.json({ ...credential, value: decrypt(credential.value) }, { status: 201 });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (error.message === 'FORBIDDEN') return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    if (error.code === 'P2002') return NextResponse.json({ error: 'Credential with this provider+keyName already exists' }, { status: 409 });
    console.error('[Credentials] POST error:', error);
    return NextResponse.json({ error: 'Failed to create credential' }, { status: 500 });
  }
}
