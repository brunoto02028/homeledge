'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/ui/use-toast';
import { LoadingSpinner } from '@/components/loading-spinner';
import {
  User, Building2, CheckCircle2, ArrowRight, ArrowLeft, Loader2,
  Sparkles, FileSpreadsheet, Receipt, KeyRound, TrendingUp, BarChart3,
  Camera, Rocket, Landmark, CreditCard, ShieldCheck, Users, PiggyBank,
  Wallet, CircleDollarSign, Heart, GraduationCap, Clock, Briefcase, Store,
} from 'lucide-react';

// ─── Step 1: Who Are You? ───
const PROFILE_OPTIONS = [
  {
    value: 'individual',
    emoji: '👤',
    label: 'Just Me / Family',
    desc: 'I want to manage my personal or family finances — track spending, save money, and stay organised.',
    example: 'e.g. keeping track of bills, groceries, savings goals',
    color: 'from-blue-500 to-blue-600',
    lightBg: 'bg-blue-50 dark:bg-blue-950/40',
    border: 'border-blue-400',
    icon: Heart,
  },
  {
    value: 'sole_trader',
    emoji: '💼',
    label: 'Self-Employed / Freelancer',
    desc: 'I work for myself and need to keep my business income and expenses separate for tax purposes.',
    example: 'e.g. tracking invoices, receipts, tax-deductible expenses',
    color: 'from-emerald-500 to-emerald-600',
    lightBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    border: 'border-emerald-400',
    icon: Briefcase,
  },
  {
    value: 'limited_company',
    emoji: '🏢',
    label: 'Company Director (Ltd)',
    desc: 'I run a limited company and need tools for Corporation Tax, payroll, and Companies House compliance.',
    example: 'e.g. CT600 reports, dividend tracking, company accounts',
    color: 'from-purple-500 to-purple-600',
    lightBg: 'bg-purple-50 dark:bg-purple-950/40',
    border: 'border-purple-400',
    icon: Building2,
  },
  {
    value: 'cic_charity',
    emoji: '🤝',
    label: 'CIC / Charity / Non-Profit',
    desc: 'I manage finances for a community interest company, charity, or non-profit organisation.',
    example: 'e.g. grant tracking, donor management, compliance reports',
    color: 'from-amber-500 to-amber-600',
    lightBg: 'bg-amber-50 dark:bg-amber-950/40',
    border: 'border-amber-400',
    icon: Users,
  },
];

// ─── Step 2: What Do You Need? ───
const FEATURE_OPTIONS = [
  {
    key: 'receipts',
    emoji: '📸',
    label: 'Scan Receipts & Bills',
    desc: 'Take a photo of any receipt or bill and we\'ll read it automatically. No more shoe boxes full of paper!',
    icon: Camera,
    color: 'from-rose-500 to-pink-500',
  },
  {
    key: 'statements',
    emoji: '🏦',
    label: 'Bank Statements',
    desc: 'Upload your bank statements and we\'ll sort every transaction into categories like "Food", "Transport", "Rent".',
    icon: FileSpreadsheet,
    color: 'from-blue-500 to-cyan-500',
  },
  {
    key: 'reports',
    emoji: '📊',
    label: 'Reports & Tax Help',
    desc: 'See clear charts of where your money goes. Get reports ready for tax season — no accountant needed!',
    icon: BarChart3,
    color: 'from-violet-500 to-purple-500',
  },
  {
    key: 'invoices',
    emoji: '🧾',
    label: 'Create Invoices',
    desc: 'Build professional invoices in seconds and send them to your clients. Track who has paid and who hasn\'t.',
    icon: Receipt,
    color: 'from-emerald-500 to-teal-500',
  },
  {
    key: 'budget',
    emoji: '🎯',
    label: 'Budget & Savings Goals',
    desc: 'Set spending limits for things like food or entertainment. Create savings goals and watch your progress!',
    icon: PiggyBank,
    color: 'from-amber-500 to-orange-500',
  },
  {
    key: 'banking',
    emoji: '🔗',
    label: 'Connect My Bank',
    desc: 'Securely link your bank account so transactions come in automatically — no more manual uploads.',
    icon: CreditCard,
    color: 'from-indigo-500 to-blue-500',
  },
  {
    key: 'vault',
    emoji: '🔒',
    label: 'Secure Vault',
    desc: 'Store important passwords, API keys, and sensitive documents in an encrypted vault only you can access.',
    icon: KeyRound,
    color: 'from-gray-500 to-slate-600',
  },
  {
    key: 'compliance',
    emoji: '🏛️',
    label: 'Companies House & HMRC',
    desc: 'File company accounts, manage directors, and stay compliant with UK regulations — all in one place.',
    icon: Landmark,
    color: 'from-sky-500 to-blue-600',
  },
];

const STEP_LABELS = ['About You', 'Your Tools', 'Ready!'];

export function OnboardingClient() {
  const { toast } = useToast();
  const router = useRouter();
  const { update: updateSession } = useSession();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Step 1 state
  const [entityType, setEntityType] = useState('');
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');

  // Step 2 state
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/onboarding')
      .then(r => r.json())
      .then(d => {
        if (d.onboardingCompleted) {
          router.push('/dashboard');
          return;
        }
        setFullName(d.fullName || '');
        if (d.businessName) setBusinessName(d.businessName);
        if (d.onboardingProfile?.entityType) setEntityType(d.onboardingProfile.entityType);
        if (d.onboardingProfile?.selectedFeatures?.length) {
          setSelectedFeatures(d.onboardingProfile.selectedFeatures);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  const needsBusinessName = ['sole_trader', 'limited_company', 'cic_charity'].includes(entityType);

  const canProceed = () => {
    switch (step) {
      case 0: return !!entityType && fullName.length >= 2 && (!needsBusinessName || businessName.length >= 2);
      case 1: return selectedFeatures.length > 0;
      default: return true;
    }
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      // Map entity type to employment status for backwards compat
      const empMap: Record<string, string> = {
        individual: 'employed',
        sole_trader: 'self_employed',
        limited_company: 'company_director',
        cic_charity: 'company_director',
      };

      const res = await fetch('/api/onboarding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          businessName: needsBusinessName ? businessName : undefined,
          employmentStatus: empMap[entityType] || 'employed',
          onboardingCompleted: true,
          entityType,
          selectedFeatures,
          experienceLevel: 'beginner',
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);

      localStorage.setItem('homeledger-features', JSON.stringify(selectedFeatures));
      await updateSession({ name: fullName });

      toast({ title: 'Welcome to Clarity & Co! 🎉', description: 'Your personalised dashboard is ready.' });
      setTimeout(() => router.push('/dashboard'), 800);
    } catch (err: any) {
      toast({ title: err.message || 'Failed to save', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const toggleFeature = (key: string) => {
    setSelectedFeatures(prev =>
      prev.includes(key) ? prev.filter(f => f !== key) : [...prev, key]
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30 flex flex-col">
      {/* ─── Header ─── */}
      <div className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg overflow-hidden shadow-md shadow-amber-500/20">
              <img src="/site-logo.png" alt="Clarity & Co" className="h-full w-full object-contain" />
            </div>
            <span className="font-bold text-lg tracking-tight">Clarity & Co</span>
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-3">
            {STEP_LABELS.map((label, i) => (
              <div key={label} className="flex items-center gap-2">
                <div className={`flex items-center justify-center h-7 w-7 rounded-full text-xs font-bold transition-all duration-300 ${
                  i < step
                    ? 'bg-emerald-500 text-white scale-90'
                    : i === step
                    ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                </div>
                <span className={`text-sm hidden sm:inline transition-colors ${
                  i === step ? 'font-semibold text-foreground' : 'text-muted-foreground'
                }`}>
                  {label}
                </span>
                {i < STEP_LABELS.length - 1 && (
                  <div className={`w-8 h-0.5 rounded-full hidden sm:block ${
                    i < step ? 'bg-emerald-500' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Content ─── */}
      <div className="flex-1 flex items-start justify-center p-6 pt-8">
        <div className="w-full max-w-3xl">

          {/* ════════════════════════════════════════ */}
          {/* STEP 1: About You                       */}
          {/* ════════════════════════════════════════ */}
          {step === 0 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              {/* Hero */}
              <div className="text-center">
                <div className="inline-flex items-center justify-center h-20 w-20 rounded-3xl bg-gradient-to-br from-primary to-primary/60 shadow-xl shadow-primary/20 mb-5">
                  <Sparkles className="h-10 w-10 text-primary-foreground" />
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight">Welcome to Clarity & Co!</h1>
                <p className="text-muted-foreground mt-3 text-lg max-w-md mx-auto leading-relaxed">
                  Let&apos;s personalise your experience. It only takes <strong>60 seconds</strong>.
                </p>
              </div>

              {/* Name input */}
              <div className="max-w-md mx-auto">
                <label className="block text-sm font-semibold mb-2">
                  <User className="h-4 w-4 inline mr-1.5 opacity-60" />
                  What&apos;s your name?
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Type your full name..."
                  autoFocus
                  className="w-full px-4 py-3 rounded-xl border-2 border-border bg-card text-base font-medium
                    focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                />
              </div>

              {/* Entity type — the main choice */}
              <div>
                <p className="text-center text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                  What describes you best?
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {PROFILE_OPTIONS.map(opt => {
                    const selected = entityType === opt.value;
                    const Icon = opt.icon;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setEntityType(opt.value)}
                        className={`relative flex flex-col gap-3 p-5 rounded-2xl border-2 text-left transition-all duration-200 group
                          ${selected
                            ? `${opt.border} ${opt.lightBg} shadow-lg scale-[1.02]`
                            : 'border-border hover:border-muted-foreground/40 hover:shadow-md bg-card'
                          }`}
                      >
                        {/* Checkmark */}
                        {selected && (
                          <div className="absolute top-3 right-3">
                            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                          </div>
                        )}

                        {/* Icon + emoji */}
                        <div className="flex items-center gap-3">
                          <div className={`flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br ${opt.color} shadow-md`}>
                            <Icon className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <span className="text-2xl mr-2">{opt.emoji}</span>
                            <span className="font-bold text-base">{opt.label}</span>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-sm text-muted-foreground leading-relaxed">{opt.desc}</p>
                        <p className="text-xs text-muted-foreground/70 italic">{opt.example}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Business name (conditional) */}
              {needsBusinessName && (
                <div className="max-w-md mx-auto animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <label className="block text-sm font-semibold mb-2">
                    <Store className="h-4 w-4 inline mr-1.5 opacity-60" />
                    What&apos;s your business called?
                  </label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={e => setBusinessName(e.target.value)}
                    placeholder="e.g. Maria's Kitchen, Smith Consulting Ltd..."
                    className="w-full px-4 py-3 rounded-xl border-2 border-border bg-card text-base font-medium
                      focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                  />
                </div>
              )}
            </div>
          )}

          {/* ════════════════════════════════════════ */}
          {/* STEP 2: What Do You Need?               */}
          {/* ════════════════════════════════════════ */}
          {step === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center">
                <div className="inline-flex items-center justify-center h-20 w-20 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 shadow-xl shadow-amber-500/20 mb-5">
                  <Wallet className="h-10 w-10 text-white" />
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight">What do you need help with?</h1>
                <p className="text-muted-foreground mt-3 text-lg max-w-lg mx-auto leading-relaxed">
                  Pick the tools you&apos;d like to use. Don&apos;t worry — you can always add more later!
                </p>
                <p className="mt-2 text-sm text-muted-foreground/70">
                  Tap a card to select or deselect it
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {FEATURE_OPTIONS.map(feat => {
                  const selected = selectedFeatures.includes(feat.key);
                  const Icon = feat.icon;
                  return (
                    <button
                      key={feat.key}
                      onClick={() => toggleFeature(feat.key)}
                      className={`relative flex items-start gap-4 p-4 rounded-2xl border-2 text-left transition-all duration-200
                        ${selected
                          ? 'border-primary bg-primary/5 shadow-md scale-[1.01]'
                          : 'border-border hover:border-muted-foreground/30 hover:shadow-sm bg-card'
                        }`}
                    >
                      {/* Selection indicator */}
                      <div className={`flex-shrink-0 flex items-center justify-center h-11 w-11 rounded-xl bg-gradient-to-br ${feat.color} shadow-md transition-all
                        ${selected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{feat.emoji}</span>
                          <span className="font-bold text-sm">{feat.label}</span>
                          {selected && <CheckCircle2 className="h-4 w-4 text-emerald-500 ml-auto flex-shrink-0" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{feat.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {selectedFeatures.length > 0 && (
                <div className="text-center">
                  <p className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                    <CheckCircle2 className="h-4 w-4 inline mr-1" />
                    {selectedFeatures.length} tool{selectedFeatures.length !== 1 ? 's' : ''} selected — great choices!
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ════════════════════════════════════════ */}
          {/* STEP 3: Ready!                          */}
          {/* ════════════════════════════════════════ */}
          {step === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center">
                <div className="inline-flex items-center justify-center h-24 w-24 rounded-3xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-2xl shadow-emerald-500/30 mb-5">
                  <Rocket className="h-12 w-12 text-white" />
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight">
                  You&apos;re all set, {fullName.split(' ')[0]}!
                </h1>
                <p className="text-muted-foreground mt-3 text-lg max-w-md mx-auto leading-relaxed">
                  Here&apos;s what we&apos;ve set up for you. Your personalised dashboard is ready to go.
                </p>
              </div>

              {/* Summary cards */}
              <div className="max-w-lg mx-auto space-y-3">
                {/* Profile */}
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border shadow-sm">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-md">
                    <User className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Your Profile</p>
                    <p className="font-bold">{fullName}</p>
                    <p className="text-sm text-muted-foreground">
                      {PROFILE_OPTIONS.find(p => p.value === entityType)?.label || 'Individual'}
                      {businessName && ` — ${businessName}`}
                    </p>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 ml-auto" />
                </div>

                {/* Selected tools */}
                <div className="flex items-start gap-4 p-4 rounded-2xl bg-card border border-border shadow-sm">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md flex-shrink-0">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Your Tools</p>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {selectedFeatures.map(key => {
                        const feat = FEATURE_OPTIONS.find(f => f.key === key);
                        if (!feat) return null;
                        return (
                          <span key={key} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium border border-primary/20">
                            <span>{feat.emoji}</span> {feat.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                  <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                </div>

                {/* What's not included */}
                {FEATURE_OPTIONS.filter(f => !selectedFeatures.includes(f.key)).length > 0 && (
                  <div className="p-4 rounded-2xl bg-muted/50 border border-border/50">
                    <p className="text-xs text-muted-foreground font-medium mb-2">
                      <TrendingUp className="h-3.5 w-3.5 inline mr-1" />
                      EXPLORE LATER — More tools available:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {FEATURE_OPTIONS.filter(f => !selectedFeatures.includes(f.key)).map(feat => (
                        <span key={feat.key} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-background text-muted-foreground border border-border">
                          <span>{feat.emoji}</span> {feat.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Security note */}
              <div className="max-w-lg mx-auto flex items-center gap-3 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                <ShieldCheck className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <strong className="text-foreground">Your data is safe.</strong> Everything is encrypted and stored securely. We never share your information with third parties.
                </p>
              </div>
            </div>
          )}

          {/* ─── Navigation ─── */}
          <div className="flex items-center justify-between mt-10 pt-6 border-t border-border/50">
            <button
              onClick={() => setStep(s => Math.max(0, s - 1))}
              disabled={step === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-border bg-card text-sm font-medium
                hover:bg-muted/50 disabled:opacity-30 disabled:pointer-events-none transition-all"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            <div className="flex items-center gap-1.5">
              {STEP_LABELS.map((_, i) => (
                <div
                  key={i}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    i === step ? 'w-8 bg-primary' : i < step ? 'w-2 bg-emerald-500' : 'w-2 bg-muted'
                  }`}
                />
              ))}
            </div>

            {step === 2 ? (
              <button
                onClick={handleComplete}
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-white text-sm font-bold
                  hover:from-emerald-600 hover:to-emerald-700 disabled:opacity-50 shadow-lg shadow-emerald-500/20 transition-all"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
                Let&apos;s Go!
              </button>
            ) : (
              <button
                onClick={() => setStep(s => Math.min(2, s + 1))}
                disabled={!canProceed()}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-bold
                  hover:bg-primary/90 disabled:opacity-30 disabled:pointer-events-none shadow-lg shadow-primary/20 transition-all"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
