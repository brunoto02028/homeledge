'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, Download, Save, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2, FileText, CheckCircle2, EyeOff, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

interface TextBlock {
  id: string; pageIndex: number;
  pdfX: number; pdfY: number; pdfWidth: number; pdfHeight: number;
  canvasX: number; canvasY: number; canvasW: number; canvasH: number;
  originalText: string; editedText: string; fontSize: number; modified: boolean;
}

interface Redaction {
  id: string; pageIndex: number; color: string;
  canvasX: number; canvasY: number; canvasW: number; canvasH: number;
  pdfX: number; pdfY: number; pdfWidth: number; pdfHeight: number;
}

interface SavedEdits { [id: string]: string; }

export default function PdfEditorClient() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfBytes, setPdfBytes] = useState<ArrayBuffer | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.5);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pageImage, setPageImage] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<TextBlock[]>([]);
  const [savedEdits, setSavedEdits] = useState<SavedEdits>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [redactMode, setRedactMode] = useState(false);
  const [redactColor, setRedactColor] = useState('#000000');
  const [redactions, setRedactions] = useState<Redaction[]>([]);

  // Drag state
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const [dragBox, setDragBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  const renderPage = useCallback(async (file: File, pageNum: number, sc: number, edits: SavedEdits = {}) => {
    setLoading(true); setProgress(20);
    try {
      const fd = new FormData();
      fd.append('file', file); fd.append('page', String(pageNum)); fd.append('scale', String(sc));
      setProgress(50);
      const res = await fetch('/api/pdf-render', { method: 'POST', body: fd });
      setProgress(85);
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'Render failed');
      const data = await res.json();
      setProgress(100);
      if (pageNum === 1) setNumPages(data.numPages || 1);
      setPageImage(data.dataUrl);
      setBlocks(prev => {
        const others = prev.filter(b => b.pageIndex !== pageNum - 1);
        const merged = (data.blocks as TextBlock[]).map((nb: TextBlock) => {
          const sv = edits[nb.id];
          if (sv !== undefined) return { ...nb, editedText: sv, modified: sv !== nb.originalText };
          const old = prev.find(ob => ob.id === nb.id);
          if (old?.modified) return { ...nb, editedText: old.editedText, modified: true };
          return nb;
        });
        return [...others, ...merged];
      });
    } catch (err: any) {
      toast({ title: 'Render failed', description: err.message, variant: 'destructive' });
    } finally { setLoading(false); setProgress(0); }
  }, [toast]);

  // Re-render on page/scale change
  const prevPage = useRef(currentPage);
  const prevScale = useRef(scale);
  if ((prevPage.current !== currentPage || prevScale.current !== scale) && pdfFile) {
    prevPage.current = currentPage; prevScale.current = scale;
    renderPage(pdfFile, currentPage, scale, savedEdits);
  }

  async function handleFile(file: File) {
    if (file.type !== 'application/pdf') { toast({ title: 'Select a PDF file', variant: 'destructive' }); return; }
    setBlocks([]); setSavedEdits({}); setSaved(false); setActiveId(null); setRedactions([]);
    setCurrentPage(1); setPageImage(null); setPdfFile(file);
    const ab = await file.arrayBuffer(); setPdfBytes(ab.slice(0));
    renderPage(file, 1, scale, {});
  }

  function updateBlock(id: string, text: string) {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, editedText: text, modified: text !== b.originalText } : b));
    setSaved(false);
  }

  function handleSave() {
    setSaving(true);
    const edits: SavedEdits = {};
    blocks.forEach(b => { if (b.modified) edits[b.id] = b.editedText; });
    setSavedEdits(prev => ({ ...prev, ...edits }));
    setTimeout(() => {
      setSaving(false); setSaved(true);
      const n = Object.keys(edits).length;
      toast({ title: n ? `${n} edit${n !== 1 ? 's' : ''} saved` : 'Nothing to save' });
    }, 200);
  }

  // Convert canvas coords to PDF coords
  function canvasToPdf(cx: number, cy: number, cw: number, ch: number) {
    const img = imgRef.current;
    if (!img) return { pdfX: 0, pdfY: 0, pdfWidth: 0, pdfHeight: 0 };
    const dispW = img.clientWidth;
    const dispH = img.clientHeight;
    const natW = img.naturalWidth;
    const natH = img.naturalHeight;
    // Canvas px → PDF points (at scale 1)
    const pdfPtW = natW / scale;
    const pdfPtH = natH / scale;
    const scaleX = pdfPtW / dispW;
    const scaleY = pdfPtH / dispH;
    const pdfX = cx * scaleX;
    const pdfYTop = cy * scaleY;
    const pdfWidth = cw * scaleX;
    const pdfHeight = ch * scaleY;
    // pdf-lib uses bottom-left origin
    const pdfY = pdfPtH - pdfYTop - pdfHeight;
    return { pdfX, pdfY, pdfWidth, pdfHeight };
  }

  // Drag handlers — only active in redact mode
  function getRelativePos(e: React.MouseEvent, el: HTMLElement) {
    const rect = el.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function onMouseDown(e: React.MouseEvent) {
    if (!redactMode) return;
    const container = e.currentTarget as HTMLElement;
    const pos = getRelativePos(e, container);
    dragStart.current = pos;
    setDragBox({ x: pos.x, y: pos.y, w: 0, h: 0 });
    e.preventDefault();
  }

  function onMouseMove(e: React.MouseEvent) {
    if (!redactMode || !dragStart.current) return;
    const container = e.currentTarget as HTMLElement;
    const pos = getRelativePos(e, container);
    const x = Math.min(pos.x, dragStart.current.x);
    const y = Math.min(pos.y, dragStart.current.y);
    const w = Math.abs(pos.x - dragStart.current.x);
    const h = Math.abs(pos.y - dragStart.current.y);
    setDragBox({ x, y, w, h });
  }

  function onMouseUp(e: React.MouseEvent) {
    if (!redactMode || !dragStart.current || !dragBox) { dragStart.current = null; setDragBox(null); return; }
    const { x, y, w, h } = dragBox;
    dragStart.current = null;
    setDragBox(null);
    if (w < 4 || h < 4) return; // too small — ignore
    const { pdfX, pdfY, pdfWidth, pdfHeight } = canvasToPdf(x, y, w, h);
    setRedactions(prev => [...prev, {
      id: `r-${Date.now()}`, pageIndex: currentPage - 1, color: redactColor,
      canvasX: x, canvasY: y, canvasW: w, canvasH: h,
      pdfX, pdfY, pdfWidth, pdfHeight,
    }]);
    setSaved(false);
  }

  async function exportPdf() {
    if (!pdfBytes) return;
    setExporting(true);
    try {
      const allEdits: SavedEdits = { ...savedEdits };
      blocks.forEach(b => { if (b.modified) allEdits[b.id] = b.editedText; });
      const { PDFDocument, rgb, StandardFonts, grayscale } = await import('pdf-lib');
      const doc = await PDFDocument.load(pdfBytes);
      const pages = doc.getPages();
      const font = await doc.embedFont(StandardFonts.Helvetica);
      let count = 0;
      // Text edits
      for (const block of blocks.filter(b => allEdits[b.id] !== undefined)) {
        const page = pages[block.pageIndex]; if (!page) continue;
        page.drawRectangle({ x: block.pdfX - 1, y: block.pdfY - 1, width: block.pdfWidth + 2, height: block.pdfHeight + 2, color: grayscale(1), opacity: 1 });
        const txt = allEdits[block.id] || '';
        if (txt.trim()) page.drawText(txt, { x: block.pdfX, y: block.pdfY, size: Math.max(block.fontSize * 0.9, 6), font, color: rgb(0, 0, 0) });
        count++;
      }
      // Redactions
      for (const r of redactions) {
        const page = pages[r.pageIndex]; if (!page) continue;
        const hex = r.color.replace('#', '');
        const rc = rgb(parseInt(hex.slice(0,2),16)/255, parseInt(hex.slice(2,4),16)/255, parseInt(hex.slice(4,6),16)/255);
        page.drawRectangle({ x: r.pdfX, y: r.pdfY, width: r.pdfWidth, height: r.pdfHeight, color: rc, opacity: 1 });
        count++;
      }
      const bytes = await doc.save();
      const blob = new Blob([bytes as any], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      Object.assign(document.createElement('a'), { href: url, download: `edited-${pdfFile?.name || 'doc.pdf'}` }).click();
      URL.revokeObjectURL(url);
      toast({ title: `Exported with ${count} change${count !== 1 ? 's' : ''}` });
    } catch (err: any) {
      toast({ title: 'Export failed', description: err.message, variant: 'destructive' });
    } finally { setExporting(false); }
  }

  const pageBlocks = blocks.filter(b => b.pageIndex === currentPage - 1);
  const pageRedactions = redactions.filter(r => r.pageIndex === currentPage - 1);
  const modifiedCount = blocks.filter(b => b.modified).length + redactions.length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b px-4 py-2 flex items-center justify-between bg-card sticky top-0 z-20 shrink-0 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
            <FileText className="h-3.5 w-3.5 text-white" />
          </div>
          <p className="text-xs text-muted-foreground truncate max-w-[160px]">{pdfFile?.name ?? 'No file open'}</p>
          {modifiedCount > 0 && <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-700 border border-amber-200 font-medium">{modifiedCount} unsaved</span>}
          {saved && modifiedCount === 0 && <span className="flex items-center gap-1 text-xs text-green-600 font-medium"><CheckCircle2 className="h-3 w-3" />Saved</span>}
          {redactMode && <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-700 border border-red-200 font-medium animate-pulse">✏ Drag to redact</span>}
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => fileInputRef.current?.click()}>
            <Upload className="h-3.5 w-3.5 mr-1" />Open
          </Button>
          <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          {pdfFile && <>
            {/* Redact controls */}
            <Button variant={redactMode ? 'default' : 'outline'} size="sm" className={`h-7 text-xs ${redactMode ? 'bg-red-600 hover:bg-red-700 text-white' : ''}`}
              onClick={() => setRedactMode(m => !m)}>
              <EyeOff className="h-3.5 w-3.5 mr-1" />{redactMode ? 'Stop' : 'Redact'}
            </Button>
            {redactMode && (
              <label className="flex items-center gap-1 text-xs text-muted-foreground cursor-pointer">
                <input type="color" value={redactColor} onChange={e => setRedactColor(e.target.value)} className="w-6 h-6 rounded cursor-pointer border-0 p-0" />
              </label>
            )}
            {redactions.length > 0 && (
              <Button variant="ghost" size="sm" className="h-7 text-xs text-red-500 hover:text-red-700"
                onClick={() => { setRedactions(prev => prev.filter(r => r.pageIndex !== currentPage - 1)); setSaved(false); }}>
                <Trash2 className="h-3.5 w-3.5 mr-1" />Clear page
              </Button>
            )}
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleSave} disabled={saving || modifiedCount === 0}>
              {saving ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Save className="h-3.5 w-3.5 mr-1" />}Save
            </Button>
            <Button size="sm" className="h-7 text-xs bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:opacity-90" onClick={exportPdf} disabled={exporting}>
              {exporting ? <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" /> : <Download className="h-3.5 w-3.5 mr-1" />}Export PDF
            </Button>
          </>}
        </div>
      </div>

      {!pdfFile ? (
        <div className="flex-1 flex items-center justify-center p-12"
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}>
          <div className="border-2 border-dashed border-border rounded-2xl p-16 text-center cursor-pointer hover:border-primary hover:bg-muted/20 transition-all max-w-md w-full"
            onClick={() => fileInputRef.current?.click()}>
            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Open a PDF to edit</h2>
            <p className="text-sm text-muted-foreground mb-1">Click any word to edit text</p>
            <p className="text-sm text-muted-foreground mb-6">Use <strong>Redact</strong> to drag and paint over any area</p>
            <Button variant="outline"><Upload className="h-4 w-4 mr-2" />Choose PDF</Button>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Page/zoom bar */}
          <div className="border-b px-4 py-1.5 flex items-center justify-between bg-muted/20 shrink-0">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage <= 1 || loading}><ChevronLeft className="h-3.5 w-3.5" /></Button>
              <span className="text-xs px-1">Page <strong>{currentPage}</strong> / {numPages || '?'}</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))} disabled={currentPage >= numPages || loading}><ChevronRight className="h-3.5 w-3.5" /></Button>
            </div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-6 w-6" disabled={loading} onClick={() => setScale(s => Math.max(0.75, +(s - 0.25).toFixed(2)))}><ZoomOut className="h-3.5 w-3.5" /></Button>
              <span className="text-xs w-10 text-center">{Math.round(scale * 100)}%</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" disabled={loading} onClick={() => setScale(s => Math.min(3, +(s + 0.25).toFixed(2)))}><ZoomIn className="h-3.5 w-3.5" /></Button>
            </div>
            <span className="text-xs text-muted-foreground hidden md:block">{redactMode ? '🖱 Drag to paint redaction · click existing to remove' : 'Click word to edit · Esc cancels'}</span>
          </div>

          {loading && <div className="w-full h-0.5 bg-muted shrink-0"><div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${progress}%` }} /></div>}

          {/* PDF area */}
          <div className="flex-1 overflow-auto bg-slate-300 dark:bg-slate-900 p-8 flex justify-center items-start">
            {loading && !pageImage ? (
              <div className="flex flex-col items-center gap-3 mt-24">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
                <p className="text-sm text-muted-foreground">Rendering… {progress}%</p>
              </div>
            ) : pageImage ? (
              <div className="shadow-2xl bg-white select-none"
                style={{ position: 'relative', display: 'inline-block', lineHeight: 0, opacity: loading ? 0.7 : 1, cursor: redactMode ? 'crosshair' : 'default' }}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={() => { if (dragStart.current) { dragStart.current = null; setDragBox(null); } }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img ref={imgRef} src={pageImage} alt={`Page ${currentPage}`} style={{ display: 'block', maxWidth: '100%', userSelect: 'none', pointerEvents: 'none' }} draggable={false} />

                {/* Saved redactions */}
                {pageRedactions.map(r => (
                  <div key={r.id}
                    onClick={e => { e.stopPropagation(); setRedactions(prev => prev.filter(x => x.id !== r.id)); setSaved(false); }}
                    title="Click to remove"
                    style={{
                      position: 'absolute', left: r.canvasX, top: r.canvasY, width: r.canvasW, height: r.canvasH,
                      background: r.color, zIndex: 20, cursor: 'pointer',
                      boxShadow: '0 0 0 1px rgba(255,255,255,0.3)',
                    }}
                  />
                ))}

                {/* Live drag preview */}
                {dragBox && dragBox.w > 2 && dragBox.h > 2 && (
                  <div style={{
                    position: 'absolute', left: dragBox.x, top: dragBox.y, width: dragBox.w, height: dragBox.h,
                    background: redactColor, opacity: 0.75, zIndex: 30,
                    border: '2px solid rgba(255,255,255,0.6)',
                    pointerEvents: 'none',
                  }} />
                )}

                {/* Word hit areas (only in edit mode) */}
                {!redactMode && pageBlocks.map(block => (
                  <WordOverlay key={block.id} block={block}
                    isActive={activeId === block.id}
                    onActivate={() => setActiveId(block.id)}
                    onDeactivate={() => setActiveId(null)}
                    onChange={text => updateBlock(block.id, text)}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

function WordOverlay({ block, isActive, onActivate, onDeactivate, onChange }: {
  block: TextBlock; isActive: boolean;
  onActivate: () => void; onDeactivate: () => void; onChange: (t: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  if (isActive && inputRef.current) { inputRef.current.focus(); inputRef.current.select(); }

  const base = { position: 'absolute' as const, left: block.canvasX, top: block.canvasY, height: Math.max(block.canvasH, 8), zIndex: isActive ? 30 : 10 };

  if (isActive) return (
    <input ref={el => { (inputRef as any).current = el; if (el) { el.focus(); el.select(); } }}
      defaultValue={block.editedText}
      onBlur={e => { onChange(e.target.value); onDeactivate(); }}
      onKeyDown={e => {
        if (e.key === 'Enter') { onChange((e.target as HTMLInputElement).value); (e.target as HTMLInputElement).blur(); }
        if (e.key === 'Escape') { (e.target as HTMLInputElement).value = block.originalText; onChange(block.originalText); (e.target as HTMLInputElement).blur(); }
      }}
      onClick={e => e.stopPropagation()}
      style={{ ...base, width: Math.max(block.canvasW + 60, 80), fontSize: Math.max(block.canvasH * 0.8, 7), fontFamily: 'Arial,sans-serif', padding: '0 4px', background: '#eff6ff', border: '2px solid #3b82f6', borderRadius: 3, outline: 'none', color: '#1e3a5f', lineHeight: 1 }}
    />
  );

  return (
    <div onClick={e => { e.stopPropagation(); onActivate(); }}
      title={block.modified ? `"${block.editedText}"` : block.originalText}
      style={{ ...base, width: Math.max(block.canvasW, 6), cursor: 'text', background: 'transparent', ...(block.modified ? { outline: '1px dashed rgba(245,158,11,0.6)', outlineOffset: 1, borderRadius: 1 } : {}) }}
      className="hover:outline hover:outline-1 hover:outline-blue-300/50 hover:rounded-sm"
    />
  );
}
