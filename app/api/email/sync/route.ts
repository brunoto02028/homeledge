import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createImapConnection, fetchMessages, decryptPassword, generateSnippet } from '@/lib/email-client';

// POST /api/email/sync — sync messages from IMAP for an account
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { accountId, folderId } = body;

  if (!accountId) return NextResponse.json({ error: 'accountId required' }, { status: 400 });

  const account = await (prisma as any).emailAccount.findFirst({
    where: { id: accountId, userId },
    include: { folders: true },
  });
  if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 });
  if (!account.passwordEnc || !account.imapHost) {
    return NextResponse.json({ error: 'IMAP not configured' }, { status: 400 });
  }

  const pass = decryptPassword(account.passwordEnc);

  try {
    const client = await createImapConnection({
      host: account.imapHost,
      port: account.imapPort || 993,
      secure: account.useTls,
      auth: { user: account.username || account.email, pass },
    });

    // Determine which folders to sync
    const foldersToSync = folderId
      ? account.folders.filter((f: any) => f.id === folderId)
      : account.folders.filter((f: any) => ['inbox', 'sent'].includes(f.type));

    let totalNew = 0;

    for (const folder of foldersToSync) {
      const messages = await fetchMessages(client, folder.path, {
        limit: 50,
        sinceUid: folder.lastSyncUid || undefined,
      });

      let newCount = 0;
      let lastUid = folder.lastSyncUid;

      for (const msg of messages) {
        // Skip if already exists
        const existing = await (prisma as any).emailMessage.findFirst({
          where: { accountId, uid: msg.uid, folderId: folder.id },
        });
        if (existing) continue;

        const snippet = generateSnippet(msg.subject);
        const isRead = msg.flags.includes('\\Seen');

        await (prisma as any).emailMessage.create({
          data: {
            accountId,
            folderId: folder.id,
            uid: msg.uid,
            messageId: msg.messageId || null,
            inReplyTo: msg.inReplyTo || null,
            subject: msg.subject || null,
            fromAddress: msg.from.address,
            fromName: msg.from.name || null,
            toAddresses: msg.to.map((t) => t.address),
            ccAddresses: msg.cc.map((c) => c.address),
            snippet: snippet || null,
            isRead,
            hasAttachments: msg.hasAttachments,
            size: msg.size || null,
            sentAt: msg.date || null,
            receivedAt: msg.date || new Date(),
          },
        });
        newCount++;
        if (msg.uid) lastUid = msg.uid;
      }

      // Update folder counts
      const unreadCount = await (prisma as any).emailMessage.count({
        where: { folderId: folder.id, isRead: false },
      });
      const totalCount = await (prisma as any).emailMessage.count({
        where: { folderId: folder.id },
      });

      await (prisma as any).emailFolder.update({
        where: { id: folder.id },
        data: {
          unreadCount,
          totalCount,
          lastSyncUid: lastUid,
        },
      });

      totalNew += newCount;
    }

    await client.logout();

    // Update account last sync
    await (prisma as any).emailAccount.update({
      where: { id: accountId },
      data: { lastSyncAt: new Date() },
    });

    return NextResponse.json({ success: true, newMessages: totalNew });
  } catch (err: any) {
    console.error('Email sync error:', err);
    return NextResponse.json({ error: `Sync failed: ${err.message}` }, { status: 500 });
  }
}
