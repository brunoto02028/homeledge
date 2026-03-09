import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;
export const runtime = 'nodejs';

// Aspect ratio mapping: type → Imagen aspect ratio
const ASPECT_MAP: Record<string, string> = {
  feed_1x1:   '1:1',
  story_9x16: '9:16',
  banner:     '16:9',
  carousel:   '1:1',
  blog_cover: '16:9',
};

const BRAND_SUFFIX = 'Modern, professional, clean editorial illustration or photo. Amber/gold and dark slate colour palette. The image must contain ZERO text, ZERO letters, ZERO words, ZERO numbers, ZERO labels, ZERO captions — purely visual. Suitable for a UK financial services brand. High quality photorealistic or vector style.';

/**
 * Generate image using Google Imagen 4.0 (fast model).
 * Returns a public URL by saving the base64 image to /public/uploads/blog/.
 */
async function generateWithImagen(prompt: string, aspectRatio: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY not configured');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90_000);

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-001:predict?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: {
            sampleCount: 1,
            aspectRatio,
            outputMimeType: 'image/jpeg',
          },
        }),
        signal: controller.signal,
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error('[Imagen] API error:', res.status, err.substring(0, 400));
      throw new Error(`Imagen API error: ${res.status}`);
    }

    const data = await res.json();
    const prediction = data?.predictions?.[0];
    const b64 = prediction?.bytesBase64Encoded;
    const mime = prediction?.mimeType || 'image/jpeg';
    if (!b64) throw new Error('Imagen returned no image data');

    // Save to /opt/homeledger/uploads/blog/ — persists across builds, served by nginx /uploads/
    const ext = mime.includes('png') ? 'png' : 'jpeg';
    const fileName = `ai-${randomUUID()}.${ext}`;
    const uploadsDir = process.env.LOCAL_UPLOADS_DIR
      ? join(process.env.LOCAL_UPLOADS_DIR, 'blog')
      : join(process.cwd(), '..', 'uploads', 'blog');
    await mkdir(uploadsDir, { recursive: true });
    await writeFile(join(uploadsDir, fileName), new Uint8Array(Buffer.from(b64, 'base64')));

    const publicUrl = `/uploads/blog/${fileName}`;
    console.log('[Imagen] Generated and saved:', uploadsDir, fileName);
    return publicUrl;
  } finally {
    clearTimeout(timeout);
  }
}

/** Fallback: OpenAI DALL-E 3 if OPENAI_API_KEY is set */
async function generateWithOpenAI(prompt: string, size: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90_000);

  try {
    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: 'dall-e-3', prompt, n: 1, size, quality: 'hd', style: 'natural', response_format: 'url' }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`OpenAI API error: ${res.status}`);
    const data = await res.json();
    const url = data?.data?.[0]?.url;
    if (!url) throw new Error('No URL in OpenAI response');
    return url;
  } finally {
    clearTimeout(timeout);
  }
}

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const user = await (prisma as any).user.findUnique({ where: { id: userId }, select: { role: true } });
    if (user?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { prompt, type = 'blog_cover', style = 'natural', size: sizeParam } = await req.json();
    if (!prompt) return NextResponse.json({ error: 'prompt is required' }, { status: 400 });

    const aspectRatio = ASPECT_MAP[type] || '16:9';
    // OpenAI fallback size mapping
    const openAiSize = (type === 'story_9x16') ? '1024x1792' : (type === 'feed_1x1' || type === 'carousel') ? '1024x1024' : '1792x1024';

    const enhancedPrompt = `${prompt}. ${BRAND_SUFFIX}`;

    let url: string;

    // Primary: Google Imagen 4.0 (uses GEMINI_API_KEY already on VPS)
    try {
      console.log('[Image Gen] Trying Imagen 4.0...');
      url = await generateWithImagen(enhancedPrompt, aspectRatio);
      console.log('[Image Gen] Imagen success:', url);
    } catch (imagenErr: any) {
      console.warn('[Image Gen] Imagen failed:', imagenErr.message, '— trying OpenAI fallback');
      try {
        url = await generateWithOpenAI(enhancedPrompt, openAiSize);
        console.log('[Image Gen] OpenAI success');
      } catch (openaiErr: any) {
        console.error('[Image Gen] All providers failed');
        throw new Error('Image generation failed. Please try again or upload an image manually.');
      }
    }

    return NextResponse.json({ url, imageUrl: url });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    console.error('[Image Gen]', error);
    return NextResponse.json({ error: error.message || 'Image generation failed' }, { status: 500 });
  }
}
