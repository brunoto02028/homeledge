import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId } from '@/lib/auth';
import { getFileBuffer } from '@/lib/s3';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';

// POST - Send (or resend) a submission email
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await requireUserId();
    const { id } = await params;

    const submission = await (prisma as any).invoiceSubmission.findFirst({
      where: { id, userId },
      include: { profile: true },
    });

    if (!submission) return NextResponse.json({ error: 'Submission not found' }, { status: 404 });

    if (submission.status === 'success') {
      return NextResponse.json({ error: 'Cannot resend a successful submission' }, { status: 400 });
    }

    const profile = submission.profile;

    // Build SMTP transport
    const smtpConfig = {
      host: profile.smtpHost || process.env.SMTP_HOST || 'smtp.hostinger.com',
      port: profile.smtpPort || parseInt(process.env.SMTP_PORT || '465'),
      secure: true,
      auth: {
        user: profile.smtpUser || process.env.SMTP_USER || '',
        pass: profile.smtpPass || process.env.SMTP_PASS || '',
      },
    };

    const transporter = nodemailer.createTransport(smtpConfig);

    const mailOptions: any = {
      from: `${profile.companyName} <${submission.senderEmail}>`,
      to: submission.recipientEmail,
      subject: submission.emailSubject,
      text: submission.emailBody,
    };

    // HTML version with signature
    if (profile.emailSignature) {
      mailOptions.html = `<div style="font-family: Calibri, Arial, sans-serif; font-size: 14px; color: #333;">
        ${submission.emailBody.replace(/\n/g, '<br>')}
        <br><br>
        ${profile.emailSignature}
      </div>`;
    }

    // Attach PDF
    if (submission.pdfPath) {
      try {
        const pdfBuffer = await getFileBuffer(submission.pdfPath);
        mailOptions.attachments = [{
          filename: `${submission.fileCode}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        }];
      } catch (err: any) {
        return NextResponse.json({ error: `PDF attachment failed: ${err.message}` }, { status: 400 });
      }
    }

    const info = await transporter.sendMail(mailOptions);
    console.log(`[UPS Submit] Email sent: ${submission.invoiceCode} → ${submission.recipientEmail} (${info.messageId})`);

    // Update status
    const updated = await (prisma as any).invoiceSubmission.update({
      where: { id },
      data: {
        status: 'sent',
        sentAt: new Date(),
        errorMessage: null,
      },
      include: {
        profile: { select: { name: true } },
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[UPS Submit Send] Error:', error);

    // Try to record the error on the submission
    try {
      const { id } = await params;
      await (prisma as any).invoiceSubmission.update({
        where: { id },
        data: { status: 'error', errorMessage: error.message },
      });
    } catch { /* ignore */ }

    return NextResponse.json({ error: error.message || 'Failed to send email' }, { status: 500 });
  }
}
