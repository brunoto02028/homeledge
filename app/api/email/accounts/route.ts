import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { encryptPassword, decryptPassword, createImapConnection, fetchFolders, PROVIDER_PRESETS } from '@/lib/email-client';

// GET /api/email/accounts — list user's email accounts
export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const accounts = await (prisma as any).emailAccount.findMany({
    where: { userId },
    include: {
      folders: { select: { id: true, name: true, path: true, type: true, unreadCount: true, totalCount: true } },
      signature: { select: { id: true, name: true } },
      _count: { select: { messages: true } },
    },
    orderBy: { createdAt: 'asc' },
  });

  // Strip sensitive fields
  const safe = accounts.map((acc: any) => { const { passwordEnc, accessToken, refreshToken, ...rest } = acc; return rest; });
  return NextResponse.json(safe);
}

// POST /api/email/accounts — add a new email account
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { email, displayName, provider, imapHost, imapPort, smtpHost, smtpPort, username, password, useTls, color } = body;

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
  }

  // Apply provider presets if selected
  const preset = provider && PROVIDER_PRESETS[provider];
  const finalImapHost = imapHost || preset?.imapHost;
  const finalImapPort = imapPort || preset?.imapPort || 993;
  const finalSmtpHost = smtpHost || preset?.smtpHost;
  const finalSmtpPort = smtpPort || preset?.smtpPort || 587;
  const finalUseTls = useTls !== undefined ? useTls : preset?.useTls ?? true;

  if (!finalImapHost || !finalSmtpHost) {
    return NextResponse.json({ error: 'IMAP and SMTP host are required' }, { status: 400 });
  }

  // Test IMAP connection before saving
  try {
    const client = await createImapConnection({
      host: finalImapHost,
      port: finalImapPort,
      secure: finalUseTls,
      auth: { user: username || email, pass: password },
    });

    // Fetch folders
    const folders = await fetchFolders(client);
    await client.logout();

    // Encrypt password and save
    const encPass = encryptPassword(password);

    const account = await (prisma as any).emailAccount.create({
      data: {
        userId,
        email,
        displayName: displayName || email.split('@')[0],
        provider: provider || 'imap',
        imapHost: finalImapHost,
        imapPort: finalImapPort,
        smtpHost: finalSmtpHost,
        smtpPort: finalSmtpPort,
        username: username || email,
        passwordEnc: encPass,
        useTls: finalUseTls,
        color: color || '#f59e0b',
        lastSyncAt: new Date(),
      },
    });

    // Create folders in DB
    if (folders.length > 0) {
      await (prisma as any).emailFolder.createMany({
        data: folders.map((f) => ({
          accountId: account.id,
          name: f.name,
          path: f.path,
          type: f.type,
        })),
      });
    }

    const { passwordEnc: _, ...safe } = account;
    return NextResponse.json({ ...safe, folders, message: 'Account added and connected successfully' });
  } catch (err: any) {
    console.error('Email account connection error:', err);
    return NextResponse.json(
      { error: `Connection failed: ${err.message || 'Could not connect to email server'}` },
      { status: 400 }
    );
  }
}

// DELETE /api/email/accounts?id=xxx — remove an email account
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Account ID required' }, { status: 400 });

  const account = await (prisma as any).emailAccount.findFirst({ where: { id, userId } });
  if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 });

  await (prisma as any).emailAccount.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
