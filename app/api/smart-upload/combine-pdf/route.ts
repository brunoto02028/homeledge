import { NextResponse } from 'next/server';
import { requireUserIdOrMobileToken } from '@/lib/auth';
import { uploadBuffer } from '@/lib/s3';

export const dynamic = 'force-dynamic';

// POST /api/smart-upload/combine-pdf — Combine multiple base64 images into a single PDF
export async function POST(request: Request) {
  try {
    const mobileToken = request.headers.get('X-Mobile-Token');
    const userId = await requireUserIdOrMobileToken(mobileToken);

    const body = await request.json();
    const { images, fileName = 'scanned-document.pdf' } = body;
    // images: Array<{ base64: string, mimeType: string }>

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ error: 'At least one image is required' }, { status: 400 });
    }

    // Dynamically import pdf-lib
    const { PDFDocument } = await import('pdf-lib');
    const pdfDoc = await PDFDocument.create();

    for (const img of images) {
      const imageBuf = Buffer.from(img.base64, 'base64');
      const imageBytes = new Uint8Array(imageBuf);
      let embeddedImage;

      if (img.mimeType === 'image/png') {
        embeddedImage = await pdfDoc.embedPng(imageBytes);
      } else {
        // Default to JPEG for all other image types
        embeddedImage = await pdfDoc.embedJpg(imageBytes);
      }

      // A4 dimensions in points (595.28 x 841.89)
      const a4Width = 595.28;
      const a4Height = 841.89;

      const page = pdfDoc.addPage([a4Width, a4Height]);

      // Scale image to fit A4 while maintaining aspect ratio
      const imgAspect = embeddedImage.width / embeddedImage.height;
      const pageAspect = a4Width / a4Height;

      let drawWidth: number, drawHeight: number;
      if (imgAspect > pageAspect) {
        // Image is wider — fit to width
        drawWidth = a4Width - 40; // 20pt margin each side
        drawHeight = drawWidth / imgAspect;
      } else {
        // Image is taller — fit to height
        drawHeight = a4Height - 40;
        drawWidth = drawHeight * imgAspect;
      }

      const x = (a4Width - drawWidth) / 2;
      const y = (a4Height - drawHeight) / 2;

      page.drawImage(embeddedImage, {
        x,
        y,
        width: drawWidth,
        height: drawHeight,
      });
    }

    const pdfBytes = await pdfDoc.save();
    const pdfBuffer = Buffer.from(pdfBytes);

    // Upload the combined PDF to S3
    const cloudStoragePath = await uploadBuffer(pdfBuffer, fileName, 'application/pdf');

    // Convert to base64 for the smart-upload flow
    const pdfBase64 = pdfBuffer.toString('base64');

    return NextResponse.json({
      success: true,
      cloudStoragePath,
      fileName,
      fileBase64: pdfBase64,
      mimeType: 'application/pdf',
      pageCount: images.length,
      sizeBytes: pdfBuffer.length,
    });
  } catch (error: any) {
    console.error('[Combine PDF] Error:', error);
    return NextResponse.json({ error: 'Failed to combine images: ' + error.message }, { status: 500 });
  }
}
