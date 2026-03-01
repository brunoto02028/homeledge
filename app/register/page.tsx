'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Loader2, AlertCircle, Home, Building2, Eye, EyeOff, Zap, Sparkles, Crown, ShieldCheck, CheckCircle } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export default function RegisterPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    accountType: 'household',
    selectedPlan: 'starter',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          accountType: formData.accountType,
          selectedPlan: formData.selectedPlan,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create account');
        setLoading(false);
        return;
      }

      // Redirect to email verification page
      if (data.requiresVerification) {
        router.replace(`/verify-email?email=${encodeURIComponent(data.email || formData.email)}`);
      } else {
        router.replace('/login');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4 py-8">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-xl overflow-hidden shadow-lg shadow-amber-500/20">
              <img src="/site-logo.png" alt="HomeLedger" className="h-full w-full object-contain" />
            </div>
          </div>
          <CardTitle className="text-2xl">{t('register.title')}</CardTitle>
          <CardDescription>{t('register.subtitle')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label>{t('register.accountType')}</Label>
              <RadioGroup
                value={formData.accountType}
                onValueChange={(v) => setFormData({ ...formData, accountType: v })}
                className="grid grid-cols-2 gap-4"
              >
                <Label
                  htmlFor="household"
                  className={`flex flex-col items-center justify-center rounded-lg border-2 p-4 cursor-pointer transition-colors ${
                    formData.accountType === 'household'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-muted-foreground/30'
                  }`}
                >
                  <RadioGroupItem value="household" id="household" className="sr-only" />
                  <Home className={`h-6 w-6 mb-2 ${formData.accountType === 'household' ? 'text-primary' : 'text-muted-foreground/60'}`} />
                  <span className={`text-sm font-medium ${formData.accountType === 'household' ? 'text-primary' : 'text-muted-foreground'}`}>
                    {t('register.household')}
                  </span>
                  <span className="text-xs text-muted-foreground">{t('register.personalFinances')}</span>
                </Label>
                <Label
                  htmlFor="business"
                  className={`flex flex-col items-center justify-center rounded-lg border-2 p-4 cursor-pointer transition-colors ${
                    formData.accountType === 'business'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-muted-foreground/30'
                  }`}
                >
                  <RadioGroupItem value="business" id="business" className="sr-only" />
                  <Building2 className={`h-6 w-6 mb-2 ${formData.accountType === 'business' ? 'text-primary' : 'text-muted-foreground/60'}`} />
                  <span className={`text-sm font-medium ${formData.accountType === 'business' ? 'text-primary' : 'text-muted-foreground'}`}>
                    {t('register.business')}
                  </span>
                  <span className="text-xs text-muted-foreground">{t('register.companyFinances')}</span>
                </Label>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label>Choose Your Plan</Label>
              <p className="text-xs text-muted-foreground">All plans include a 7-day free trial. You can upgrade or downgrade anytime.</p>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                {[
                  { key: 'starter', icon: Zap, color: 'text-emerald-500', price: '£7.90', label: 'Starter', features: ['Statements & AI', 'Invoices & Bills', 'Vault & Docs'] },
                  { key: 'pro', icon: Sparkles, color: 'text-amber-500', price: '£14.90', label: 'Pro', popular: true, features: ['All Starter +', 'Reports & Tax', 'Email & Banking'] },
                  { key: 'business', icon: Crown, color: 'text-purple-500', price: '£29.90', label: 'Business', features: ['All Pro +', 'HMRC & CH API', 'Unlimited'] },
                  { key: 'managed', icon: ShieldCheck, color: 'text-blue-500', price: '£99.90', label: 'Managed', features: ['All Business +', 'Bookkeeping', 'Dedicated Support'] },
                ].map(plan => {
                  const Icon = plan.icon;
                  const selected = formData.selectedPlan === plan.key;
                  return (
                    <button
                      key={plan.key}
                      type="button"
                      onClick={() => setFormData({ ...formData, selectedPlan: plan.key })}
                      className={`relative p-3 rounded-lg border-2 text-left transition-all ${
                        selected ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/30'
                      }`}
                    >
                      {plan.popular && (
                        <span className="absolute -top-2 right-2 text-[9px] bg-amber-500 text-white px-1.5 py-0 rounded-full">Popular</span>
                      )}
                      <div className="flex items-center gap-1.5 mb-1">
                        <Icon className={`h-4 w-4 ${plan.color}`} />
                        <span className="text-xs font-semibold">{plan.label}</span>
                      </div>
                      <p className="text-sm font-bold">{plan.price}<span className="text-[10px] font-normal text-muted-foreground">/mo</span></p>
                      <ul className="mt-1.5 space-y-0.5">
                        {plan.features.map((f, i) => (
                          <li key={i} className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <CheckCircle className="h-2.5 w-2.5 text-emerald-500 flex-shrink-0" />{f}
                          </li>
                        ))}
                      </ul>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">{t('register.fullName')}</Label>
              <Input
                id="fullName"
                placeholder="John Smith"
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{t('login.email')}</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t('login.password')}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="At least 8 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pr-10"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('register.confirmPassword')}</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Repeat your password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> {t('register.creating')}</>
              ) : (
                t('register.title')
              )}
            </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">or</span></div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full gap-2"
              onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Sign up with Google
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-center">
          <p className="text-sm text-muted-foreground">
            {t('register.hasAccount')}{' '}
            <Link href="/login" className="text-primary hover:underline font-medium">
              {t('register.signIn')}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
