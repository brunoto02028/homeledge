'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { LoadingSpinner } from '@/components/loading-spinner';
import {
  Settings, User, Lock, Palette, BarChart3, Loader2, CheckCircle, Mail,
  Calendar, Shield, FileText, Receipt, Landmark, KeyRound, ArrowLeftRight, Link2, Download, Image, Trash2,
  CreditCard, Sparkles, Crown, Zap, ExternalLink, Brain, ShieldCheck, Cpu, Eye,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: string;
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt: string | null;
  plan?: string;
  idVerified?: boolean;
  idVerifiedAt?: string;
  amlRiskLevel?: string;
  amlScreenedAt?: string;
  _count: {
    bills: number;
    invoices: number;
    bankStatements: number;
    entities: number;
    lifeEvents: number;
    vaultEntries: number;
    sharedLinks: number;
    recurringTransfers: number;
  };
}

export function SettingsClient() {
  const { toast } = useToast();
  const { data: session, update: updateSession } = useSession();
  const { theme, setTheme } = useTheme();
  const { t, locale } = useTranslation();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  useEffect(() => {
    // Load logo from server
    fetch('/api/settings/logo')
      .then(r => r.json())
      .then(d => { if (d.logoUrl) setLogoUrl(d.logoUrl); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(d => {
        setProfile(d);
        setFullName(d.fullName || '');
      })
      .catch(() => toast({ title: t('common.errorLoading'), variant: 'destructive' }))
      .finally(() => setLoading(false));
  }, []);

  const handleUpdateProfile = async () => {
    if (!fullName || fullName.length < 2) {
      toast({ title: t('settings.nameMinLength'), variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast({ title: t('settings.profileUpdated') });
      await updateSession({ name: fullName });
    } catch (err: any) {
      toast({ title: err.message || 'Failed', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 8) {
      toast({ title: t('settings.passwordMinLength'), variant: 'destructive' });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: t('settings.passwordMismatch'), variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast({ title: t('settings.passwordChanged') });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast({ title: err.message || 'Failed', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!profile) return null;

  const stats = [
    { label: t('settings.statsEntities'), value: profile._count.entities, icon: Landmark, gradient: 'bg-gradient-to-br from-blue-500 to-indigo-600' },
    { label: t('settings.statsStatements'), value: profile._count.bankStatements, icon: FileText, gradient: 'bg-gradient-to-br from-emerald-500 to-green-600' },
    { label: t('settings.statsInvoices'), value: profile._count.invoices, icon: FileText, gradient: 'bg-gradient-to-br from-violet-500 to-purple-600' },
    { label: t('settings.statsBills'), value: profile._count.bills, icon: Receipt, gradient: 'bg-gradient-to-br from-amber-500 to-orange-600' },
    { label: t('settings.statsVault'), value: profile._count.vaultEntries, icon: KeyRound, gradient: 'bg-gradient-to-br from-slate-600 to-slate-800' },
    { label: t('settings.statsTransfers'), value: profile._count.recurringTransfers, icon: ArrowLeftRight, gradient: 'bg-gradient-to-br from-cyan-500 to-blue-600' },
    { label: t('settings.statsShared'), value: profile._count.sharedLinks, icon: Link2, gradient: 'bg-gradient-to-br from-pink-500 to-rose-600' },
    { label: t('settings.statsLifeEvents'), value: profile._count.lifeEvents, icon: Calendar, gradient: 'bg-gradient-to-br from-teal-500 to-emerald-600' },
  ];

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Settings className="h-7 w-7 text-primary" />
          {t('settings.title')}
        </h1>
        <p className="text-muted-foreground mt-1">{t('settings.subtitle')}</p>
      </div>

      {/* Profile Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-5 w-5" /> {t('settings.profile')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white text-xl font-bold">
              {profile.fullName.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-lg">{profile.fullName}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-3.5 w-3.5" /> {profile.email}
                {profile.emailVerified && <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">{profile.role}</Badge>
                <span className="text-xs text-muted-foreground">
                  {t('settings.joined')} {new Date(profile.createdAt).toLocaleDateString(locale === 'pt-BR' ? 'pt-BR' : 'en-GB')}
                </span>
              </div>
            </div>
          </div>

          <div className="grid gap-3">
            <div className="space-y-1.5">
              <Label>{t('settings.fullName')}</Label>
              <div className="flex gap-2">
                <Input value={fullName} onChange={e => setFullName(e.target.value)} />
                <Button onClick={handleUpdateProfile} disabled={saving || fullName === profile.fullName}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : t('common.save')}
                </Button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{t('settings.emailLabel')}</Label>
              <Input value={profile.email} disabled className="bg-muted" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Identity Verification */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Shield className="h-5 w-5" /> Identity Verification
          </CardTitle>
        </CardHeader>
        <CardContent>
          {profile.idVerified ? (
            <div className="flex items-center gap-4 p-4 rounded-lg bg-green-500/10 border border-green-500/20">
              <CheckCircle className="h-10 w-10 text-green-500 flex-shrink-0" />
              <div>
                <p className="font-semibold text-green-500">Identity Verified</p>
                <p className="text-sm text-muted-foreground">
                  Verified on {profile.idVerifiedAt ? new Date(profile.idVerifiedAt).toLocaleDateString(locale === 'pt-BR' ? 'pt-BR' : 'en-GB') : 'N/A'}
                  {profile.amlRiskLevel && (
                    <span className="ml-2">
                      &middot; AML Risk: <Badge variant={profile.amlRiskLevel === 'low' ? 'secondary' : 'destructive'} className="text-xs ml-1">{profile.amlRiskLevel}</Badge>
                    </span>
                  )}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <Shield className="h-10 w-10 text-amber-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold">Identity Not Verified</p>
                <p className="text-sm text-muted-foreground">
                  Verify your identity to unlock full features and build trust with your clients.
                </p>
              </div>
              <a
                href="/verify-identity"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors flex-shrink-0"
              >
                <Shield className="h-4 w-4" />
                Verify Now
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Categorisation Intelligence Mode */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" /> Categorisation Mode
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">Choose how the 4-layer categorisation engine handles your transactions.</p>
          {[
            { mode: 'conservative', icon: Eye, label: 'Conservative', desc: 'Nothing auto-approved. Every transaction needs your review.', color: 'border-amber-500/30 bg-amber-500/5' },
            { mode: 'smart', icon: Brain, label: 'Smart (Recommended)', desc: 'Auto-approves high confidence (≥90%). Suggests 70-90%. Review below 70%.', color: 'border-purple-500/30 bg-purple-500/5' },
            { mode: 'autonomous', icon: Cpu, label: 'Autonomous', desc: 'AI governs everything. You only audit exceptions and anomalies.', color: 'border-blue-500/30 bg-blue-500/5' },
          ].map(({ mode, icon: Icon, label, desc, color }) => {
            const isSelected = (profile as any)?.categorizationMode === mode || (!((profile as any)?.categorizationMode) && mode === 'smart');
            return (
              <button
                key={mode}
                onClick={async () => {
                  try {
                    await fetch('/api/settings', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ categorizationMode: mode }) });
                    setProfile(p => p ? { ...p, categorizationMode: mode } as any : p);
                    toast({ title: `Categorisation mode set to ${label}` });
                  } catch { toast({ title: 'Failed to update', variant: 'destructive' }); }
                }}
                className={`w-full text-left p-3 rounded-lg border transition-all ${isSelected ? color + ' ring-2 ring-purple-500/50' : 'border-border hover:bg-muted/30'}`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-5 w-5 flex-shrink-0 ${isSelected ? 'text-purple-500' : 'text-muted-foreground'}`} />
                  <div>
                    <p className={`text-sm font-medium ${isSelected ? '' : 'text-muted-foreground'}`}>{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                  {isSelected && <CheckCircle className="h-4 w-4 text-purple-500 ml-auto flex-shrink-0" />}
                </div>
              </button>
            );
          })}
        </CardContent>
      </Card>

      {/* Logo / Branding */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Image className="h-5 w-5" /> {t('settings.logo')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t('settings.logoHint')}
          </p>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-xl border-2 border-dashed border-border flex items-center justify-center overflow-hidden bg-muted/30">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="h-full w-full object-contain" />
              ) : (
                <Image className="h-6 w-6 text-muted-foreground/40" />
              )}
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={uploadingLogo}
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = 'image/*';
                    input.onchange = async (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (!file) return;
                      if (file.size > 500 * 1024) {
                        toast({ title: t('settings.imageTooLarge'), variant: 'destructive' });
                        return;
                      }
                      setUploadingLogo(true);
                      const reader = new FileReader();
                      reader.onload = async () => {
                        const dataUrl = reader.result as string;
                        try {
                          const res = await fetch('/api/settings/logo', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ dataUrl }),
                          });
                          const data = await res.json();
                          if (res.ok && data.logoUrl) {
                            setLogoUrl(data.logoUrl);
                            toast({ title: t('settings.logoSaved') });
                          } else {
                            toast({ title: data.error || 'Failed to upload', variant: 'destructive' });
                          }
                        } catch {
                          toast({ title: 'Upload failed', variant: 'destructive' });
                        }
                        setUploadingLogo(false);
                      };
                      reader.readAsDataURL(file);
                    };
                    input.click();
                  }}
                >
                  {uploadingLogo ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Image className="h-4 w-4 mr-1" />}
                  {t('settings.uploadLogo')}
                </Button>
                {logoUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        await fetch('/api/settings/logo', { method: 'DELETE' });
                        setLogoUrl(null);
                        toast({ title: t('settings.logoRemoved') });
                      } catch {
                        toast({ title: 'Failed to remove logo', variant: 'destructive' });
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-1" /> {t('settings.removeLogo')}
                  </Button>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">{t('settings.logoFormat')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="h-5 w-5" /> {t('settings.changePassword')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">{t('settings.passwordHint')}</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>{t('settings.newPassword')}</Label>
              <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>{t('settings.confirmNewPassword')}</Label>
              <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
            </div>
          </div>
          <Button onClick={handleChangePassword} disabled={saving || !newPassword}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            {t('settings.changePassword')}
          </Button>
        </CardContent>
      </Card>

      {/* Subscription */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-5 w-5" /> {t('settings.subscription')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { key: 'starter', icon: Zap, color: 'text-emerald-500', price: '£8.31', basePrice: '£7.99', features: ['Statements + AI Categorisation', 'Invoices & Bills', 'Documents & Files', 'Vault & Actions', 'Life Events'] },
              { key: 'pro', icon: Sparkles, color: 'text-amber-500', price: '£15.42', basePrice: '£14.99', popular: true, features: ['Everything in Starter', 'Entities & Household', 'Reports & Tax Timeline', 'Projections & Properties', 'Email & Open Banking'] },
              { key: 'business', icon: Crown, color: 'text-purple-500', price: '£30.66', basePrice: '£29.99', features: ['Everything in Pro', 'Companies House API', 'HMRC Integration', 'Unlimited Entities', 'Priority AI & Support'] },
              { key: 'managed', icon: ShieldCheck, color: 'text-blue-500', price: '£101.83', basePrice: '£99.99', features: ['Everything in Business', 'Professional Bookkeeping', 'Monthly Reports Prepared', 'Dedicated Support', 'Quarterly Review Meetings'] },
            ].map(plan => {
              const isCurrent = profile?.plan === plan.key;
              const Icon = plan.icon;
              return (
                <div key={plan.key} className={`p-4 rounded-xl border-2 transition-all relative ${
                  isCurrent ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'
                }`}>
                  {plan.popular && !isCurrent && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                      <Badge className="bg-amber-500 text-white text-[10px] px-2 py-0">Most Popular</Badge>
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    <Icon className={`h-5 w-5 ${plan.color}`} />
                    <span className="font-semibold capitalize">{plan.key}</span>
                  </div>
                  <p className="text-2xl font-bold">{plan.price}<span className="text-sm font-normal text-muted-foreground">/mo</span></p>
                  <p className="text-[10px] text-muted-foreground">You receive {plan.basePrice} net</p>
                  <Badge variant="outline" className="mt-1 text-[10px] border-emerald-500/30 text-emerald-500">7-day free trial</Badge>
                  <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <CheckCircle className="h-3 w-3 text-emerald-500 mt-0.5 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  {isCurrent ? (
                    <Badge className="mt-3 bg-primary/10 text-primary border-0">{t('settings.currentPlan')}</Badge>
                  ) : (
                    <Button
                      size="sm"
                      className="mt-3 w-full"
                      disabled={!!loadingPlan}
                      onClick={async () => {
                        setLoadingPlan(plan.key);
                        try {
                          const res = await fetch('/api/stripe/checkout', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ plan: plan.key }),
                          });
                          const data = await res.json();
                          if (data.url) window.location.href = data.url;
                          else toast({ title: data.error || 'Failed', variant: 'destructive' });
                        } catch { toast({ title: 'Failed', variant: 'destructive' }); }
                        finally { setLoadingPlan(null); }
                      }}
                    >
                      {loadingPlan === plan.key ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                        isCurrent ? t('settings.currentPlan') : t('settings.upgrade')
                      )}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>

          {profile?.plan && profile.plan !== 'none' && profile.plan !== 'free' && (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                try {
                  const res = await fetch('/api/stripe/portal', { method: 'POST' });
                  const data = await res.json();
                  if (data.url) window.location.href = data.url;
                  else toast({ title: data.error || 'Failed', variant: 'destructive' });
                } catch { toast({ title: 'Failed', variant: 'destructive' }); }
              }}
            >
              <ExternalLink className="h-4 w-4 mr-2" /> {t('settings.manageBilling')}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Palette className="h-5 w-5" /> {t('settings.appearance')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            {(['light', 'dark', 'system'] as const).map((themeOption) => (
              <button
                key={themeOption}
                onClick={() => setTheme(themeOption)}
                className={`flex-1 p-4 rounded-xl border-2 transition-all text-center ${
                  theme === themeOption ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'
                }`}
              >
                <div className={`mx-auto h-8 w-8 rounded-full mb-2 ${
                  themeOption === 'light' ? 'bg-amber-100 border-2 border-amber-300' :
                  themeOption === 'dark' ? 'bg-slate-800 border-2 border-slate-600' :
                  'bg-gradient-to-br from-amber-100 to-slate-800 border-2 border-slate-400'
                }`} />
                <p className="text-sm font-medium capitalize">{t(`settings.${themeOption}`)}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Account Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-5 w-5" /> {t('settings.accountOverview')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {stats.map(s => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50 text-center">
                  <div className={`h-8 w-8 rounded-lg ${s.gradient} shadow-md ring-1 ring-white/20 flex items-center justify-center mx-auto mb-1.5`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-xl font-bold">{s.value}</p>
                  <p className="text-[11px] text-muted-foreground">{s.label}</p>
                </div>
              );
            })}
          </div>
          {profile.lastLoginAt && (
            <p className="text-xs text-muted-foreground mt-4 text-center">
              {t('settings.lastLogin')}: {new Date(profile.lastLoginAt).toLocaleString(locale === 'pt-BR' ? 'pt-BR' : 'en-GB')}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Data Export */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Download className="h-5 w-5" /> {t('settings.dataExport')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {t('settings.exportHint')}
          </p>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                window.open('/api/export?format=json&sections=all', '_blank');
                toast({ title: t('settings.downloadingJson') });
              }}
            >
              <Download className="h-4 w-4 mr-2" /> {t('settings.exportJson')}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                window.open('/api/export?format=csv&sections=statements', '_blank');
                toast({ title: t('settings.downloadingCsv') });
              }}
            >
              <Download className="h-4 w-4 mr-2" /> {t('settings.exportCsv')}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
