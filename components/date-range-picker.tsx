'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Calendar, ChevronLeft, ChevronRight, ChevronDown, X } from 'lucide-react';

export interface DateRange {
  startDate: string; // ISO yyyy-mm-dd
  endDate: string;
  label: string;      // human-readable label e.g. "January 2026"
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

function pad(n: number) { return String(n).padStart(2, '0'); }
function toIso(y: number, m: number, d: number) { return `${y}-${pad(m + 1)}-${pad(d)}`; }

function getTaxYears(): { value: string; label: string; start: string; end: string }[] {
  const now = new Date();
  const currentYear = now.getFullYear();
  const isAfterApril5 = now.getMonth() > 3 || (now.getMonth() === 3 && now.getDate() > 5);
  const latest = isAfterApril5 ? currentYear : currentYear - 1;
  return Array.from({ length: 7 }, (_, i) => {
    const ys = latest - i;
    const ye = ys + 1;
    return {
      value: `${ys}-${ye}`,
      label: `${ys}/${ye}${i === 0 ? ' (Current)' : ''}`,
      start: `${ys}-04-06`,
      end: `${ye}-04-05`,
    };
  });
}

function getQuickPresets(): { label: string; start: string; end: string }[] {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();

  // This month
  const thisMonthStart = toIso(y, m, 1);
  const thisMonthEnd = toIso(y, m, new Date(y, m + 1, 0).getDate());

  // Last month
  const lm = m === 0 ? 11 : m - 1;
  const ly = m === 0 ? y - 1 : y;
  const lastMonthStart = toIso(ly, lm, 1);
  const lastMonthEnd = toIso(ly, lm, new Date(ly, lm + 1, 0).getDate());

  // Last 3 months
  const q3Start = new Date(y, m - 2, 1);
  const last3Start = toIso(q3Start.getFullYear(), q3Start.getMonth(), 1);

  // Last 6 months
  const q6Start = new Date(y, m - 5, 1);
  const last6Start = toIso(q6Start.getFullYear(), q6Start.getMonth(), 1);

  // This quarter (Jan-Mar / Apr-Jun / Jul-Sep / Oct-Dec)
  const qStart = Math.floor(m / 3) * 3;
  const thisQStart = toIso(y, qStart, 1);
  const thisQEnd = toIso(y, qStart + 2, new Date(y, qStart + 3, 0).getDate());

  // Last quarter
  const lqStart = qStart === 0 ? 9 : qStart - 3;
  const lqYear = qStart === 0 ? y - 1 : y;
  const lastQStart = toIso(lqYear, lqStart, 1);
  const lastQEnd = toIso(lqYear, lqStart + 2, new Date(lqYear, lqStart + 3, 0).getDate());

  // This calendar year
  const thisYearStart = `${y}-01-01`;
  const thisYearEnd = `${y}-12-31`;

  // Last calendar year
  const lastYearStart = `${y - 1}-01-01`;
  const lastYearEnd = `${y - 1}-12-31`;

  return [
    { label: 'This Month', start: thisMonthStart, end: thisMonthEnd },
    { label: 'Last Month', start: lastMonthStart, end: lastMonthEnd },
    { label: 'This Quarter', start: thisQStart, end: thisQEnd },
    { label: 'Last Quarter', start: lastQStart, end: lastQEnd },
    { label: 'Last 3 Months', start: last3Start, end: thisMonthEnd },
    { label: 'Last 6 Months', start: last6Start, end: thisMonthEnd },
    { label: `This Year (${y})`, start: thisYearStart, end: thisYearEnd },
    { label: `Last Year (${y - 1})`, start: lastYearStart, end: lastYearEnd },
  ];
}

function formatDisplayLabel(start: string, end: string): string {
  if (!start && !end) return 'Select period...';
  if (!end || start === end) {
    const d = new Date(start + 'T00:00:00');
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  const s = new Date(start + 'T00:00:00');
  const e = new Date(end + 'T00:00:00');
  // Same month+year → "Jan 2026"
  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
    return s.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  }
  // Same year
  if (s.getFullYear() === e.getFullYear()) {
    return `${s.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${e.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
  }
  return `${s.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} – ${e.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

interface CalMonth {
  year: number;
  month: number; // 0-indexed
}

function addMonths(cm: CalMonth, delta: number): CalMonth {
  let m = cm.month + delta;
  let y = cm.year;
  while (m < 0) { m += 12; y--; }
  while (m > 11) { m -= 12; y++; }
  return { year: y, month: m };
}

function daysInMonth(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function firstDayOfMonth(y: number, m: number) { return new Date(y, m, 1).getDay(); }

export default function DateRangePicker({ value, onChange, className = '' }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const [selecting, setSelecting] = useState<'start' | 'end' | null>(null);
  const [tempStart, setTempStart] = useState(value.startDate);
  const [tempEnd, setTempEnd] = useState(value.endDate);
  const [isMobile, setIsMobile] = useState(false);

  const now = new Date();
  const [leftMonth, setLeftMonth] = useState<CalMonth>({
    year: value.startDate ? new Date(value.startDate + 'T00:00:00').getFullYear() : now.getFullYear(),
    month: value.startDate ? new Date(value.startDate + 'T00:00:00').getMonth() : now.getMonth(),
  });

  const rightMonth = addMonths(leftMonth, 1);
  const dropRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const taxYears = getTaxYears();
  const presets = getQuickPresets();

  // Detect mobile
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setSelecting(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const applyRange = useCallback((start: string, end: string, label: string) => {
    onChange({ startDate: start, endDate: end, label });
    setTempStart(start);
    setTempEnd(end);
    setSelecting(null);
    setOpen(false);
  }, [onChange]);

  const handleDayClick = (iso: string) => {
    if (!selecting || selecting === 'start') {
      setTempStart(iso);
      setTempEnd('');
      setSelecting('end');
    } else {
      if (iso < tempStart) {
        setTempEnd(tempStart);
        setTempStart(iso);
      } else {
        setTempEnd(iso);
      }
      setSelecting(null);
    }
  };

  const handleApply = () => {
    if (tempStart && tempEnd) {
      applyRange(tempStart, tempEnd, formatDisplayLabel(tempStart, tempEnd));
    } else if (tempStart) {
      applyRange(tempStart, tempStart, formatDisplayLabel(tempStart, tempStart));
    }
  };

  const isInRange = (iso: string) => {
    const end = selecting === 'end' ? (hoverDate || tempEnd) : tempEnd;
    if (!tempStart || !end) return false;
    const s = tempStart < end ? tempStart : end;
    const e = tempStart < end ? end : tempStart;
    return iso > s && iso < e;
  };

  const isStart = (iso: string) => iso === tempStart;
  const isEnd = (iso: string) => {
    const end = selecting === 'end' ? (hoverDate || tempEnd) : tempEnd;
    return iso === end;
  };

  const renderCalendar = (cm: CalMonth, fullWidth = false) => {
    const { year, month } = cm;
    const days = daysInMonth(year, month);
    const firstDay = firstDayOfMonth(year, month);
    const cells: (string | null)[] = Array(firstDay).fill(null);
    for (let d = 1; d <= days; d++) cells.push(toIso(year, month, d));
    while (cells.length % 7 !== 0) cells.push(null);

    return (
      <div className={fullWidth ? 'w-full' : 'w-[200px]'}>
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-sm font-semibold">{MONTHS[month]} {year}</span>
        </div>
        <div className="grid grid-cols-7 mb-1">
          {DAYS.map(d => (
            <div key={d} className="text-center text-[10px] text-muted-foreground font-medium py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((iso, i) => {
            if (!iso) return <div key={i} />;
            const isS = isStart(iso);
            const isE = isEnd(iso);
            const inRange = isInRange(iso);
            const isToday = iso === toIso(now.getFullYear(), now.getMonth(), now.getDate());
            return (
              <button
                key={iso}
                onClick={() => handleDayClick(iso)}
                onMouseEnter={() => selecting === 'end' && setHoverDate(iso)}
                onMouseLeave={() => selecting === 'end' && setHoverDate(null)}
                className={[
                  'text-xs h-8 w-full flex items-center justify-center rounded transition-colors',
                  isS || isE ? 'bg-purple-600 text-white font-semibold z-10 relative' : '',
                  inRange ? 'bg-purple-500/20 text-purple-300 rounded-none' : '',
                  !isS && !isE && !inRange ? 'hover:bg-muted' : '',
                  isToday && !isS && !isE ? 'font-bold text-amber-400' : '',
                ].filter(Boolean).join(' ')}
              >
                {parseInt(iso.split('-')[2])}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const presetsPanel = (
    <div className="flex flex-col">
      <div className="p-3 pb-1">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Quick Select</p>
        <div className="grid grid-cols-2 sm:grid-cols-1 gap-0.5">
          {presets.map(p => (
            <button
              key={p.label}
              onClick={() => applyRange(p.start, p.end, p.label)}
              className={`w-full text-left text-xs px-2 py-2 rounded hover:bg-muted transition-colors ${value.label === p.label ? 'bg-purple-500/20 text-purple-400 font-medium' : ''}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <div className="p-3 pt-2 border-t">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">Tax Years</p>
        <div className="grid grid-cols-2 sm:grid-cols-1 gap-0.5">
          {taxYears.map(ty => (
            <button
              key={ty.value}
              onClick={() => applyRange(ty.start, ty.end, ty.label)}
              className={`w-full text-left text-xs px-2 py-2 rounded hover:bg-muted transition-colors ${value.label === ty.label ? 'bg-purple-500/20 text-purple-400 font-medium' : ''}`}
            >
              {ty.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const manualInputs = (
    <div className="flex flex-wrap items-center gap-2 border-t pt-3">
      <input
        type="date"
        value={tempStart}
        onChange={e => { setTempStart(e.target.value); setSelecting('end'); }}
        className="px-2 py-1.5 rounded border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 flex-1 min-w-[120px]"
      />
      <span className="text-muted-foreground text-xs">→</span>
      <input
        type="date"
        value={tempEnd}
        onChange={e => setTempEnd(e.target.value)}
        className="px-2 py-1.5 rounded border bg-background text-xs focus:outline-none focus:ring-2 focus:ring-purple-500 flex-1 min-w-[120px]"
      />
      <div className="flex gap-2 w-full sm:w-auto">
        <button
          onClick={handleApply}
          disabled={!tempStart}
          className="flex-1 sm:flex-none px-4 py-1.5 rounded-lg bg-purple-600 text-white text-xs font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
        >
          Apply
        </button>
        <button
          onClick={() => { setOpen(false); setSelecting(null); }}
          className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg border text-xs hover:bg-muted transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );

  return (
    <div className={`relative inline-block ${className}`}>
      {/* Trigger button */}
      <button
        ref={triggerRef}
        onClick={() => {
          setOpen(o => !o);
          setSelecting('start');
          setTempStart(value.startDate);
          setTempEnd(value.endDate);
        }}
        className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border bg-card text-sm hover:bg-muted/50 transition-colors w-full sm:w-auto sm:min-w-[180px] justify-between"
      >
        <span className="flex items-center gap-2 min-w-0">
          <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
          <span className="truncate text-xs sm:text-sm">
            {value.label || formatDisplayLabel(value.startDate, value.endDate)}
          </span>
        </span>
        <div className="flex items-center gap-1 shrink-0">
          {(value.startDate || value.endDate) && (
            <span
              onClick={e => { e.stopPropagation(); onChange({ startDate: '', endDate: '', label: '' }); }}
              className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </span>
          )}
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </div>
      </button>

      {/* ── MOBILE: full-width bottom sheet ── */}
      {open && isMobile && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/40"
            onClick={() => { setOpen(false); setSelecting(null); }}
          />
          {/* Sheet */}
          <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl border bg-card shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
            </div>
            <div className="p-4 space-y-4">
              {/* Single calendar */}
              <div className="flex items-center justify-between">
                <button onClick={() => setLeftMonth(m => addMonths(m, -1))} className="p-2 rounded hover:bg-muted transition-colors">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="flex-1 px-2">
                  {renderCalendar(leftMonth, true)}
                </div>
                <button onClick={() => setLeftMonth(m => addMonths(m, 1))} className="p-2 rounded hover:bg-muted transition-colors">
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
              {/* Presets grid */}
              {presetsPanel}
              {/* Manual inputs */}
              {manualInputs}
              {/* Hint */}
              {selecting === 'end' && (
                <p className="text-[11px] text-purple-400">Tap end date on calendar or type above</p>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── TABLET / DESKTOP: right-aligned dropdown ── */}
      {open && !isMobile && (
        <div
          ref={dropRef}
          className="absolute top-full mt-2 right-0 z-50 rounded-xl border bg-card shadow-2xl overflow-hidden"
          style={{ width: 'min(580px, calc(100vw - 16px))' }}
        >
          <div className="flex">
            {/* Left: Presets + Tax Years (scrollable) */}
            <div className="w-40 border-r bg-muted/20 overflow-y-auto max-h-[400px] shrink-0">
              {presetsPanel}
            </div>

            {/* Right: Calendar(s) */}
            <div className="flex flex-col p-3 gap-3 flex-1 min-w-0">
              {/* Navigation + calendars */}
              <div className="flex items-center gap-1">
                <button onClick={() => setLeftMonth(m => addMonths(m, -1))} className="p-1 rounded hover:bg-muted transition-colors shrink-0">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                {/* Tablet (640-1023px): single calendar. Desktop (≥1024px): dual */}
                <div className="flex gap-4 flex-1 justify-center">
                  <div className="hidden lg:block">
                    {renderCalendar(leftMonth)}
                  </div>
                  <div className="lg:hidden flex-1">
                    {renderCalendar(leftMonth, true)}
                  </div>
                  <div className="hidden lg:block">
                    {renderCalendar(rightMonth)}
                  </div>
                </div>
                <button onClick={() => setLeftMonth(m => addMonths(m, 1))} className="p-1 rounded hover:bg-muted transition-colors shrink-0">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* Manual inputs + Apply */}
              {manualInputs}

              {/* Hint */}
              {selecting === 'end' && (
                <p className="text-[11px] text-purple-400 -mt-1">Click end date on calendar or type it above</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
