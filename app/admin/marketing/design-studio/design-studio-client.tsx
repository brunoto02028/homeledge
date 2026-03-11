'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Palette, CreditCard, FileImage, Download, Sparkles, Loader2,
  ChevronRight, RefreshCw, Copy, Check, Type, Image as ImageIcon,
  Phone, Mail, Globe, MapPin, Megaphone, Plus, Minus, Upload, Languages,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';

// ── Language type ──────────────────────────────────────────────────────────────
type Lang = 'pt' | 'en';

// ── Types ─────────────────────────────────────────────────────────────────────
type Mode = 'flyer' | 'card';
type FlyerSize = 'a4' | 'a5' | 'square';
type TemplateName = 'dark-gold' | 'corporate' | 'colorful' | 'minimal';

interface FlyerData {
  headlinePt: string; headlineEn: string;
  subheadlinePt: string; subheadlineEn: string;
  bodyPt: string; bodyEn: string;
  servicesPt: string[]; servicesEn: string[];
  phone: string;
  email: string;
  website: string;
  address: string;
  logoText: string;
  ctaPt: string; ctaEn: string;
}

interface CardData {
  name: string;
  titlePt: string; titleEn: string;
  company: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  servicesPt: string[]; servicesEn: string[];
  taglinePt: string; taglineEn: string;
  logoText: string;
}

// ── Templates ─────────────────────────────────────────────────────────────────
const TEMPLATES: Record<TemplateName, { label: string; bg: string; accent: string; text: string; sub: string; desc: string }> = {
  'dark-gold':  { label: 'Dark Gold',   bg: '#0f172a', accent: '#f59e0b', text: '#ffffff', sub: '#94a3b8', desc: 'Elegante e profissional' },
  'corporate':  { label: 'Corporativo', bg: '#ffffff', accent: '#1e40af', text: '#1e293b', sub: '#64748b', desc: 'Sóbrio e confiável' },
  'colorful':   { label: 'Colorido',    bg: '#7c3aed', accent: '#f97316', text: '#ffffff', sub: '#ddd6fe', desc: 'Vibrante e moderno' },
  'minimal':    { label: 'Minimalista', bg: '#f8fafc', accent: '#0f172a', text: '#0f172a', sub: '#64748b', desc: 'Clean e tipográfico' },
};

const FLYER_SIZES: Record<FlyerSize, { label: string; w: number; h: number; desc: string }> = {
  a4:     { label: 'A4',          w: 595, h: 842, desc: 'Para gráfica / impressão' },
  a5:     { label: 'A5',          w: 420, h: 595, desc: 'Panfleto compacto' },
  square: { label: 'Quadrado',    w: 500, h: 500, desc: 'Instagram / redes sociais' },
};

const SERVICES_SUGGESTIONS = [
  'Contabilidade & Impostos', 'Self Assessment HMRC', 'Abertura de Empresa',
  'Open Banking', 'Gestão Financeira', 'Consultoria Fiscal',
  'Payroll & Folha de Pagamento', 'Verificação de Identidade (KYC)',
  'Relatórios Empresariais', 'Cidadania Italiana', 'Imigração UK',
];

// ── Defaults ──────────────────────────────────────────────────────────────────
const DEFAULT_FLYER: FlyerData = {
  headlinePt: 'Clarity & Co', headlineEn: 'Clarity & Co',
  subheadlinePt: 'Simplificamos as suas finanças no UK', subheadlineEn: 'Simplifying Your UK Finances',
  bodyPt: 'Somos especialistas em contabilidade, impostos e gestão financeira para particulares e empresas no Reino Unido.',
  bodyEn: 'We specialise in accounting, tax and financial management for individuals and businesses in the United Kingdom.',
  servicesPt: ['Contabilidade & Impostos', 'Self Assessment HMRC', 'Abertura de Empresa', 'Open Banking'],
  servicesEn: ['Accounting & Tax', 'HMRC Self Assessment', 'Company Formation', 'Open Banking'],
  phone: '+44 7000 000000',
  email: 'admin@clarityco.co.uk',
  website: 'clarityco.co.uk',
  address: 'London, United Kingdom',
  logoText: 'C&Co',
  ctaPt: 'Fale connosco hoje!', ctaEn: 'Get in touch today!',
};

const DEFAULT_CARD: CardData = {
  name: 'Bruno Tonheta',
  titlePt: 'Director e Consultor Financeiro', titleEn: 'Director & Financial Consultant',
  company: 'Clarity & Co',
  phone: '+44 7000 000000',
  email: 'admin@clarityco.co.uk',
  website: 'clarityco.co.uk',
  address: 'London, United Kingdom',
  servicesPt: ['Contabilidade', 'Impostos UK', 'Abertura de Empresa'],
  servicesEn: ['Accounting', 'UK Taxes', 'Company Formation'],
  taglinePt: 'Simplifique as suas finanças no UK', taglineEn: 'Simplify Your UK Finances',
  logoText: 'C&Co',
};

// ── Flyer Preview Component ────────────────────────────────────────────────────
function FlyerPreview({ data, template, size, lang, logoUrl }: { data: FlyerData; template: TemplateName; size: FlyerSize; lang: Lang; logoUrl: string | null }) {
  const t = TEMPLATES[template];
  const s = FLYER_SIZES[size];
  const scale = 360 / s.w;
  const isLight = t.bg === '#ffffff' || t.bg === '#f8fafc';

  const headline    = lang === 'pt' ? data.headlinePt    : data.headlineEn;
  const subheadline = lang === 'pt' ? data.subheadlinePt : data.subheadlineEn;
  const body        = lang === 'pt' ? data.bodyPt        : data.bodyEn;
  const services    = lang === 'pt' ? data.servicesPt    : data.servicesEn;
  const cta         = lang === 'pt' ? data.ctaPt         : data.ctaEn;
  const svcLabel    = lang === 'pt' ? 'Serviços' : 'Services';

  return (
    <div style={{ width: s.w * scale, height: s.h * scale, overflow: 'hidden', borderRadius: 8, boxShadow: '0 4px 32px rgba(0,0,0,0.3)' }}>
      <div style={{
        width: s.w, height: s.h, background: t.bg,
        transform: `scale(${scale})`, transformOrigin: 'top left',
        fontFamily: "'Inter', sans-serif", position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 8, background: t.accent }} />
        <div style={{ position: 'absolute', top: -80, right: -80, width: 280, height: 280, borderRadius: '50%', background: t.accent, opacity: 0.08 }} />
        <div style={{ position: 'absolute', bottom: -60, left: -60, width: 200, height: 200, borderRadius: '50%', background: t.accent, opacity: 0.06 }} />

        <div style={{ padding: '48px 48px 0', position: 'relative', zIndex: 1 }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" style={{ width: 56, height: 56, objectFit: 'contain', borderRadius: 8 }} />
            ) : (
              <div style={{ width: 56, height: 56, borderRadius: 12, background: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: isLight ? '#fff' : t.bg, fontWeight: 900, fontSize: 18 }}>{data.logoText}</span>
              </div>
            )}
            <span style={{ color: t.accent, fontWeight: 700, fontSize: 14, letterSpacing: 3, textTransform: 'uppercase' }}>Clarity & Co</span>
          </div>

          <h1 style={{ color: t.text, fontSize: size === 'square' ? 36 : 48, fontWeight: 900, lineHeight: 1.1, margin: '0 0 16px', maxWidth: '80%' }}>{headline}</h1>
          <p style={{ color: t.accent, fontSize: 20, fontWeight: 600, margin: '0 0 24px' }}>{subheadline}</p>
          <p style={{ color: t.sub, fontSize: 15, lineHeight: 1.6, maxWidth: '70%', margin: '0 0 40px' }}>{body}</p>

          <div style={{ marginBottom: 40 }}>
            <div style={{ color: t.accent, fontSize: 11, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>{svcLabel}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {services.slice(0, 6).map((sv, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: t.accent, flexShrink: 0 }} />
                  <span style={{ color: t.text, fontSize: 14, fontWeight: 500 }}>{sv}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ background: t.accent, margin: '0 48px', borderRadius: 12, padding: '20px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: isLight ? '#fff' : t.bg, fontWeight: 700, fontSize: 18 }}>{cta}</span>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#fff', fontSize: 20 }}>→</span>
          </div>
        </div>

        <div style={{ padding: '32px 48px 48px', display: 'flex', gap: 32, flexWrap: 'wrap' }}>
          {[
            { icon: '📞', val: data.phone }, { icon: '✉️', val: data.email },
            { icon: '🌐', val: data.website }, { icon: '📍', val: data.address },
          ].filter(c => c.val).map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 14 }}>{c.icon}</span>
              <span style={{ color: t.sub, fontSize: 13 }}>{c.val}</span>
            </div>
          ))}
        </div>

        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 6, background: t.accent }} />
      </div>
    </div>
  );
}

// ── Business Card Preview ─────────────────────────────────────────────────────
function CardPreview({ data, template, side, lang, logoUrl }: { data: CardData; template: TemplateName; side: 'front' | 'back'; lang: Lang; logoUrl: string | null }) {
  const t = TEMPLATES[template];
  const W = 340, H = 200;
  const isLight = t.bg === '#ffffff' || t.bg === '#f8fafc';
  const onAccent = isLight ? '#1e293b' : '#fff';

  const cardTitle   = lang === 'pt' ? data.titlePt   : data.titleEn;
  const services    = lang === 'pt' ? data.servicesPt : data.servicesEn;
  const tagline     = lang === 'pt' ? data.taglinePt  : data.taglineEn;
  const svcLabel    = lang === 'pt' ? 'Serviços' : 'Services';

  if (side === 'front') return (
    <div style={{ width: W, height: H, background: t.bg, borderRadius: 10, overflow: 'hidden', position: 'relative', boxShadow: '0 4px 24px rgba(0,0,0,0.25)', fontFamily: 'Inter,sans-serif' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 5, background: t.accent }} />
      <div style={{ position: 'absolute', bottom: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: t.accent, opacity: 0.08 }} />
      <div style={{ padding: '24px 24px 0', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 6 }} />
          ) : (
            <div style={{ width: 36, height: 36, borderRadius: 8, background: t.accent, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: isLight ? '#fff' : t.bg, fontWeight: 900, fontSize: 11 }}>{data.logoText}</span>
            </div>
          )}
          <span style={{ color: t.accent, fontWeight: 700, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase' }}>{data.company}</span>
        </div>
        <div style={{ color: t.text, fontWeight: 800, fontSize: 18, marginBottom: 2 }}>{data.name}</div>
        <div style={{ color: t.accent, fontWeight: 600, fontSize: 11, marginBottom: 16 }}>{cardTitle}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[{ v: data.phone, i: '📞' }, { v: data.email, i: '✉️' }, { v: data.website, i: '🌐' }].filter(x => x.v).map((x, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 10 }}>{x.i}</span>
              <span style={{ color: t.sub, fontSize: 10 }}>{x.v}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, background: t.accent }} />
    </div>
  );

  return (
    <div style={{ width: W, height: H, background: t.accent, borderRadius: 10, overflow: 'hidden', position: 'relative', boxShadow: '0 4px 24px rgba(0,0,0,0.25)', fontFamily: 'Inter,sans-serif' }}>
      <div style={{ position: 'absolute', top: -40, left: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
      <div style={{ position: 'absolute', bottom: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
      <div style={{ padding: 24, position: 'relative', zIndex: 1 }}>
        <div style={{ color: onAccent, fontWeight: 700, fontSize: 10, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12, opacity: 0.7 }}>{svcLabel}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 16 }}>
          {services.slice(0, 6).map((sv, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 4, height: 4, borderRadius: '50%', background: onAccent, opacity: 0.6 }} />
              <span style={{ color: onAccent, fontSize: 10, fontWeight: 500 }}>{sv}</span>
            </div>
          ))}
        </div>
        <div style={{ color: onAccent, fontStyle: 'italic', fontSize: 12, fontWeight: 600, opacity: 0.9 }}>"{tagline}"</div>
        <div style={{ marginTop: 8, color: onAccent, fontSize: 10, opacity: 0.6 }}>{data.website}</div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function DesignStudioClient() {
  const { toast } = useToast();
  const [mode, setMode] = useState<Mode>('flyer');
  const [template, setTemplate] = useState<TemplateName>('dark-gold');
  const [flyerSize, setFlyerSize] = useState<FlyerSize>('a4');
  const [cardSide, setCardSide] = useState<'front' | 'back'>('front');
  const [flyerData, setFlyerData] = useState<FlyerData>(DEFAULT_FLYER);
  const [cardData, setCardData] = useState<CardData>(DEFAULT_CARD);
  const [aiLoading, setAiLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [lang, setLang] = useState<Lang>('pt');
  const [logoUrl, setLogoUrl] = useState<string | null>('/icon-192.png'); // default: Clarity & Co logo
  const logoInputRef = useRef<HTMLInputElement>(null);
  const flyerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => setLogoUrl(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  // ── AI Suggest ──────────────────────────────────────────────────────────────
  async function aiSuggest() {
    setAiLoading(true);
    try {
      const context = mode === 'flyer'
        ? `Create bilingual (PT-BR and EN) marketing flyer content for Clarity & Co, a UK financial services company. ${aiPrompt ? `Additional context: ${aiPrompt}` : ''} Return JSON with keys: headlinePt, headlineEn, subheadlinePt, subheadlineEn, bodyPt, bodyEn, servicesPt (array), servicesEn (array), ctaPt, ctaEn`
        : `Create bilingual (PT-BR and EN) business card content for Clarity & Co. ${aiPrompt ? `Additional context: ${aiPrompt}` : ''} Return JSON: {"titlePt":"...","titleEn":"...","taglinePt":"...","taglineEn":"...","servicesPt":["..."],"servicesEn":["..."]}`;

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [{ role: 'user', content: context }],
          systemOverride: 'You are a professional marketing copywriter for Clarity & Co, a UK financial services platform. Always reply ONLY with valid JSON, no markdown, no explanation.',
        }),
      });
      const data = await res.json();
      const text: string = data.content || data.message || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (mode === 'flyer') {
          setFlyerData(prev => ({ ...prev, ...parsed }));
        } else {
          setCardData(prev => ({ ...prev, ...parsed }));
        }
        toast({ title: '✅ Conteúdo gerado pela IA!' });
      }
    } catch {
      toast({ title: 'Erro ao gerar', variant: 'destructive' });
    } finally {
      setAiLoading(false);
    }
  }

  // ── Export PDF ──────────────────────────────────────────────────────────────
  async function exportPDF() {
    setExporting(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const jsPDF = (await import('jspdf')).jsPDF;

      const el = mode === 'flyer' ? flyerRef.current : cardRef.current;
      if (!el) return;

      const canvas = await html2canvas(el, { scale: 3, useCORS: true, backgroundColor: null });
      const imgData = canvas.toDataURL('image/png', 1.0);

      if (mode === 'flyer') {
        const s = FLYER_SIZES[flyerSize];
        const orientation = s.h > s.w ? 'p' : 'l';
        const pdf = new jsPDF({ orientation, unit: 'pt', format: [s.w, s.h] });
        pdf.addImage(imgData, 'PNG', 0, 0, s.w, s.h);
        pdf.save(`clarity-co-flyer-${flyerSize}.pdf`);
      } else {
        // Business card: 85x55mm = 241x156pt
        const pdf = new jsPDF({ orientation: 'l', unit: 'mm', format: [85, 55] });
        pdf.addImage(imgData, 'PNG', 0, 0, 85, 55);
        pdf.save(`clarity-co-cartao-${cardSide}.pdf`);
      }
      toast({ title: '📄 PDF exportado com sucesso!' });
    } catch {
      toast({ title: 'Erro ao exportar PDF', variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  }

  // ── Export PNG ──────────────────────────────────────────────────────────────
  async function exportPNG() {
    setExporting(true);
    try {
      const html2canvas = (await import('html2canvas')).default;
      const el = mode === 'flyer' ? flyerRef.current : cardRef.current;
      if (!el) return;

      const canvas = await html2canvas(el, { scale: 3, useCORS: true, backgroundColor: null });
      const link = document.createElement('a');
      link.download = mode === 'flyer' ? `flyer-${flyerSize}.png` : `cartao-${cardSide}.png`;
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
      toast({ title: '🖼️ PNG exportado!' });
    } catch {
      toast({ title: 'Erro ao exportar PNG', variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  }

  // ── Service tag helpers ─────────────────────────────────────────────────────
  function addService(list: string[], svc: string, setter: (fn: (prev: any) => any) => void, key: string) {
    if (!list.includes(svc)) setter((prev: any) => ({ ...prev, [key]: [...list, svc] }));
  }
  function removeService(list: string[], idx: number, setter: (fn: (prev: any) => any) => void, key: string) {
    setter((prev: any) => ({ ...prev, [key]: list.filter((_: any, i: number) => i !== idx) }));
  }

  const fSvcsPt = flyerData.servicesPt;
  const fSvcsEn = flyerData.servicesEn;
  const cSvcsPt = cardData.servicesPt;
  const cSvcsEn = cardData.servicesEn;

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <div className="w-56 border-r flex flex-col bg-card shrink-0">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-pink-600 flex items-center justify-center">
              <Palette className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-sm">Design Studio</span>
          </div>
        </div>
        {/* Logo section */}
        <div className="p-3 border-b space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide px-1">Logo</p>
          <div className="flex items-center gap-2 px-1">
            <div className="h-10 w-10 rounded-lg border bg-muted flex items-center justify-center overflow-hidden shrink-0">
              {logoUrl ? (
                <img src={logoUrl} alt="logo" className="h-full w-full object-contain" />
              ) : (
                <ImageIcon className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <button onClick={() => setLogoUrl('/icon-192.png')}
                className="text-[10px] px-2 py-1 rounded border border-amber-400 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors font-medium">
                Usar logo Clarity & Co
              </button>
              <button onClick={() => logoInputRef.current?.click()}
                className="text-[10px] px-2 py-1 rounded border border-dashed border-violet-400 text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-colors">
                <Upload className="h-2.5 w-2.5 inline mr-1" />Upload logo
              </button>
              {logoUrl && (
                <button onClick={() => setLogoUrl(null)}
                  className="text-[10px] px-2 py-1 rounded border border-red-300 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                  Remover logo
                </button>
              )}
            </div>
          </div>
          <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
        </div>
        <nav className="flex-1 p-3 space-y-1">
          <button onClick={() => setMode('flyer')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${mode === 'flyer' ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}>
            <FileImage className="h-4 w-4" /> Flyer / Panfleto
          </button>
          <button onClick={() => setMode('card')}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${mode === 'card' ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}>
            <CreditCard className="h-4 w-4" /> Cartão de Visita
          </button>
          <div className="pt-3 mt-2 border-t">
            <p className="text-xs font-semibold text-muted-foreground px-3 mb-2 uppercase tracking-wide">Templates</p>
            {(Object.entries(TEMPLATES) as [TemplateName, typeof TEMPLATES[TemplateName]][]).map(([key, t]) => (
              <button key={key} onClick={() => setTemplate(key)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${template === key ? 'bg-muted font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}>
                <div className="h-4 w-4 rounded-full border-2 flex-shrink-0" style={{ background: t.accent, borderColor: t.bg === '#ffffff' || t.bg === '#f8fafc' ? '#e2e8f0' : t.bg }} />
                <div className="text-left">
                  <div className="text-xs font-medium leading-none">{t.label}</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{t.desc}</div>
                </div>
              </button>
            ))}
          </div>
        </nav>
        <div className="p-3 border-t">
          <Link href="/admin/marketing" className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
            <ChevronRight className="h-3 w-3 rotate-180" /> Voltar ao Marketing
          </Link>
        </div>
      </div>

      {/* Main */}
      <div className="flex-1 flex overflow-hidden">

        {/* Editor Panel */}
        <div className="w-80 border-r flex flex-col overflow-hidden shrink-0">
          <div className="p-4 border-b bg-card shrink-0 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-sm">{mode === 'flyer' ? 'Editor de Flyer' : 'Editor de Cartão'}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Preenche os campos ou usa a IA</p>
            </div>
            {/* EN/PT toggle */}
            <button onClick={() => setLang(l => l === 'pt' ? 'en' : 'pt')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-semibold transition-colors ${
                lang === 'pt'
                  ? 'bg-green-100 border-green-400 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                  : 'bg-blue-100 border-blue-400 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
              }`}>
              <Languages className="h-3 w-3" />
              {lang === 'pt' ? 'PT' : 'EN'}
            </button>
          </div>

          {/* AI Assist */}
          <div className="p-4 border-b bg-gradient-to-r from-violet-50 to-pink-50 dark:from-violet-950/20 dark:to-pink-950/20 shrink-0">
            <p className="text-xs font-semibold text-violet-700 dark:text-violet-400 mb-2 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> Sugerir com IA
            </p>
            <Input
              value={aiPrompt}
              onChange={e => setAiPrompt(e.target.value)}
              placeholder="Ex: foco em empresas, tom formal..."
              className="text-xs h-8 mb-2"
            />
            <Button onClick={aiSuggest} disabled={aiLoading} size="sm"
              className="w-full bg-violet-600 hover:bg-violet-700 text-white h-8 text-xs">
              {aiLoading ? <><Loader2 className="h-3 w-3 mr-1.5 animate-spin" /> A gerar...</> : <><Sparkles className="h-3 w-3 mr-1.5" /> Preencher com IA</>}
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {mode === 'flyer' ? (
              <>
                {/* Flyer size */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Tamanho</label>
                  <div className="grid grid-cols-3 gap-1.5 mt-1.5">
                    {(Object.entries(FLYER_SIZES) as [FlyerSize, typeof FLYER_SIZES[FlyerSize]][]).map(([k, v]) => (
                      <button key={k} onClick={() => setFlyerSize(k)}
                        className={`text-center p-2 rounded-lg border text-xs transition-colors ${flyerSize === k ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300' : 'border-border text-muted-foreground hover:bg-muted/50'}`}>
                        <div className="font-semibold">{v.label}</div>
                        <div className="text-[10px] opacity-70 mt-0.5">{v.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Bilingual text fields */}
                  {([
                    { labelPt: 'Título (PT)', labelEn: 'Title (EN)', keyPt: 'headlinePt', keyEn: 'headlineEn', type: 'input' },
                    { labelPt: 'Subtítulo (PT)', labelEn: 'Subtitle (EN)', keyPt: 'subheadlinePt', keyEn: 'subheadlineEn', type: 'input' },
                    { labelPt: 'Texto (PT)', labelEn: 'Body text (EN)', keyPt: 'bodyPt', keyEn: 'bodyEn', type: 'textarea' },
                    { labelPt: 'Call to Action (PT)', labelEn: 'Call to Action (EN)', keyPt: 'ctaPt', keyEn: 'ctaEn', type: 'input' },
                  ] as const).map(f => (
                    <div key={f.keyPt} className="space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                        <label className="text-xs font-medium text-muted-foreground">{f.labelPt}</label>
                      </div>
                      {f.type === 'textarea'
                        ? <Textarea value={(flyerData as any)[f.keyPt]} onChange={e => setFlyerData(p => ({ ...p, [f.keyPt]: e.target.value }))} rows={2} className="text-xs" />
                        : <Input value={(flyerData as any)[f.keyPt]} onChange={e => setFlyerData(p => ({ ...p, [f.keyPt]: e.target.value }))} className="text-xs h-8" />}
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                        <label className="text-xs font-medium text-muted-foreground">{f.labelEn}</label>
                      </div>
                      {f.type === 'textarea'
                        ? <Textarea value={(flyerData as any)[f.keyEn]} onChange={e => setFlyerData(p => ({ ...p, [f.keyEn]: e.target.value }))} rows={2} className="text-xs" />
                        : <Input value={(flyerData as any)[f.keyEn]} onChange={e => setFlyerData(p => ({ ...p, [f.keyEn]: e.target.value }))} className="text-xs h-8" />}
                    </div>
                  ))}

                  {/* Shared fields */}
                  {[
                    { label: 'Texto do Logo', key: 'logoText' },
                    { label: 'Telefone', key: 'phone' },
                    { label: 'Email', key: 'email' },
                    { label: 'Website', key: 'website' },
                    { label: 'Endereço', key: 'address' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="text-xs font-medium text-muted-foreground">{f.label}</label>
                      <Input value={(flyerData as any)[f.key]} onChange={e => setFlyerData(p => ({ ...p, [f.key]: e.target.value }))} className="mt-1 text-xs h-8" />
                    </div>
                  ))}

                  {/* Services PT */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-green-500 inline-block" /> Serviços (PT)</label>
                    <div className="flex flex-wrap gap-1.5 mt-1.5 mb-1">
                      {fSvcsPt.map((s, i) => (
                        <Badge key={i} variant="secondary" className="text-xs gap-1 pr-1">{s}
                          <button onClick={() => removeService(fSvcsPt, i, setFlyerData, 'servicesPt')} className="hover:text-red-500 ml-0.5">×</button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {SERVICES_SUGGESTIONS.filter(s => !fSvcsPt.includes(s)).slice(0, 4).map(s => (
                        <button key={s} onClick={() => addService(fSvcsPt, s, setFlyerData, 'servicesPt')}
                          className="text-[10px] px-2 py-0.5 rounded-full border border-dashed border-green-300 text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20">+ {s}</button>
                      ))}
                    </div>
                  </div>

                  {/* Services EN */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-blue-500 inline-block" /> Services (EN)</label>
                    <div className="flex flex-wrap gap-1.5 mt-1.5 mb-1">
                      {fSvcsEn.map((s, i) => (
                        <Badge key={i} variant="secondary" className="text-xs gap-1 pr-1">{s}
                          <button onClick={() => removeService(fSvcsEn, i, setFlyerData, 'servicesEn')} className="hover:text-red-500 ml-0.5">×</button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {['Accounting & Tax','HMRC Self Assessment','Company Formation','Open Banking','Financial Management','Tax Consulting'].filter(s => !fSvcsEn.includes(s)).slice(0, 4).map(s => (
                        <button key={s} onClick={() => addService(fSvcsEn, s, setFlyerData, 'servicesEn')}
                          className="text-[10px] px-2 py-0.5 rounded-full border border-dashed border-blue-300 text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20">+ {s}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Card side selector */}
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Lado</label>
                  <div className="grid grid-cols-2 gap-1.5 mt-1.5">
                    {(['front', 'back'] as const).map(s => (
                      <button key={s} onClick={() => setCardSide(s)}
                        className={`p-2 rounded-lg border text-xs font-medium transition-colors ${cardSide === s ? 'border-violet-500 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300' : 'border-border text-muted-foreground hover:bg-muted/50'}`}>
                        {s === 'front' ? '▣ Frente' : '▢ Verso'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  {/* Shared fields */}
                  {[
                    { label: 'Nome', key: 'name' },
                    { label: 'Empresa', key: 'company' },
                    { label: 'Telefone', key: 'phone' },
                    { label: 'Email', key: 'email' },
                    { label: 'Website', key: 'website' },
                    { label: 'Endereço', key: 'address' },
                    { label: 'Texto do Logo', key: 'logoText' },
                  ].map(f => (
                    <div key={f.key}>
                      <label className="text-xs font-medium text-muted-foreground">{f.label}</label>
                      <Input value={(cardData as any)[f.key]} onChange={e => setCardData(p => ({ ...p, [f.key]: e.target.value }))} className="mt-1 text-xs h-8" />
                    </div>
                  ))}

                  {/* Bilingual fields */}
                  {([
                    { labelPt: 'Cargo (PT)', labelEn: 'Title (EN)', keyPt: 'titlePt', keyEn: 'titleEn' },
                    { labelPt: 'Slogan — verso (PT)', labelEn: 'Tagline — back (EN)', keyPt: 'taglinePt', keyEn: 'taglineEn' },
                  ] as const).map(f => (
                    <div key={f.keyPt} className="space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                        <label className="text-xs font-medium text-muted-foreground">{f.labelPt}</label>
                      </div>
                      <Input value={(cardData as any)[f.keyPt]} onChange={e => setCardData(p => ({ ...p, [f.keyPt]: e.target.value }))} className="text-xs h-8" />
                      <div className="flex items-center gap-1.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                        <label className="text-xs font-medium text-muted-foreground">{f.labelEn}</label>
                      </div>
                      <Input value={(cardData as any)[f.keyEn]} onChange={e => setCardData(p => ({ ...p, [f.keyEn]: e.target.value }))} className="text-xs h-8" />
                    </div>
                  ))}

                  {/* Services PT */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-green-500 inline-block" /> Serviços verso (PT)</label>
                    <div className="flex flex-wrap gap-1.5 mt-1.5 mb-1">
                      {cSvcsPt.map((s, i) => (
                        <Badge key={i} variant="secondary" className="text-xs gap-1 pr-1">{s}
                          <button onClick={() => removeService(cSvcsPt, i, setCardData, 'servicesPt')} className="hover:text-red-500 ml-0.5">×</button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {SERVICES_SUGGESTIONS.filter(s => !cSvcsPt.includes(s)).slice(0, 4).map(s => (
                        <button key={s} onClick={() => addService(cSvcsPt, s, setCardData, 'servicesPt')}
                          className="text-[10px] px-2 py-0.5 rounded-full border border-dashed border-green-300 text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20">+ {s}</button>
                      ))}
                    </div>
                  </div>

                  {/* Services EN */}
                  <div>
                    <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-blue-500 inline-block" /> Services back (EN)</label>
                    <div className="flex flex-wrap gap-1.5 mt-1.5 mb-1">
                      {cSvcsEn.map((s, i) => (
                        <Badge key={i} variant="secondary" className="text-xs gap-1 pr-1">{s}
                          <button onClick={() => removeService(cSvcsEn, i, setCardData, 'servicesEn')} className="hover:text-red-500 ml-0.5">×</button>
                        </Badge>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {['Accounting','UK Taxes','Company Formation','Open Banking','Financial Planning'].filter(s => !cSvcsEn.includes(s)).slice(0, 4).map(s => (
                        <button key={s} onClick={() => addService(cSvcsEn, s, setCardData, 'servicesEn')}
                          className="text-[10px] px-2 py-0.5 rounded-full border border-dashed border-blue-300 text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20">+ {s}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Preview + Export */}
        <div className="flex-1 flex flex-col overflow-hidden bg-muted/30">
          {/* Export toolbar */}
          <div className="border-b px-6 py-3 flex items-center justify-between bg-card shrink-0">
            <div>
              <h2 className="font-semibold text-sm">Preview</h2>
              <p className="text-xs text-muted-foreground">
                {mode === 'flyer' ? `Flyer ${FLYER_SIZES[flyerSize].label} — Template ${TEMPLATES[template].label}` : `Cartão de Visita — ${cardSide === 'front' ? 'Frente' : 'Verso'} — ${TEMPLATES[template].label}`}
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => { setFlyerData(DEFAULT_FLYER); setCardData(DEFAULT_CARD); }} variant="ghost" size="sm" className="h-8 text-xs">
                <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Resetar
              </Button>
              <Button onClick={exportPNG} disabled={exporting} variant="outline" size="sm" className="h-8 text-xs">
                {exporting ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5 mr-1.5" />}
                PNG
              </Button>
              <Button onClick={exportPDF} disabled={exporting} size="sm" className="h-8 text-xs bg-violet-600 hover:bg-violet-700 text-white">
                {exporting ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Download className="h-3.5 w-3.5 mr-1.5" />}
                PDF para Gráfica
              </Button>
            </div>
          </div>

          {/* Preview area */}
          <div className="flex-1 overflow-auto flex items-start justify-center p-8 gap-10">
            {mode === 'flyer' ? (
              <div className="flex flex-col items-center gap-6">
                <div className="flex gap-6">
                  <div>
                    <div className="text-xs text-center text-muted-foreground mb-2 font-medium flex items-center justify-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-green-500" />PT — {FLYER_SIZES[flyerSize].label}
                    </div>
                    <div ref={lang === 'pt' ? flyerRef : undefined}>
                      <FlyerPreview data={flyerData} template={template} size={flyerSize} lang="pt" logoUrl={logoUrl} />
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-center text-muted-foreground mb-2 font-medium flex items-center justify-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-blue-500" />EN — {FLYER_SIZES[flyerSize].label}
                    </div>
                    <div ref={lang === 'en' ? flyerRef : undefined}>
                      <FlyerPreview data={flyerData} template={template} size={flyerSize} lang="en" logoUrl={logoUrl} />
                    </div>
                  </div>
                </div>
                <div className="text-xs text-center text-muted-foreground">
                  {FLYER_SIZES[flyerSize].w} × {FLYER_SIZES[flyerSize].h} pt — {FLYER_SIZES[flyerSize].desc} — O botão <strong>PDF</strong> exporta a versão <strong>{lang.toUpperCase()}</strong>
                </div>
              </div>
            ) : (
              <div className="flex gap-10">
                <div className="flex flex-col gap-6 items-center">
                  <p className="text-xs font-semibold text-green-600 uppercase tracking-wide">🇧🇷 Português</p>
                  <div>
                    <div className="text-xs text-center text-muted-foreground mb-2">Frente</div>
                    <div ref={lang === 'pt' && cardSide === 'front' ? cardRef : undefined}>
                      <CardPreview data={cardData} template={template} side="front" lang="pt" logoUrl={logoUrl} />
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-center text-muted-foreground mb-2">Verso</div>
                    <div ref={lang === 'pt' && cardSide === 'back' ? cardRef : undefined}>
                      <CardPreview data={cardData} template={template} side="back" lang="pt" logoUrl={logoUrl} />
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-6 items-center">
                  <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">🇬🇧 English</p>
                  <div>
                    <div className="text-xs text-center text-muted-foreground mb-2">Front</div>
                    <div ref={lang === 'en' && cardSide === 'front' ? cardRef : undefined}>
                      <CardPreview data={cardData} template={template} side="front" lang="en" logoUrl={logoUrl} />
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-center text-muted-foreground mb-2">Back</div>
                    <div ref={lang === 'en' && cardSide === 'back' ? cardRef : undefined}>
                      <CardPreview data={cardData} template={template} side="back" lang="en" logoUrl={logoUrl} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Tips */}
          <div className="border-t px-6 py-3 bg-card shrink-0">
            <div className="flex items-center gap-6 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><Download className="h-3 w-3" /> <strong>PDF</strong> — Alta resolução para enviar à gráfica</span>
              <span className="flex items-center gap-1.5"><ImageIcon className="h-3 w-3" /> <strong>PNG</strong> — Para partilhar no WhatsApp, Instagram e email</span>
              <span className="flex items-center gap-1.5"><Sparkles className="h-3 w-3" /> <strong>IA</strong> — Preenche automaticamente com texto profissional</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
