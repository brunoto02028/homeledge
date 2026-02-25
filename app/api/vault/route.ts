import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId, getAccessibleUserIds } from '@/lib/auth';
import { encrypt, decrypt } from '@/lib/vault-crypto';

// GET - List all vault entries
export async function GET() {
  try {
    const userId = await requireUserId();
    const userIds = await getAccessibleUserIds(userId);

    const entries = await prisma.vaultEntry.findMany({
      where: { userId: { in: userIds } },
      orderBy: [{ isFavorite: 'desc' }, { updatedAt: 'desc' }],
    });

    // Decrypt sensitive fields before sending to client
    const decrypted = entries.map((entry) => ({
      ...entry,
      passwordEnc: entry.passwordEnc ? decrypt(entry.passwordEnc) : null,
    }));

    return NextResponse.json(decrypted);
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Vault list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Create vault entry
export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const body = await request.json();

    const { title, category, username, password, notes, referenceNumber,
      accountNumber, sortCode, websiteUrl, phoneNumber, email, tags, isFavorite } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const entry = await prisma.vaultEntry.create({
      data: {
        userId,
        title,
        category: category || 'other',
        username: username || null,
        passwordEnc: password ? encrypt(password) : null,
        notes: notes || null,
        referenceNumber: referenceNumber || null,
        accountNumber: accountNumber || null,
        sortCode: sortCode || null,
        websiteUrl: websiteUrl || null,
        phoneNumber: phoneNumber || null,
        email: email || null,
        tags: tags || [],
        isFavorite: isFavorite || false,
      },
    });

    return NextResponse.json({
      ...entry,
      passwordEnc: password || null,
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('Vault create error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
