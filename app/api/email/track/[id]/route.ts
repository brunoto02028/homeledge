import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// 1x1 transparent PNG pixel
const PIXEL = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
  'base64'
);

export const dynamic = 'force-dynamic';

// GET /api/email/track/[id] — serves a tracking pixel and records the open
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const trackingId = params.id.replace(/\.png$/, ''); // strip .png extension if present

  // Record the open event in background (don't block the response)
  try {
    // Find the email message by tracking ID and mark as read
    await (prisma as any).emailMessage.updateMany({
      where: { trackingId },
      data: { 
        openedAt: new Date(),
        openCount: { increment: 1 },
      },
    });

    // Create a notification for the sender
    const msg = await (prisma as any).emailMessage.findFirst({
      where: { trackingId },
      select: { id: true, subject: true, toAddress: true, account: { select: { userId: true } } },
    });

    if (msg?.account?.userId) {
      await (prisma as any).event.create({
        data: {
          userId: msg.account.userId,
          eventType: 'email_opened',
          title: `Email opened: ${msg.subject || '(no subject)'}`,
          payload: {
            messageId: msg.id,
            to: msg.toAddress,
            subject: msg.subject,
            openedAt: new Date().toISOString(),
          },
        },
      }).catch(() => {}); // non-critical
    }
  } catch (e) {
    // Silently fail — tracking should never break the pixel
    console.error('[Email Track]', e);
  }

  // Return the transparent 1x1 pixel
  return new NextResponse(new Uint8Array(PIXEL), {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Content-Length': String(PIXEL.length),
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}
