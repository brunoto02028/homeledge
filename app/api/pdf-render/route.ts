import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { writeFile, readFile, unlink, mkdir } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { randomBytes } from 'crypto';

export const runtime = 'nodejs';
export const maxDuration = 30;

const execFileAsync = promisify(execFile);

interface TextBlock {
  id: string;
  pageIndex: number;
  pdfX: number;
  pdfY: number;
  pdfWidth: number;
  pdfHeight: number;
  canvasX: number;
  canvasY: number;
  canvasW: number;
  canvasH: number;
  originalText: string;
  editedText: string;
  fontSize: number;
  modified: boolean;
}

export async function POST(req: NextRequest) {
  const id = randomBytes(8).toString('hex');
  const workDir = join(tmpdir(), `pdf-${id}`);
  const pdfPath = join(workDir, 'input.pdf');

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const page = parseInt((formData.get('page') as string) || '1', 10);
    const scale = parseFloat((formData.get('scale') as string) || '1.5');

    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 });

    // Write PDF to temp dir
    await mkdir(workDir, { recursive: true });
    const bytes = await file.arrayBuffer();
    await writeFile(pdfPath, Buffer.from(bytes));

    // ── 1. Get page count with pdfinfo ──────────────────────────────────────
    let numPages = 1;
    try {
      const { stdout } = await execFileAsync('pdfinfo', [pdfPath]);
      const match = stdout.match(/Pages:\s+(\d+)/);
      if (match) numPages = parseInt(match[1], 10);
    } catch { /* pdfinfo may not exist, continue */ }

    // ── 2. Render page to PNG via pdftoppm ──────────────────────────────────
    // -r = DPI (72 * scale), -f = first page, -l = last page, -png
    const dpi = Math.round(72 * scale);
    const outPrefix = join(workDir, 'page');
    await execFileAsync('pdftoppm', [
      '-r', String(dpi),
      '-f', String(page),
      '-l', String(page),
      '-png',
      pdfPath,
      outPrefix,
    ]);

    // pdftoppm outputs: page-000001.png (zero-padded to 6 digits or fewer)
    const padded = String(page).padStart(6, '0');
    // try both padding lengths
    let pngPath = join(workDir, `page-${padded}.png`);
    try { await readFile(pngPath); } catch {
      // try without padding
      const files = await import('fs').then(m =>
        m.readdirSync(workDir).filter((f: string) => f.startsWith('page-') && f.endsWith('.png'))
      );
      if (files.length > 0) pngPath = join(workDir, files[0]);
    }

    const pngBuffer = await readFile(pngPath);
    const dataUrl = `data:image/png;base64,${pngBuffer.toString('base64')}`;

    // ── 3. Extract text positions via pdftotext -bbox ────────────────────────
    const blocks: TextBlock[] = [];
    try {
      const bboxXmlPath = join(workDir, 'bbox.xml');
      await execFileAsync('pdftotext', [
        '-bbox-layout',
        '-f', String(page),
        '-l', String(page),
        pdfPath,
        bboxXmlPath,
      ]);
      const xml = await readFile(bboxXmlPath, 'utf-8');

      // Parse word bboxes from XML: <word xMin="..." yMin="..." xMax="..." yMax="...">text</word>
      // Also get page dimensions from <page width="..." height="...">
      const pageMatch = xml.match(/<page[^>]+width="([\d.]+)"[^>]+height="([\d.]+)"/);
      const pageW = pageMatch ? parseFloat(pageMatch[1]) : 612;
      const pageH = pageMatch ? parseFloat(pageMatch[2]) : 792;

      const wordRegex = /<word[^>]+xMin="([\d.]+)"[^>]+yMin="([\d.]+)"[^>]+xMax="([\d.]+)"[^>]+yMax="([\d.]+)"[^>]*>([^<]+)<\/word>/g;
      let match: RegExpExecArray | null;
      let i = 0;
      while ((match = wordRegex.exec(xml)) !== null) {
        const xMin = parseFloat(match[1]);
        const yMin = parseFloat(match[2]);
        const xMax = parseFloat(match[3]);
        const yMax = parseFloat(match[4]);
        const text = match[5].trim();
        if (!text) continue;

        // pdftotext bbox coords are in PDF points (origin top-left in bbox-layout)
        const pdfX = xMin;
        const pdfY = pageH - yMax; // convert to bottom-left origin for pdf-lib
        const pdfW = xMax - xMin;
        const pdfH = yMax - yMin;
        const fontSize = pdfH;

        // Canvas coords: scale by DPI ratio (dpi/72 = scale)
        const canvasX = xMin * scale;
        const canvasY = yMin * scale;
        const canvasW = Math.max(pdfW * scale, 20);
        const canvasH = Math.max(pdfH * scale, 12);

        blocks.push({
          id: `b-${page}-${i++}`,
          pageIndex: page - 1,
          pdfX, pdfY, pdfWidth: pdfW, pdfHeight: pdfH,
          canvasX, canvasY, canvasW, canvasH,
          originalText: text,
          editedText: text,
          fontSize,
          modified: false,
        });
      }
    } catch (textErr: any) {
      console.error('[pdf-render] text extraction failed:', textErr.message);
      // Return image without text blocks — user can still see PDF
    }

    return NextResponse.json({ dataUrl, numPages, blocks });

  } catch (err: any) {
    console.error('[pdf-render]', err.message || err);
    return NextResponse.json({ error: err.message || 'Render failed' }, { status: 500 });
  } finally {
    // Cleanup temp files
    try {
      const { rm } = await import('fs/promises');
      await rm(workDir, { recursive: true, force: true });
    } catch { /* ignore */ }
  }
}
