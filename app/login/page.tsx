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
            <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 shadow-lg shadow-amber-500/20">
              {step === 'credentials' ? (
                <PoundSterling className="h-7 w-7 text-slate-900" />
              ) : (
                <ShieldCheck className="h-7 w-7 text-slate-900" />
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
