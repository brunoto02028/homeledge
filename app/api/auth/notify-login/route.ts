import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { sendNotificationEmail, generateLoginAlertHtml } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get IP address from various headers (handles proxies)
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const cfConnectingIp = request.headers.get('cf-connecting-ip');
    
    const ipAddress = cfConnectingIp || 
                       (forwardedFor ? forwardedFor.split(',')[0].trim() : null) || 
                       realIp || 
                       'Unknown IP';

    // Get user agent
    const userAgent = request.headers.get('user-agent') || 'Unknown Device';

    // Get user details
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true, fullName: true, email: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Log the login event with IP and user agent
    await prisma.event.create({
      data: {
        userId: user.id,
        eventType: 'user.login_notification',
        entityType: 'User',
        entityId: user.id,
        payload: {
          email: user.email,
          ipAddress,
          userAgent,
          timestamp: new Date().toISOString(),
        },
      },
    });

    // Send login notification email (don't block on failure)
    try {
      const loginHtml = generateLoginAlertHtml(
        user.fullName,
        user.email,
        ipAddress,
        userAgent,
        new Date()
      );

      await sendNotificationEmail({
        notificationId: process.env.NOTIF_ID_LOGIN_SECURITY_ALERT || '',
        recipientEmail: user.email,
        subject: '🔐 New login detected on your HomeLedger account',
        body: loginHtml,
        isHtml: true,
      });
    } catch (emailError) {
      console.error('Failed to send login notification:', emailError);
      // Don't fail if email fails
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Login notification error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
