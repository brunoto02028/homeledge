'use client';

import { useState, useEffect } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { ModuleGuide } from '@/components/module-guide';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { LoadingSpinner } from '@/components/loading-spinner';
import {
  Settings, User, Lock, Palette, BarChart3, Loader2, CheckCircle, Mail, Bell, BellOff,
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
  notificationPreferences?: {
    loginAlerts?: boolean;
    deadlineReminders?: boolean;
    budgetAlerts?: boolean;
    filingNotifications?: boolean;
  } | null;
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
  const isPt = locale === 'pt-BR';
  const isAdmin = (session?.user as any)?.role === 'admin';
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [pendingLogo, setPendingLogo] = useState<{ preview: string; dataUrl: string } | null>(null);
  const [setAsSiteLogo, setSetAsSiteLogo] = useState(true);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [notifPrefs, setNotifPrefs] = useState({
    loginAlerts: false,
    deadlineReminders: true,
    budgetAlerts: true,
    filingNotifications: true,
  });
  const [savingNotif, setSavingNotif] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    // Load logo from server — use serve endpoint for reliable display
    fetch('/api/settings/logo')
      .then(r => r.json())
      .then(d => { if (d.logoUrl) setLogoUrl(`/api/settings/logo/serve?v=${Date.now()}`); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(d => {
        setProfile(d);
        setFullName(d.fullName || '');
        if (d.notificationPreferences) {
          setNotifPrefs(prev => ({ ...prev, ...d.notificationPreferences }));
        }
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
      toast({ title: err.message || (isPt ? 'Falhou' : 'Failed'), variant: 'destructive' });
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
      toast({ title: err.message || (isPt ? 'Falhou' : 'Failed'), variant: 'destructive' });
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
      <ModuleGuide moduleKey="settings" />
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

      {/* Identity Verification — admin only */}
      {isAdmin && (
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
      )}

      {/* Categorisation Intelligence Mode — admin only */}
      {isAdmin && (<Card>
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
                    toast({ title: isPt ? `Modo de categorização definido como ${label}` : `Categorisation mode set to ${label}` });
                  } catch { toast({ title: isPt ? 'Falha ao atualizar' : 'Failed to update', variant: 'destructive' }); }
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
      )}

      {/* Logo / Branding */}
      {isAdmin && (<Card>
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
              {pendingLogo ? (
                <img src={pendingLogo.preview} alt="Preview" className="h-full w-full object-contain" />
              ) : logoUrl ? (
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
                    input.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (!file) return;
                      if (file.size > 500 * 1024) {
                        toast({ title: t('settings.imageTooLarge'), variant: 'destructive' });
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = () => {
                        const dataUrl = reader.result as string;
                        setPendingLogo({ preview: dataUrl, dataUrl });
                      };
                      reader.readAsDataURL(file);
                    };
                    input.click();
                  }}
                >
                  <Image className="h-4 w-4 mr-1" />
                  {t('settings.uploadLogo')}
                </Button>
                {pendingLogo && (
                  <Button
                    size="sm"
                    disabled={uploadingLogo}
                    onClick={async () => {
                      setUploadingLogo(true);
                      try {
                        const res = await fetch('/api/settings/logo', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ dataUrl: pendingLogo.dataUrl, setAsSiteLogo: isAdmin && setAsSiteLogo }),
                        });
                        const data = await res.json();
                        if (res.ok && data.logoUrl) {
                          setLogoUrl(`/api/settings/logo/serve?v=${Date.now()}`);
                          setPendingLogo(null);
                          const siteMsg = data.siteIconsGenerated ? (isPt ? ' + Favicon e ícones PWA atualizados!' : ' + Favicon & PWA icons updated!') : '';
                          toast({ title: t('settings.logoSaved') + siteMsg });
                        } else {
                          toast({ title: data.error || (isPt ? 'Falha no envio' : 'Failed to upload'), variant: 'destructive' });
                        }
                      } catch {
                        toast({ title: isPt ? 'Falha no envio' : 'Upload failed', variant: 'destructive' });
                      }
                      setUploadingLogo(false);
                    }}
                  >
                    {uploadingLogo ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle className="h-4 w-4 mr-1" />}
                    Save Logo
                  </Button>
                )}
                {!pendingLogo && logoUrl && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        await fetch('/api/settings/logo', { method: 'DELETE' });
                        setLogoUrl(null);
                        toast({ title: t('settings.logoRemoved') });
                      } catch {
                        toast({ title: isPt ? 'Falha ao remover logo' : 'Failed to remove logo', variant: 'destructive' });
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-1" /> {t('settings.removeLogo')}
                  </Button>
                )}
                {pendingLogo && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPendingLogo(null)}
                  >
                    Cancel
                  </Button>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">{t('settings.logoFormat')}</p>
              {pendingLogo && (
                <label className="flex items-center gap-2 mt-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={setAsSiteLogo}
                    onChange={e => setSetAsSiteLogo(e.target.checked)}
                    className="rounded border-border"
                  />
                  <span className="text-xs text-muted-foreground">
                    {isPt ? 'Definir como logo do site, favicon e ícones PWA (homescreen)' : 'Set as site logo, favicon & PWA icons (homescreen)'}
                  </span>
                </label>
              )}
            </div>
          </div>
        </CardContent>
      </Card>)}

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

      {/* Link Google Account — admin only */}
      {isAdmin && (<Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <svg className="h-5 w-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            {isPt ? 'Conta Google' : 'Google Account'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {isPt
              ? 'Vincule sua conta do Google para fazer login mais rapidamente, sem precisar de senha.'
              : 'Link your Google account to sign in faster without needing a password.'}
          </p>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => signIn('google', { callbackUrl: '/settings' })}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            {isPt ? 'Vincular conta do Google' : 'Link Google Account'}
          </Button>
        </CardContent>
      </Card>)}

      {/* Email Notifications — admin only */}
      {isAdmin && (<Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="h-5 w-5" /> Email Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Choose which email notifications you want to receive. Transactional emails (verification codes, password resets) are always sent.
          </p>
          {[
            { key: 'loginAlerts' as const, label: 'Login Alerts', desc: 'Receive an email every time someone signs into your account.', defaultOff: true },
            { key: 'deadlineReminders' as const, label: 'Deadline Reminders', desc: 'Daily email about upcoming tax deadlines and filing due dates.' },
            { key: 'budgetAlerts' as const, label: 'Budget Alerts', desc: 'Email when your spending approaches or exceeds a budget limit.' },
            { key: 'filingNotifications' as const, label: 'Filing Notifications', desc: 'Email when Companies House filings are submitted or rejected.' },
          ].map(({ key, label, desc, defaultOff }) => (
            <button
              key={key}
              disabled={savingNotif}
              onClick={async () => {
                const updated = { ...notifPrefs, [key]: !notifPrefs[key] };
                setNotifPrefs(updated);
                setSavingNotif(true);
                try {
                  const res = await fetch('/api/settings', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ notificationPreferences: updated }),
                  });
                  if (!res.ok) throw new Error();
                  toast({ title: `${label} ${updated[key] ? (isPt ? 'ativado' : 'enabled') : (isPt ? 'desativado' : 'disabled')}` });
                } catch {
                  setNotifPrefs(prev => ({ ...prev, [key]: !prev[key] }));
                  toast({ title: isPt ? 'Falha ao atualizar' : 'Failed to update', variant: 'destructive' });
                } finally { setSavingNotif(false); }
              }}
              className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between gap-3 ${
                notifPrefs[key]
                  ? 'border-emerald-500/30 bg-emerald-500/5'
                  : 'border-border hover:bg-muted/30'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {notifPrefs[key] ? <Bell className="h-4 w-4 text-emerald-500 flex-shrink-0" /> : <BellOff className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                <div className="min-w-0">
                  <p className={`text-sm font-medium ${notifPrefs[key] ? '' : 'text-muted-foreground'}`}>{label}</p>
                  <p className="text-xs text-muted-foreground truncate">{desc}</p>
                </div>
              </div>
              <div className={`w-10 h-5 rounded-full flex-shrink-0 transition-colors relative ${
                notifPrefs[key] ? 'bg-emerald-500' : 'bg-muted'
              }`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${
                  notifPrefs[key] ? 'left-[22px]' : 'left-0.5'
                }`} />
              </div>
            </button>
          ))}
        </CardContent>
      </Card>)}

      {/* Subscription — admin only */}
      {isAdmin && (<Card>
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
                          else toast({ title: data.error || (isPt ? 'Falhou' : 'Failed'), variant: 'destructive' });
                        } catch { toast({ title: isPt ? 'Falhou' : 'Failed', variant: 'destructive' }); }
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
                  else toast({ title: data.error || (isPt ? 'Falhou' : 'Failed'), variant: 'destructive' });
                } catch { toast({ title: isPt ? 'Falhou' : 'Failed', variant: 'destructive' }); }
              }}
            >
              <ExternalLink className="h-4 w-4 mr-2" /> {t('settings.manageBilling')}
            </Button>
          )}
        </CardContent>
      </Card>)}

      {/* Appearance — admin only */}
      {isAdmin && (<Card>
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
      </Card>)}

      {/* Account Stats — admin only */}
      {isAdmin && (<Card>
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
      </Card>)}

      {/* Data Export & GDPR — admin only */}
      {isAdmin && (<Card>
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
          <p className="text-xs text-muted-foreground mt-2">
            GDPR Article 20 — Your data export includes all personal data we hold about you.
          </p>
        </CardContent>
      </Card>)}

      {/* Delete Account — GDPR Article 17 — admin only */}
      {isAdmin && (<Card className="border-red-500/20">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-red-500">
            <Trash2 className="h-5 w-5" /> Delete Account
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 rounded-lg bg-red-500/5 border border-red-500/20">
            <p className="text-sm font-medium text-red-500">This action is permanent and cannot be undone.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Deleting your account will permanently remove all your data including: entities, statements, invoices, bills, documents, vault entries, email accounts, insurance policies, life events, and all other associated records.
            </p>
          </div>
          {!showDeleteConfirm ? (
            <Button
              variant="outline"
              className="border-red-500/30 text-red-500 hover:bg-red-500/10"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" /> I want to delete my account
            </Button>
          ) : (
            <div className="space-y-3 p-4 rounded-lg border border-red-500/30 bg-red-500/5">
              <p className="text-sm font-medium">Before deleting, we recommend downloading your data:</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  window.open('/api/export?format=json&sections=all', '_blank');
                  toast({ title: isPt ? 'Baixando seus dados...' : 'Downloading your data...' });
                }}
              >
                <Download className="h-4 w-4 mr-2" /> Download All Data (JSON)
              </Button>
              <div className="space-y-2 pt-2 border-t border-red-500/20">
                <div className="space-y-1.5">
                  <Label className="text-sm">Enter your password to confirm</Label>
                  <Input
                    type="password"
                    value={deletePassword}
                    onChange={e => setDeletePassword(e.target.value)}
                    placeholder="Your current password"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-sm">Type <span className="font-mono font-bold">DELETE MY ACCOUNT</span> to confirm</Label>
                  <Input
                    value={deleteConfirmText}
                    onChange={e => setDeleteConfirmText(e.target.value)}
                    placeholder="DELETE MY ACCOUNT"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="destructive"
                    disabled={deletingAccount || deleteConfirmText !== 'DELETE MY ACCOUNT' || !deletePassword}
                    onClick={async () => {
                      setDeletingAccount(true);
                      try {
                        const res = await fetch('/api/settings/delete-account', {
                          method: 'DELETE',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ password: deletePassword, confirmation: deleteConfirmText }),
                        });
                        const data = await res.json();
                        if (!res.ok) throw new Error(data.error);
                        toast({ title: isPt ? 'Conta excluída. Redirecionando...' : 'Account deleted. Redirecting...' });
                        setTimeout(() => { window.location.href = '/login'; }, 2000);
                      } catch (err: any) {
                        toast({ title: err.message || (isPt ? 'Falha ao excluir conta' : 'Failed to delete account'), variant: 'destructive' });
                        setDeletingAccount(false);
                      }
                    }}
                  >
                    {deletingAccount ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                    Permanently Delete Account
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeletePassword('');
                      setDeleteConfirmText('');
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>)}
    </div>
  );
}
