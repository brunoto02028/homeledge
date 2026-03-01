import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { decryptPassword, sendEmail } from '@/lib/email-client';

// POST /api/email/send — send an email
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { accountId, to, cc, bcc, subject, text, html, inReplyTo, references } = body;

  if (!accountId || !to || !subject) {
    return NextResponse.json({ error: 'accountId, to, and subject are required' }, { status: 400 });
  }

  const account = await (prisma as any).emailAccount.findFirst({
    where: { id: accountId, userId },
    include: { signature: true },
  });
  if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 404 });
  if (!account.passwordEnc || !account.smtpHost) {
    return NextResponse.json({ error: 'SMTP not configured for this account' }, { status: 400 });
  }

  const pass = decryptPassword(account.passwordEnc);

  // Append signature if available
  let finalHtml = html || '';
  if (account.signature?.bodyHtml) {
    finalHtml += `<br/><br/>--<br/>${account.signature.bodyHtml}`;
  }

  try {
    const result = await sendEmail(
      {
        host: account.smtpHost,
        port: account.smtpPort || 587,
        secure: false, // STARTTLS
        auth: { user: account.username || account.email, pass },
      },
      {
        from: account.email,
        fromName: account.displayName || undefined,
        to: Array.isArray(to) ? to : [to],
        cc: cc ? (Array.isArray(cc) ? cc : [cc]) : undefined,
        bcc: bcc ? (Array.isArray(bcc) ? bcc : [bcc]) : undefined,
        subject,
        text: text || undefined,
        html: finalHtml || undefined,
        inReplyTo,
        references,
      }
    );

    // Save to sent folder in DB
    const sentFolder = await (prisma as any).emailFolder.findFirst({
      where: { accountId, type: 'sent' },
    });

    if (sentFolder) {
      await (prisma as any).emailMessage.create({
        data: {
          accountId,
          folderId: sentFolder.id,
          messageId: result.messageId,
          subject,
          fromAddress: account.email,
          fromName: account.displayName,
          toAddresses: Array.isArray(to) ? to : [to],
          ccAddresses: cc ? (Array.isArray(cc) ? cc : [cc]) : [],
          bodyText: text || null,
          bodyHtml: finalHtml || null,
          snippet: (text || '').substring(0, 200),
          isRead: true,
          sentAt: new Date(),
          receivedAt: new Date(),
          inReplyTo: inReplyTo || null,
        },
      });

      await (prisma as any).emailFolder.update({
        where: { id: sentFolder.id },
        data: { totalCount: { increment: 1 } },
      });
    }

    return NextResponse.json({ success: true, messageId: result.messageId });
  } catch (err: any) {
    console.error('Send email error:', err);
    return NextResponse.json({ error: `Failed to send: ${err.message}` }, { status: 500 });
  }
}
