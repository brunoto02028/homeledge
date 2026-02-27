import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireUserId } from '@/lib/auth';
import { getFileBuffer } from '@/lib/s3';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';

// GET - List user's invoice submissions
export async function GET(request: Request) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(request.url);
    const profileId = searchParams.get('profileId');
    const status = searchParams.get('status');
    const prefix = searchParams.get('prefix');

    const where: Record<string, unknown> = { userId };
    if (profileId) where.profileId = profileId;
    if (status) where.status = status;
    if (prefix) where.prefix = prefix;

    const submissions = await (prisma as any).invoiceSubmission.findMany({
      where,
      orderBy: { sequenceNumber: 'desc' },
      include: {
        profile: {
          select: { name: true, siteCode: true, siteName: true },
        },
      },
    });

    return NextResponse.json(submissions);
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[UPS Submissions] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
  }
}

// POST - Create a new invoice submission (draft or send immediately)
export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const body = await request.json();
    const { profileId, month, year, amount, notes, sendNow, pdfPath, invoiceId } = body;

    if (!profileId || !month || !year) {
      return NextResponse.json(
        { error: 'profileId, month, and year are required' },
        { status: 400 }
      );
    }

    // Fetch the profile
    const profile = await (prisma as any).submissionProfile.findFirst({
      where: { id: profileId, userId },
    });
    if (!profile) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

    const prefix = profile.prefix || 'INVUK1';
    const yearNum = parseInt(year);

    // Get next sequence number for this prefix
    const lastSubmission = await (prisma as any).invoiceSubmission.findFirst({
      where: { prefix },
      orderBy: { sequenceNumber: 'desc' },
      select: { sequenceNumber: true },
    });
    const nextSeq = (lastSubmission?.sequenceNumber || 0) + 1;
    const seqStr = String(nextSeq).padStart(6, '0');
    const invoiceCode = `${prefix}:${seqStr}`;
    const fileCode = `${prefix}${seqStr}`; // no colon

    // Build email subject and body
    const emailSubject = invoiceCode;
    const emailBody = buildEmailBody({
      poNumber: profile.poNumber,
      month,
      year: yearNum,
      siteCode: profile.siteCode,
      siteName: profile.siteName,
      invoiceCode,
      senderName: profile.senderName,
    });

    // Create the submission record
    const submission = await (prisma as any).invoiceSubmission.create({
      data: {
        userId,
        profileId,
        prefix,
        sequenceNumber: nextSeq,
        invoiceCode,
        fileCode,
        poNumber: profile.poNumber,
        month,
        year: yearNum,
        siteCode: profile.siteCode,
        siteName: profile.siteName,
        recipientEmail: profile.recipientEmail,
        senderEmail: profile.senderEmail,
        pdfPath: pdfPath || null,
        invoiceId: invoiceId || null,
        amount: amount ? parseFloat(amount) : null,
        status: 'draft',
        emailSubject,
        emailBody,
        notes: notes || null,
      },
      include: {
        profile: { select: { name: true } },
      },
    });

    // If sendNow, trigger email sending
    if (sendNow) {
      try {
        await sendSubmissionEmail(submission, profile);
        await (prisma as any).invoiceSubmission.update({
          where: { id: submission.id },
          data: { status: 'sent', sentAt: new Date() },
        });
        submission.status = 'sent';
        submission.sentAt = new Date();
      } catch (sendErr: any) {
        await (prisma as any).invoiceSubmission.update({
          where: { id: submission.id },
          data: { status: 'error', errorMessage: sendErr.message },
        });
        submission.status = 'error';
        submission.errorMessage = sendErr.message;
      }
    }

    return NextResponse.json(submission, { status: 201 });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[UPS Submissions] Error:', error);
    return NextResponse.json({ error: 'Failed to create submission' }, { status: 500 });
  }
}

function buildEmailBody(params: {
  poNumber: string;
  month: string;
  year: number;
  siteCode: string;
  siteName: string;
  invoiceCode: string;
  senderName: string;
}) {
  return `Good afternoon,

PO Number ${params.poNumber} for the month of ${params.month}, concerning the ${params.siteCode} ${params.siteName}.

Attached, you will find the document in PDF format, as per your instructions.

The invoice in question is identified by the number ${params.invoiceCode}.

Please confirm the receipt of this invoice and inform us of any issues or further actions required on our part.

Kind Regards,
${params.senderName}`;
}

async function sendSubmissionEmail(
  submission: any,
  profile: any,
) {
  // Use profile-specific SMTP or fall back to system SMTP
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

  // Add HTML version with signature if available
  if (profile.emailSignature) {
    mailOptions.html = `<div style="font-family: Calibri, Arial, sans-serif; font-size: 14px; color: #333;">
      ${submission.emailBody.replace(/\n/g, '<br>')}
      <br><br>
      ${profile.emailSignature}
    </div>`;
  }

  // Attach PDF if available
  if (submission.pdfPath) {
    try {
      const pdfBuffer = await getFileBuffer(submission.pdfPath);
      mailOptions.attachments = [{
        filename: `${submission.fileCode}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      }];
    } catch (err: any) {
      console.error('[UPS Submit] Could not attach PDF:', err.message);
      throw new Error(`PDF attachment failed: ${err.message}`);
    }
  }

  const info = await transporter.sendMail(mailOptions);
  console.log(`[UPS Submit] Email sent: ${submission.invoiceCode} → ${submission.recipientEmail} (${info.messageId})`);
  return info;
}
