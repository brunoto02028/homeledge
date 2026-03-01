import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// GeoIP cache to avoid repeated lookups (in-memory, resets on restart)
const geoCache = new Map<string, { country: string; city: string; expires: number }>();

async function lookupGeo(ip: string): Promise<{ country: string; city: string } | null> {
  if (!ip || ip === 'unknown' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) return null;
  const cached = geoCache.get(ip);
  if (cached && cached.expires > Date.now()) return { country: cached.country, city: cached.city };
  try {
    const res = await fetch(`http://ip-api.com/json/${ip}?fields=country,city,status`, { signal: AbortSignal.timeout(2000) });
    const data = await res.json();
    if (data.status === 'success' && data.country) {
      const geo = { country: data.country, city: data.city || '' };
      geoCache.set(ip, { ...geo, expires: Date.now() + 24 * 60 * 60 * 1000 }); // cache 24h
      return geo;
    }
  } catch { /* non-critical */ }
  return null;
}

// Parse User-Agent into device/browser/os
function parseUA(ua: string) {
  const device = /mobile|android|iphone|ipad/i.test(ua) ? (/ipad|tablet/i.test(ua) ? 'tablet' : 'mobile') : 'desktop';
  let browser = 'Unknown';
  if (/edg\//i.test(ua)) browser = 'Edge';
  else if (/chrome/i.test(ua)) browser = 'Chrome';
  else if (/firefox/i.test(ua)) browser = 'Firefox';
  else if (/safari/i.test(ua)) browser = 'Safari';
  else if (/opera|opr/i.test(ua)) browser = 'Opera';
  let os = 'Unknown';
  if (/windows/i.test(ua)) os = 'Windows';
  else if (/mac os/i.test(ua)) os = 'macOS';
  else if (/linux/i.test(ua)) os = 'Linux';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/iphone|ipad/i.test(ua)) os = 'iOS';
  return { device, browser, os };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, fingerprint, sessionId, path, title, referrer, scrollDepth, timeOnPage, target, x, y, metadata, pageViewId } = body;

    if (!fingerprint || !sessionId || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get IP from headers
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : req.headers.get('x-real-ip') || 'unknown';
    const userAgent = req.headers.get('user-agent') || '';
    const { device, browser, os } = parseUA(userAgent);

    // Upsert visitor
    const visitor = await (prisma as any).siteVisitor.upsert({
      where: { fingerprint },
      update: { lastSeen: new Date(), totalVisits: { increment: type === 'pageview' ? 1 : 0 }, ip, userAgent: userAgent.substring(0, 500) },
      create: { fingerprint, ip, userAgent: userAgent.substring(0, 500), device, browser, os, referrer: referrer || null },
    });

    // GeoIP lookup (background, non-blocking) — only if country not set yet
    if (!visitor.country && ip && ip !== 'unknown') {
      lookupGeo(ip).then(geo => {
        if (geo) {
          (prisma as any).siteVisitor.update({
            where: { id: visitor.id },
            data: { country: geo.country, city: geo.city },
          }).catch(() => {});
        }
      });
    }

    // Handle different event types
    if (type === 'pageview') {
      const pv = await (prisma as any).sitePageView.create({
        data: {
          visitorId: visitor.id,
          sessionId,
          path: path || '/',
          title: title || null,
          referrer: referrer || null,
        },
      });
      return NextResponse.json({ ok: true, pageViewId: pv.id });
    }

    if (type === 'page_exit') {
      // Update the page view with exit time and scroll depth
      if (pageViewId) {
        await (prisma as any).sitePageView.update({
          where: { id: pageViewId },
          data: {
            exitedAt: new Date(),
            timeOnPage: timeOnPage || null,
            scrollDepth: scrollDepth || null,
          },
        }).catch(() => {}); // ignore if already deleted
      }
      return NextResponse.json({ ok: true });
    }

    // Click, scroll milestone, CTA, form, rage_click, etc.
    if (['click', 'cta_click', 'nav_click', 'form_submit', 'scroll', 'rage_click'].includes(type)) {
      await (prisma as any).siteEvent.create({
        data: {
          visitorId: visitor.id,
          pageViewId: pageViewId || null,
          sessionId,
          type,
          target: target ? String(target).substring(0, 500) : null,
          x: typeof x === 'number' ? Math.round(x) : null,
          y: typeof y === 'number' ? Math.round(y) : null,
          path: path || '/',
          metadata: metadata || null,
        },
      });
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error('[Analytics Collect]', error?.message);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
