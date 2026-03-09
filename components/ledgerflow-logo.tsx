'use client';

/**
 * LedgerFlow Logo Component
 * 
 * Context-aware variants:
 * - sidebar:  White "Ledger" + gold gradient "Flow" on dark bg
 * - navbar:   White "Ledger" + gold gradient "Flow" on dark bg (compact)
 * - landing:  White "Ledger" + bright gold gradient "Flow" (hero-sized)
 * - login:    Large, centered, with subtle glow
 * - light:    Navy "Ledger" + amber "Flow" for light backgrounds
 * - footer:   Muted/subtle version
 */

type LogoContext = 'sidebar' | 'navbar' | 'landing' | 'login' | 'light' | 'footer';

interface LedgerFlowLogoProps {
  variant?: 'full' | 'icon';
  context?: LogoContext;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  className?: string;
  showTagline?: boolean;
  tagline?: string;
}

const SIZES = {
  xs: { icon: 20, text: 'text-xs', gap: 'gap-1', tagline: 'text-[9px]' },
  sm: { icon: 28, text: 'text-base', gap: 'gap-1.5', tagline: 'text-[10px]' },
  md: { icon: 36, text: 'text-xl', gap: 'gap-2', tagline: 'text-xs' },
  lg: { icon: 48, text: 'text-2xl', gap: 'gap-2.5', tagline: 'text-xs' },
  xl: { icon: 64, text: 'text-3xl', gap: 'gap-3', tagline: 'text-sm' },
  '2xl': { icon: 80, text: 'text-4xl', gap: 'gap-4', tagline: 'text-base' },
};

const CONTEXT_STYLES: Record<LogoContext, { ledger: string; flow: string; tagline: string }> = {
  sidebar: {
    ledger: 'text-white',
    flow: 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 bg-clip-text text-transparent',
    tagline: 'text-slate-400',
  },
  navbar: {
    ledger: 'text-white',
    flow: 'bg-gradient-to-r from-amber-400 to-yellow-500 bg-clip-text text-transparent',
    tagline: 'text-slate-400',
  },
  landing: {
    ledger: 'text-white',
    flow: 'bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-500 bg-clip-text text-transparent',
    tagline: 'text-slate-300',
  },
  login: {
    ledger: 'text-white drop-shadow-[0_0_12px_rgba(245,158,11,0.15)]',
    flow: 'bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-500 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(245,158,11,0.3)]',
    tagline: 'text-slate-400',
  },
  light: {
    ledger: 'text-slate-900 dark:text-white',
    flow: 'bg-gradient-to-r from-amber-500 to-orange-600 bg-clip-text text-transparent',
    tagline: 'text-slate-500 dark:text-slate-400',
  },
  footer: {
    ledger: 'text-slate-300',
    flow: 'bg-gradient-to-r from-amber-500/80 to-yellow-600/80 bg-clip-text text-transparent',
    tagline: 'text-slate-500',
  },
};

function LFIcon({ size = 36, id = '' }: { size?: number; id?: string }) {
  const prefix = id || `lf${size}`;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 512 512"
      fill="none"
      width={size}
      height={size}
      className="flex-shrink-0 rounded-lg"
    >
      <defs>
        <linearGradient id={`${prefix}-gold`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FCD34D" />
          <stop offset="35%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
        <linearGradient id={`${prefix}-bg`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0F172A" />
          <stop offset="100%" stopColor="#1E293B" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="96" fill={`url(#${prefix}-bg)`} />
      {/* Outer C */}
      <path d="M 310 160 A 150 150 0 1 0 310 352"
            stroke={`url(#${prefix}-gold)`} strokeWidth="42" strokeLinecap="butt" fill="none" />
      {/* Inner C with crossbar stems */}
      <path d="M 390 189 L 360 189 A 90 90 0 1 0 360 323 L 390 323"
            stroke={`url(#${prefix}-gold)`} strokeWidth="42" strokeLinecap="butt" fill="none" />
    </svg>
  );
}

export default function LedgerFlowLogo({
  variant = 'full',
  context = 'sidebar',
  size = 'md',
  className = '',
  showTagline = false,
  tagline = 'Your finances, simplified',
}: LedgerFlowLogoProps) {
  const s = SIZES[size];
  const colors = CONTEXT_STYLES[context];

  if (variant === 'icon') {
    return <LFIcon size={s.icon} id={`icon-${context}`} />;
  }

  return (
    <div className={`flex items-center ${s.gap} ${className}`}>
      <LFIcon size={s.icon} id={`full-${context}-${size}`} />
      <div className="min-w-0">
        <span className={`font-bold ${s.text} tracking-tight`}>
          <span className={colors.ledger}>Clarity</span>
          <span className={colors.flow}>&amp; Co</span>
        </span>
        {showTagline && (
          <p className={`${s.tagline} ${colors.tagline} truncate leading-tight`}>{tagline}</p>
        )}
      </div>
    </div>
  );
}

export { LFIcon };
