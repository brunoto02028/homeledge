'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { LoadingSpinner } from '@/components/loading-spinner';
import { useTranslation } from '@/lib/i18n';
import {
  User, Phone, Calendar, Briefcase, Building2, CheckCircle, ArrowRight,
  ArrowLeft, Loader2, PoundSterling, Sparkles, FileSpreadsheet, Receipt,
  KeyRound, TrendingUp, BarChart3, Camera, Rocket,
} from 'lucide-react';

const EMPLOYMENT_OPTIONS = [
  { value: 'employed', label: 'Employed', desc: 'Working for an employer with PAYE', icon: Briefcase },
  { value: 'self_employed', label: 'Self-Employed', desc: 'Running your own business as a sole trader', icon: User },
  { value: 'company_director', label: 'Company Director', desc: 'Director of a limited company', icon: Building2 },
  { value: 'employed_and_self_employed', label: 'Both Employed & Self-Employed', desc: 'PAYE job plus side business', icon: Briefcase },
  { value: 'unemployed', label: 'Currently Unemployed', desc: 'Between jobs or looking for work', icon: User },
  { value: 'retired', label: 'Retired', desc: 'Receiving pension income', icon: Calendar },
  { value: 'student', label: 'Student', desc: 'In full-time education', icon: User },
];

const BUSINESS_TYPES = [
  { value: 'food_drink', label: 'Food & Drink' },
  { value: 'retail', label: 'Retail / E-commerce' },
  { value: 'services', label: 'Professional Services' },
  { value: 'construction', label: 'Construction / Trades' },
  { value: 'creative', label: 'Creative / Design' },
  { value: 'technology', label: 'Technology / IT' },
  { value: 'health_beauty', label: 'Health & Beauty' },
  { value: 'education', label: 'Education / Tutoring' },
  { value: 'transport', label: 'Transport / Delivery' },
  { value: 'property', label: 'Property / Lettings' },
  { value: 'cleaning', label: 'Cleaning Services' },
  { value: 'other', label: 'Other' },
];

const FEATURE_OPTIONS = [
  { key: 'statements', label: 'Bank Statements', desc: 'Upload and categorise transactions', icon: FileSpreadsheet },
  { key: 'invoices', label: 'Invoices', desc: 'Create and manage invoices', icon: Receipt },
  { key: 'bills', label: 'Bills Tracker', desc: 'Track recurring bills and payments', icon: PoundSterling },
  { key: 'documents', label: 'Capture & Classify', desc: 'Scan, upload and auto-classify documents', icon: Camera },
  { key: 'vault', label: 'Secure Vault', desc: 'Store passwords and credentials', icon: KeyRound },
  { key: 'projections', label: 'Projections', desc: 'Financial forecasting and goals', icon: TrendingUp },
  { key: 'reports', label: 'HMRC Reports', desc: 'Tax calculations and reports', icon: BarChart3 },
];

const STEPS = ['Welcome', 'Employment', 'Business', 'Features', 'Complete'];

export function OnboardingClient() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const router = useRouter();
  const { data: session, update: updateSession } = useSession();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    dateOfBirth: '',
    employmentStatus: '',
    businessName: '',
    businessType: '',
  });
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([
    'statements', 'bills', 'reports',
  ]);

  useEffect(() => {
    fetch('/api/onboarding')
      .then(r => r.json())
      .then(d => {
        if (d.onboardingCompleted) {
          router.push('/');
          return;
        }
        setForm(prev => ({
          ...prev,
          fullName: d.fullName || '',
          phone: d.phone || '',
          dateOfBirth: d.dateOfBirth ? new Date(d.dateOfBirth).toISOString().split('T')[0] : '',
          employmentStatus: d.employmentStatus || '',
          businessName: d.businessName || '',
          businessType: d.businessType || '',
        }));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [router]);

  const needsBusiness = ['self_employed', 'company_director', 'employed_and_self_employed'].includes(form.employmentStatus);

  const totalSteps = needsBusiness ? 5 : 4;
  const stepLabels = needsBusiness ? STEPS : STEPS.filter(s => s !== 'Business');

  const getActualStep = () => {
    if (!needsBusiness && step >= 2) return step + 1;
    return step;
  };

  const canProceed = () => {
    const actual = getActualStep();
    switch (actual) {
      case 0: return form.fullName.length >= 2;
      case 1: return !!form.employmentStatus;
      case 2: return form.businessName.length >= 2;
      case 3: return selectedFeatures.length > 0;
      default: return true;
    }
  };

  const handleNext = () => {
    if (step < totalSteps - 1) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/onboarding', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          onboardingCompleted: true,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);

      // Store selected features preference
      localStorage.setItem('homeledger-features', JSON.stringify(selectedFeatures));

      await updateSession({ name: form.fullName });
      toast({ title: 'Welcome to HomeLedger! 🎉', description: 'Your account is set up and ready to go.' });

      // Small delay for the toast to show
      setTimeout(() => router.push('/'), 1000);
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

  const actualStep = getActualStep();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center">
              <PoundSterling className="h-5 w-5 text-slate-900" />
            </div>
            <span className="font-bold text-lg">HomeLedger</span>
          </div>
          <div className="flex items-center gap-2">
            {stepLabels.map((label, i) => (
              <div key={label} className="flex items-center gap-1">
                <div className={`h-2 w-2 rounded-full transition-colors ${
                  i < step ? 'bg-emerald-500' : i === step ? 'bg-primary' : 'bg-muted'
                }`} />
                <span className={`text-xs hidden sm:inline ${i === step ? 'font-medium' : 'text-muted-foreground'}`}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8">
            {/* Step 0: Welcome / Personal Info */}
            {actualStep === 0 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <h1 className="text-2xl font-bold">Welcome to HomeLedger!</h1>
                  <p className="text-muted-foreground mt-2">
                    Let&apos;s set up your account in a few quick steps so we can personalise your experience.
                  </p>
                </div>

                <div className="grid gap-4">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <User className="h-4 w-4" /> Full Name
                    </Label>
                    <Input
                      value={form.fullName}
                      onChange={e => setForm(f => ({ ...f, fullName: e.target.value }))}
                      placeholder="Your full name"
                      autoFocus
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Phone className="h-4 w-4" /> Phone Number
                        <span className="text-xs text-muted-foreground">(optional)</span>
                      </Label>
                      <Input
                        type="tel"
                        value={form.phone}
                        onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                        placeholder="+44 7700 900000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" /> Date of Birth
                        <span className="text-xs text-muted-foreground">(optional)</span>
                      </Label>
                      <Input
                        type="date"
                        value={form.dateOfBirth}
                        onChange={e => setForm(f => ({ ...f, dateOfBirth: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Employment Status */}
            {actualStep === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <div className="h-16 w-16 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto mb-4">
                    <Briefcase className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h1 className="text-2xl font-bold">What&apos;s your employment status?</h1>
                  <p className="text-muted-foreground mt-2">
                    This helps us tailor features like tax reports and categories to your situation.
                  </p>
                </div>

                <div className="grid gap-2">
                  {EMPLOYMENT_OPTIONS.map(opt => {
                    const Icon = opt.icon;
                    const selected = form.employmentStatus === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => setForm(f => ({ ...f, employmentStatus: opt.value }))}
                        className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                          selected
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-muted-foreground/30'
                        }`}
                      >
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          selected ? 'bg-primary/10' : 'bg-muted'
                        }`}>
                          <Icon className={`h-5 w-5 ${selected ? 'text-primary' : 'text-muted-foreground'}`} />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{opt.label}</p>
                          <p className="text-xs text-muted-foreground">{opt.desc}</p>
                        </div>
                        {selected && <CheckCircle className="h-5 w-5 text-primary ml-auto flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 2: Business Info (conditional) */}
            {actualStep === 2 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <div className="h-16 w-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
                    <Building2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h1 className="text-2xl font-bold">Tell us about your business</h1>
                  <p className="text-muted-foreground mt-2">
                    We&apos;ll set up categories and reports tailored to your industry.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Business Name</Label>
                    <Input
                      value={form.businessName}
                      onChange={e => setForm(f => ({ ...f, businessName: e.target.value }))}
                      placeholder="e.g. Maria's Kitchen, Smith Consulting"
                      autoFocus
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>What type of business?</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {BUSINESS_TYPES.map(bt => {
                        const selected = form.businessType === bt.value;
                        return (
                          <button
                            key={bt.value}
                            onClick={() => setForm(f => ({ ...f, businessType: bt.value }))}
                            className={`p-3 rounded-lg border-2 text-sm font-medium transition-all text-center ${
                              selected
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:border-muted-foreground/30'
                            }`}
                          >
                            {bt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Feature Selection */}
            {actualStep === 3 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <div className="h-16 w-16 rounded-2xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
                    <BarChart3 className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h1 className="text-2xl font-bold">What would you like to use?</h1>
                  <p className="text-muted-foreground mt-2">
                    Select the features you&apos;re most interested in. You can always change this later.
                  </p>
                </div>

                <div className="grid gap-2">
                  {FEATURE_OPTIONS.map(feat => {
                    const Icon = feat.icon;
                    const selected = selectedFeatures.includes(feat.key);
                    return (
                      <button
                        key={feat.key}
                        onClick={() => toggleFeature(feat.key)}
                        className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all ${
                          selected
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-muted-foreground/30'
                        }`}
                      >
                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          selected ? 'bg-primary/10' : 'bg-muted'
                        }`}>
                          <Icon className={`h-5 w-5 ${selected ? 'text-primary' : 'text-muted-foreground'}`} />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{feat.label}</p>
                          <p className="text-xs text-muted-foreground">{feat.desc}</p>
                        </div>
                        {selected && <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 4: Complete */}
            {actualStep === 4 && (
              <div className="space-y-6 text-center">
                <div className="mb-4">
                  <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-500 flex items-center justify-center mx-auto mb-4">
                    <Rocket className="h-10 w-10 text-white" />
                  </div>
                  <h1 className="text-2xl font-bold">You&apos;re all set!</h1>
                  <p className="text-muted-foreground mt-2">
                    Here&apos;s a summary of your setup. Click &quot;Get Started&quot; to begin.
                  </p>
                </div>

                <div className="grid gap-3 text-left max-w-md mx-auto">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                    <User className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Name</p>
                      <p className="font-medium text-sm">{form.fullName}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                    <Briefcase className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Employment</p>
                      <p className="font-medium text-sm">
                        {EMPLOYMENT_OPTIONS.find(o => o.value === form.employmentStatus)?.label || '—'}
                      </p>
                    </div>
                  </div>

                  {needsBusiness && form.businessName && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Business</p>
                        <p className="font-medium text-sm">
                          {form.businessName}
                          {form.businessType && ` — ${BUSINESS_TYPES.find(b => b.value === form.businessType)?.label}`}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border">
                    <BarChart3 className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Features</p>
                      <p className="font-medium text-sm">
                        {selectedFeatures.map(f => FEATURE_OPTIONS.find(o => o.key === f)?.label).join(', ')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={step === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>

              <div className="text-xs text-muted-foreground">
                Step {step + 1} of {totalSteps}
              </div>

              {actualStep === 4 ? (
                <Button onClick={handleComplete} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Rocket className="h-4 w-4 mr-2" />}
                  Get Started
                </Button>
              ) : (
                <Button onClick={handleNext} disabled={!canProceed()}>
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
