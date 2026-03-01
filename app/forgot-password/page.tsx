'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { PoundSterling, Loader2, AlertCircle, ArrowLeft, Mail, KeyRound, CheckCircle2, Eye, EyeOff } from 'lucide-react';

type Step = 'email' | 'code' | 'newPassword' | 'success';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleSendResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (res.ok) {
        setStep('code');
        setTimeout(() => otpRefs.current[0]?.focus(), 100);
      } else {
        const data = await res.json();
        setError(data.error || 'Something went wrong');
      }
    } catch {
      setError('An error occurred. Please try again.');
    }
    setLoading(false);
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newDigits = [...otpDigits];
    newDigits[index] = value.slice(-1);
    setOtpDigits(newDigits);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
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
      setOtpDigits(pasted.split(''));
    }
  };

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    const code = otpDigits.join('');
    if (code.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }
    setError('');
    setStep('newPassword');
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otpDigits.join(''), newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        setStep('success');
      } else {
        setError(data.error || 'Failed to reset password');
        if (data.error?.includes('expired') || data.error?.includes('Invalid')) {
          setStep('code');
          setOtpDigits(['', '', '', '', '', '']);
        }
      }
    } catch {
      setError('An error occurred. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-xl overflow-hidden shadow-lg shadow-amber-500/20">
              {step === 'success' ? (
                <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-emerald-500 to-emerald-400">
                  <CheckCircle2 className="h-7 w-7 text-white" />
                </div>
              ) : step === 'newPassword' ? (
                <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-amber-400 to-amber-500">
                  <KeyRound className="h-7 w-7 text-slate-900" />
                </div>
              ) : step === 'code' ? (
                <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-amber-400 to-amber-500">
                  <Mail className="h-7 w-7 text-slate-900" />
                </div>
              ) : (
                <img src="/site-logo.png" alt="HomeLedger" className="h-full w-full object-contain" />
              )}
            </div>
          </div>
          <CardTitle className="text-2xl">
            {step === 'email' && 'Forgot Password'}
            {step === 'code' && 'Check Your Email'}
            {step === 'newPassword' && 'New Password'}
            {step === 'success' && 'Password Reset'}
          </CardTitle>
          <CardDescription>
            {step === 'email' && 'Enter your email to receive a reset code'}
            {step === 'code' && `We sent a 6-digit code to ${email}`}
            {step === 'newPassword' && 'Create a strong new password'}
            {step === 'success' && 'Your password has been reset successfully'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {step === 'email' && (
            <form onSubmit={handleSendResetCode} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
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
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending code...</>
                ) : (
                  'Send Reset Code'
                )}
              </Button>
            </form>
          )}

          {step === 'code' && (
            <form onSubmit={handleVerifyCode} className="space-y-6">
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
                  />
                ))}
              </div>
              <Button type="submit" className="w-full" disabled={otpDigits.some(d => d === '')}>
                Continue
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Didn&apos;t receive a code?{' '}
                <button
                  type="button"
                  onClick={() => { setStep('email'); setOtpDigits(['', '', '', '', '', '']); setError(''); }}
                  className="text-primary hover:underline font-medium"
                >
                  Try again
                </button>
              </p>
            </form>
          )}

          {step === 'newPassword' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min 8 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pr-10"
                    required
                    autoFocus
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
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Resetting...</>
                ) : (
                  'Reset Password'
                )}
              </Button>
            </form>
          )}

          {step === 'success' && (
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">You can now sign in with your new password.</p>
              <Button onClick={() => router.push('/login')} className="w-full">
                Go to Login
              </Button>
            </div>
          )}
        </CardContent>
        {step !== 'success' && (
          <CardFooter className="justify-center">
            <Link href="/login" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to login
            </Link>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}
