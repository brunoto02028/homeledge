'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useRouter } from 'next/navigation';
import {
  Lock, ArrowRight, Sparkles, Star,
  BarChart3, TrendingUp, Home, Building2, CalendarClock,
  Mail, ShoppingBag, Shield, FileText, Users,
  CreditCard, CheckCircle2, Zap,
} from 'lucide-react';
import type { PermissionKey } from '@/lib/permissions';

// Which plan is required to unlock each module
const MODULE_PLAN_REQUIRED: Partial<Record<PermissionKey, string>> = {
  entities: 'pro',
  household: 'pro',
  reports: 'pro',
  projections: 'pro',
  properties: 'pro',
  product_calculator: 'pro',
  tax_timeline: 'pro',
  email: 'pro',
  providers: 'pro',
  services: 'pro',
  insurance: 'pro',
  correspondence: 'pro',
};

// Module descriptions shown in the modal
const MODULE_INFO: Partial<Record<PermissionKey, {
  icon: any;
  title: string;
  description: string;
  highlights: string[];
  color: string;
}>> = {
  entities: {
    icon: Building2,
    title: 'Multi-Entity Management',
    description: 'Manage multiple companies, sole trader profiles, and personal accounts under one roof. Perfect for freelancers juggling multiple clients or business owners with multiple companies.',
    highlights: ['Unlimited companies & profiles', 'Separate books per entity', 'AI categorisation by entity type', 'Cross-entity reporting'],
    color: 'text-violet-400',
  },
  household: {
    icon: Users,
    title: 'Household Finance Hub',
    description: 'Manage your entire household finances together. Track shared expenses, split bills, and get a complete picture of your family\'s financial health.',
    highlights: ['Shared household budget', 'Bill splitting & tracking', 'Family financial overview', 'Multiple members'],
    color: 'text-blue-400',
  },
  reports: {
    icon: BarChart3,
    title: 'Tax Reports & SA103',
    description: 'Generate HMRC-ready tax reports automatically. Full SA103 box mapping, profit & loss statements, and export to PDF for your accountant or self-assessment.',
    highlights: ['SA103 self-employment mapping', 'Profit & Loss statements', 'PDF export for accountants', 'Tax year filtering'],
    color: 'text-amber-400',
  },
  projections: {
    icon: TrendingUp,
    title: 'Financial Projections',
    description: 'Forecast your financial future. Set savings goals, track debt payoff, and visualise your cash flow months ahead — so you\'re never caught off guard.',
    highlights: ['Cash flow forecasting', 'Savings goal tracker', 'Debt payoff calculator', 'Budget vs actual'],
    color: 'text-emerald-400',
  },
  properties: {
    icon: Home,
    title: 'Property Portfolio',
    description: 'Track your properties, mortgages, rental income and equity growth. Know your LTV, cash flow and total portfolio value at a glance.',
    highlights: ['Mortgage tracking', 'Rental income monitoring', 'Equity & LTV calculator', 'Portfolio overview'],
    color: 'text-teal-400',
  },
  product_calculator: {
    icon: Sparkles,
    title: 'Product Cost Calculator',
    description: 'Calculate your true cost of goods, set profitable prices, and track margins. Essential for anyone selling physical or digital products.',
    highlights: ['COGS & overhead calculation', 'Margin & markup pricing', 'Break-even analysis', 'Auto-saved products'],
    color: 'text-pink-400',
  },
  tax_timeline: {
    icon: CalendarClock,
    title: 'Tax Timeline & Reminders',
    description: 'Never miss an HMRC deadline again. Get personalised reminders for self-assessment, VAT returns, corporation tax, and more — based on your situation.',
    highlights: ['Personalised HMRC deadlines', 'VAT & CT reminders', 'Self-assessment calendar', 'Push notifications'],
    color: 'text-orange-400',
  },
  email: {
    icon: Mail,
    title: 'Email Client (IMAP/SMTP)',
    description: 'Connect your email inbox directly. Read, reply, and use AI to analyse financial emails, extract amounts, and create tasks — without leaving the platform.',
    highlights: ['IMAP/SMTP email sync', 'AI email analysis', 'Auto task creation', 'Attachment categorisation'],
    color: 'text-cyan-400',
  },
  providers: {
    icon: CreditCard,
    title: 'Open Banking & Providers',
    description: 'Connect your UK bank accounts via Open Banking and sync transactions automatically 3× daily. No more manual imports.',
    highlights: ['Open Banking sync (3×/day)', '24-month transaction history', 'Auto-categorisation', 'Multi-bank support'],
    color: 'text-green-400',
  },
  services: {
    icon: ShoppingBag,
    title: 'Professional Services',
    description: 'Access our marketplace of fixed-price professional services — NIN registration, company formation, visa support, and more — with transparent pricing and Stripe checkout.',
    highlights: ['Fixed-price packages', 'Stripe secure checkout', 'NIN, visa, company formation', 'Real-time delivery tracking'],
    color: 'text-purple-400',
  },
  insurance: {
    icon: Shield,
    title: 'Insurance Tracker',
    description: 'Track all your insurance policies in one place. Compare quotes, get AI advice on coverage, and never let a policy lapse unexpectedly.',
    highlights: ['Policy tracking & renewals', 'Quote comparison', 'AI insurance advisor', 'UK market price data'],
    color: 'text-red-400',
  },
  correspondence: {
    icon: FileText,
    title: 'Correspondence Manager',
    description: 'Organise all your official letters, HMRC notices, and important documents. AI reads and summarises them so you always know what action is needed.',
    highlights: ['AI document analysis', 'HMRC letter tracking', 'Action required flags', 'Smart filing system'],
    color: 'text-slate-400',
  },
};

const PLAN_PRICES: Record<string, string> = {
  pro: '£14.90/mo',
  business: '£29.90/mo',
  managed: '£99.90/mo',
};

const PLAN_LABELS: Record<string, string> = {
  pro: 'Pro',
  business: 'Business',
  managed: 'Managed',
};

interface UpgradeModalProps {
  permission: PermissionKey | null;
  onClose: () => void;
}

export function UpgradeModal({ permission, onClose }: UpgradeModalProps) {
  const router = useRouter();
  const info = permission ? MODULE_INFO[permission] : null;
  const requiredPlan = permission ? (MODULE_PLAN_REQUIRED[permission] || 'pro') : 'pro';

  const handleUpgrade = () => {
    onClose();
    router.push('/settings?upgrade=1');
  };

  if (!info || !permission) return null;

  const Icon = info.icon;

  return (
    <Dialog open={!!permission} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <Lock className="h-4 w-4 text-amber-400" />
            Upgrade to unlock this feature
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Module preview */}
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                <Icon className={`h-5 w-5 ${info.color}`} />
              </div>
              <div>
                <h3 className="font-semibold text-sm">{info.title}</h3>
                <Badge variant="outline" className="text-[10px] mt-0.5 border-amber-400/40 text-amber-400">
                  Requires {PLAN_LABELS[requiredPlan]} plan
                </Badge>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{info.description}</p>
            <ul className="space-y-1.5">
              {info.highlights.map((h, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle2 className={`h-3.5 w-3.5 flex-shrink-0 ${info.color}`} />
                  {h}
                </li>
              ))}
            </ul>
          </div>

          {/* Plan CTA */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">{PLAN_LABELS[requiredPlan]} Plan</p>
                <p className="text-xs text-muted-foreground">Includes this + many more features</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-amber-400">{PLAN_PRICES[requiredPlan]}</p>
                <p className="text-[10px] text-muted-foreground">7-day free trial</p>
              </div>
            </div>
            <Button onClick={handleUpgrade} className="w-full gap-2 bg-amber-500 hover:bg-amber-400 text-slate-900 font-semibold">
              <Zap className="h-4 w-4" />
              Upgrade to {PLAN_LABELS[requiredPlan]} — {PLAN_PRICES[requiredPlan]}
              <ArrowRight className="h-4 w-4 ml-auto" />
            </Button>
            <p className="text-[10px] text-center text-muted-foreground">Cancel anytime · No commitment · Start free</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
