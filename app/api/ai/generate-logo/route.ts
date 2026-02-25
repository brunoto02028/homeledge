import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const { prompt, entityId, style = 'modern' } = await request.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Use Gemini Imagen API for logo generation
    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      return NextResponse.json({ error: 'AI image generation not configured' }, { status: 500 });
    }

    const fullPrompt = `Professional company logo design: ${prompt}. Style: ${style}. Clean, minimal, scalable vector-style logo on a white background. No text unless specifically requested. Professional business branding quality.`;

    // Use Gemini's image generation endpoint
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `Generate a professional logo image based on this description: ${fullPrompt}` }],
          }],
          generationConfig: {
            responseModalities: ['TEXT', 'IMAGE'],
          },
        }),
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error('[Logo Gen] Gemini error:', response.status, errText);
      return NextResponse.json({ error: 'Failed to generate logo' }, { status: 500 });
    }

    const result = await response.json();
    const parts = result.candidates?.[0]?.content?.parts || [];

    // Find the image part
    const imagePart = parts.find((p: any) => p.inlineData?.mimeType?.startsWith('image/'));

    if (!imagePart) {
      // Fallback: return a text description for the user to use with an external tool
      const textPart = parts.find((p: any) => p.text);
      return NextResponse.json({
        success: false,
        message: 'Image generation not available with current model. Try uploading a logo instead.',
        suggestion: textPart?.text || 'Use a tool like Canva or LogoMaker to create your logo.',
      });
    }

    // Convert base64 image to data URL
    const dataUrl = `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;

    // If entityId provided, try to upload to S3 and save to entity
    let savedUrl = dataUrl;
    if (entityId) {
      try {
        // Upload to S3 via presigned URL
        const buffer = new Uint8Array(Buffer.from(imagePart.inlineData.data, 'base64'));
        const fileName = `logo-${entityId}-${Date.now()}.png`;

        const presignedRes = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/upload/presigned`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Cookie: request.headers.get('cookie') || '' },
          body: JSON.stringify({ fileName, contentType: imagePart.inlineData.mimeType, isPublic: true }),
        });

        if (presignedRes.ok) {
          const { uploadUrl, cloudStoragePath } = await presignedRes.json();
          await fetch(uploadUrl, {
            method: 'PUT',
            headers: { 'Content-Type': imagePart.inlineData.mimeType },
            body: buffer,
          });

          // Get public URL
          const getUrlRes = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/upload/get-url`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Cookie: request.headers.get('cookie') || '' },
            body: JSON.stringify({ cloudStoragePath, isPublic: true }),
          });

          if (getUrlRes.ok) {
            const { url } = await getUrlRes.json();
            savedUrl = url;
          }
        }

        // Update entity with logo URL
        await (prisma as any).entity.update({
          where: { id: entityId },
          data: { logoUrl: savedUrl },
        });
      } catch (uploadError) {
        console.error('[Logo Gen] Upload error:', uploadError);
        // Still return the data URL even if upload fails
      }
    }

    // Log event
    await prisma.event.create({
      data: {
        userId,
        eventType: 'ai.logo_generated',
        entityType: 'Entity',
        entityId: entityId || 'none',
        payload: { prompt, style },
      },
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      logoUrl: savedUrl,
      isDataUrl: savedUrl.startsWith('data:'),
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[Logo Gen] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
