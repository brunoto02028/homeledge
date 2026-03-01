'use client';

import { useState, useRef, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { PoundSterling, Loader2, AlertCircle, Eye, EyeOff, ArrowLeft, Mail, ShieldCheck } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

type LoginStep = 'credentials' | 'otp';

export default function LoginPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [step, setStep] = useState<LoginStep>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [maskedEmail, setMaskedEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/send-login-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.requiresVerification) {
          router.replace(`/verify-email?email=${encodeURIComponent(data.email || email)}`);
          return;
        }
        setError(data.error || 'Invalid email or password');
        setLoading(false);
        return;
      }

      // If SMTP not configured, skip OTP and sign in directly
      if (data.skipOtp) {
        const result = await signIn('credentials', {
          email,
          password,
          loginCode: 'SMTP_BYPASS',
          redirect: false,
        });
        if (result?.error) {
          setError('Login failed. Please try again.');
          setLoading(false);
          return;
        }
        fetch('/api/auth/notify-login', { method: 'POST' }).catch(() => {});
        router.replace('/dashboard');
        return;
      }

      setMaskedEmail(data.maskedEmail || email);
      setStep('otp');
      setResendCooldown(60);
      setLoading(false);
      // Focus first OTP input
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);

    // Auto-focus next input
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits filled
    if (newDigits.every(d => d !== '') && value) {
      handleVerifyCode(newDigits.join(''));
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      const digits = pasted.split('');
      setOtpDigits(digits);
      handleVerifyCode(pasted);
    }
  };

  const handleVerifyCode = async (code: string) => {
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        loginCode: code,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid or expired code. Please try again.');
        setOtpDigits(['', '', '', '', '', '']);
        otpRefs.current[0]?.focus();
        setLoading(false);
        return;
      }

      // Send login notification
      fetch('/api/auth/notify-login', { method: 'POST' }).catch(() => {});
      router.replace('/dashboard');
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0) return;
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/send-login-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        setResendCooldown(60);
        setOtpDigits(['', '', '', '', '', '']);
        otpRefs.current[0]?.focus();
      }
    } catch (err) {
      setError('Failed to resend code.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-xl overflow-hidden shadow-lg shadow-amber-500/20">
              {step === 'credentials' ? (
                <img src="/site-logo.png" alt="HomeLedger" className="h-full w-full object-contain" />
              ) : (
                <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-amber-400 to-amber-500">
                  <ShieldCheck className="h-7 w-7 text-slate-900" />
                </div>
              )}
            </div>
          </div>
          <CardTitle className="text-2xl">
            {step === 'credentials' ? t('login.welcomeBack') : t('login.verifyIdentity')}
          </CardTitle>
          <CardDescription>
            {step === 'credentials'
              ? t('login.signIn')
              : (
                <span className="flex items-center justify-center gap-1.5 mt-1">
                  <Mail className="h-4 w-4" />
                  {t('login.codeSentTo')} {maskedEmail}
                </span>
              )
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {step === 'credentials' ? (
            <form onSubmit={handleSendCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('login.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t('login.password')}</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                    required
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
              <div className="text-right">
                <Link href="/forgot-password" className="text-sm text-primary hover:underline">
                  {t('login.forgotPassword')}
                </Link>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> {t('login.verifying')}</>
                ) : (
                  t('login.continue')
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
                Continue with Google
              </Button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
                {otpDigits.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { otpRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className="w-12 h-14 text-center text-2xl font-bold border-2 border-border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-background text-foreground"
                    disabled={loading}
                  />
                ))}
              </div>

              <div className="text-center space-y-3">
                <Button
                  onClick={() => handleVerifyCode(otpDigits.join(''))}
                  className="w-full"
                  disabled={loading || otpDigits.some(d => d === '')}
                >
                  {loading ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> {t('login.verifying')}</>
                  ) : (
                    t('login.verifyAndSignIn')
                  )}
                </Button>

                <p className="text-sm text-muted-foreground">
                  {t('login.didntReceive')}{' '}
                  {resendCooldown > 0 ? (
                    <span className="text-muted-foreground/60">{t('login.resendIn')} {resendCooldown}s</span>
                  ) : (
                    <button
                      onClick={handleResendCode}
                      className="text-primary hover:underline font-medium"
                      disabled={loading}
                    >
                      {t('login.resendCode')}
                    </button>
                  )}
                </p>

                <button
                  onClick={() => { setStep('credentials'); setError(''); setOtpDigits(['', '', '', '', '', '']); }}
                  className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  {t('login.backToLogin')}
                </button>
              </div>
            </div>
          )}
        </CardContent>
        {step === 'credentials' && (
          <CardFooter className="justify-center">
            <p className="text-sm text-muted-foreground">
              {t('login.noAccount')}{' '}
              <Link href="/register" className="text-primary hover:underline font-medium">
                {t('login.createOne')}
              </Link>
            </p>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
