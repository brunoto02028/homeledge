import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { createImapConnection, fetchMessages, fetchMessageBody, decryptPassword, generateSnippet } from '@/lib/email-client';

// GET /api/email/messages?accountId=xxx&folderId=xxx&page=1&limit=30
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const accountId = req.nextUrl.searchParams.get('accountId');
  const folderId = req.nextUrl.searchParams.get('folderId');
  const messageId = req.nextUrl.searchParams.get('messageId'); // single message body
  const page = parseInt(req.nextUrl.searchParams.get('page') || '1');
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '30');

  if (!accountId) return NextResponse.json({ error: 'accountId required' }, { status: 400 });

  // Verify ownership
  const account = await (prisma as any).emailAccount.findFirst({ where: { id: accountId, userId } });
  if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 });

  // Single message body fetch
  if (messageId) {
    const msg = await (prisma as any).emailMessage.findFirst({
      where: { id: messageId, accountId },
      include: { attachments: true, folder: { select: { path: true } } },
    });
    if (!msg) return NextResponse.json({ error: 'Message not found' }, { status: 404 });

    // If no body cached, fetch from IMAP
    if (!msg.bodyHtml && !msg.bodyText && msg.uid && account.passwordEnc) {
      try {
        const pass = decryptPassword(account.passwordEnc);
        const client = await createImapConnection({
          host: account.imapHost!,
          port: account.imapPort || 993,
          secure: account.useTls,
          auth: { user: account.username || account.email, pass },
        });
        const body = await fetchMessageBody(client, msg.folder.path, msg.uid);
        await client.logout();

        // Cache body
        if (body.bodyHtml || body.bodyText) {
          await (prisma as any).emailMessage.update({
            where: { id: messageId },
            data: { bodyHtml: body.bodyHtml, bodyText: body.bodyText },
          });
          return NextResponse.json({ ...msg, ...body });
        }
      } catch (err) {
        console.error('Failed to fetch message body:', err);
      }
    }

    // Mark as read
    if (!msg.isRead) {
      await (prisma as any).emailMessage.update({ where: { id: messageId }, data: { isRead: true } });
      await (prisma as any).emailFolder.update({
        where: { id: msg.folderId },
        data: { unreadCount: { decrement: 1 } },
      });
    }

    return NextResponse.json(msg);
  }

  // List messages for a folder
  const where: any = { accountId };
  if (folderId) where.folderId = folderId;

  const [messages, total] = await Promise.all([
    (prisma as any).emailMessage.findMany({
      where,
      select: {
        id: true, subject: true, fromAddress: true, fromName: true,
        toAddresses: true, snippet: true, isRead: true, isStarred: true,
        isDraft: true, hasAttachments: true, receivedAt: true, sentAt: true,
        aiCategory: true, aiSummary: true, folderId: true,
        folder: { select: { name: true, type: true } },
      },
      orderBy: { receivedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    (prisma as any).emailMessage.count({ where }),
  ]);

  return NextResponse.json({ messages, total, page, limit, pages: Math.ceil(total / limit) });
}

// PATCH /api/email/messages — update message flags (read, starred)
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { messageId, isRead, isStarred } = body;
  if (!messageId) return NextResponse.json({ error: 'messageId required' }, { status: 400 });

  // Verify ownership
  const msg = await (prisma as any).emailMessage.findFirst({
    where: { id: messageId },
    include: { account: { select: { userId: true } } },
  });
  if (!msg || msg.account.userId !== userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const data: any = {};
  if (isRead !== undefined) {
    data.isRead = isRead;
    // Update folder unread count
    const delta = isRead ? -1 : 1;
    await (prisma as any).emailFolder.update({
      where: { id: msg.folderId },
      data: { unreadCount: { increment: delta } },
    });
  }
  if (isStarred !== undefined) data.isStarred = isStarred;

  const updated = await (prisma as any).emailMessage.update({ where: { id: messageId }, data });
  return NextResponse.json(updated);
}

// DELETE /api/email/messages?id=xxx — delete a message
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Message ID required' }, { status: 400 });

  const msg = await (prisma as any).emailMessage.findFirst({
    where: { id },
    include: { account: { select: { userId: true } } },
  });
  if (!msg || msg.account.userId !== userId) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await (prisma as any).emailMessage.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
