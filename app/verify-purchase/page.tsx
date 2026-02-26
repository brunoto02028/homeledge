'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Fingerprint, Check, ArrowRight, CreditCard, Shield, Lock,
  BadgeCheck, Loader2, AlertCircle, PoundSterling, ArrowLeft,
  UserCheck, FileCheck, ShieldCheck, Home, CheckCircle2,
} from 'lucide-react';

const PLANS = [
  {
    id: 'single-check',
    name: 'Single Check',
    price: 299,
    priceDisplay: '£2.99',
    per: '/check',
    checks: 1,
    description: '1 identity verification',
    features: ['Document scanning', 'Biometric matching', 'Certified result', 'Email delivery', '30-day link validity'],
    highlighted: false,
  },
  {
    id: 'business-pack',
    name: 'Business Pack',
    price: 1999,
    priceDisplay: '£19.99',
    per: '/pack',
    checks: 10,
    description: '10 identity verifications',
    features: ['Everything in Single', '10 verification links', 'Bulk management', 'Priority processing', '60-day link validity'],
    highlighted: true,
    badge: 'Best Value',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 4999,
    priceDisplay: '£49.99',
    per: '/pack',
    checks: 50,
    description: '50 identity verifications',
    features: ['Everything in Business', '50 verification links', 'Dedicated support', 'API access', '90-day link validity'],
    highlighted: false,
  },
];

export default function VerifyPurchasePage() {
  const searchParams = useSearchParams();
  const preselectedPlan = searchParams.get('plan');

  const [selectedPlan, setSelectedPlan] = useState<string | null>(preselectedPlan);
  const [step, setStep] = useState<'plan' | 'details' | 'processing' | 'success' | 'error'>('plan');
  const [formData, setFormData] = useState({ name: '', email: '', company: '', purpose: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState<any>(null);

  // Check for Stripe redirect
  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    const status = searchParams.get('status');
    if (status === 'success' && sessionId) {
      setStep('processing');
      fetch(`/api/stripe/verify-session?session_id=${sessionId}`)
        .then(r => r.json())
        .then(data => {
          if (data.success) {
            setSuccessData(data);
            setStep('success');
          } else {
            setError(data.error || 'Payment verification failed');
            setStep('error');
          }
        })
        .catch(() => {
          setError('Failed to verify payment');
          setStep('error');
        });
    } else if (status === 'cancelled') {
      setStep('plan');
    }
  }, [searchParams]);

  const plan = PLANS.find(p => p.id === selectedPlan);

  const handleCheckout = async () => {
    if (!plan || !formData.name || !formData.email) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/stripe/verify-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: plan.id,
          planName: plan.name,
          price: plan.price,
          checks: plan.checks,
          customerName: formData.name,
          customerEmail: formData.email,
          companyName: formData.company,
          purpose: formData.purpose,
        }),
      });
      const data = await res.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Failed to create checkout session');
        setLoading(false);
      }
    } catch {
      setError('Failed to connect to payment service');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 shadow-lg shadow-amber-500/20 flex items-center justify-center">
              <PoundSterling className="h-5 w-5 text-slate-900" />
            </div>
            <span className="text-lg font-bold text-white">HomeLedger</span>
          </Link>
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Fingerprint className="h-4 w-4 text-violet-400" />
            Identity Verification
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12">
        {/* Step: Choose Plan */}
        {step === 'plan' && (
          <>
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-violet-400/10 border border-violet-400/20 text-violet-400 text-xs font-semibold mb-4">
                <Fingerprint className="h-3.5 w-3.5" /> No Account Required
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold">Choose Your Verification Package</h1>
              <p className="mt-3 text-slate-400 max-w-lg mx-auto">Government-grade identity checks. Purchase, send the link, get certified results.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              {PLANS.map((p) => (
                <div
                  key={p.id}
                  onClick={() => setSelectedPlan(p.id)}
                  className={`relative cursor-pointer rounded-2xl p-8 border-2 transition-all ${
                    selectedPlan === p.id
                      ? 'border-violet-400 bg-violet-400/5 shadow-lg shadow-violet-500/10'
                      : 'border-white/10 bg-white/[0.02] hover:border-white/20'
                  } ${p.highlighted && selectedPlan !== p.id ? 'border-violet-400/30' : ''}`}
                >
                  {p.badge && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-gradient-to-r from-violet-400 to-cyan-400 text-slate-900 text-xs font-bold rounded-full">{p.badge}</div>}
                  <h3 className="text-lg font-bold">{p.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">{p.description}</p>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">{p.priceDisplay}</span>
                    <span className="text-slate-500 text-sm">{p.per}</span>
                  </div>
                  <ul className="mt-5 space-y-2">
                    {p.features.map((f, j) => (
                      <li key={j} className="flex items-start gap-2 text-sm text-slate-400"><Check className="h-4 w-4 text-violet-400 mt-0.5 flex-shrink-0" />{f}</li>
                    ))}
                  </ul>
                  {selectedPlan === p.id && (
                    <div className="absolute top-4 right-4 h-6 w-6 rounded-full bg-violet-400 flex items-center justify-center">
                      <Check className="h-4 w-4 text-slate-900" />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="text-center">
              <button
                onClick={() => selectedPlan && setStep('details')}
                disabled={!selectedPlan}
                className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-violet-400 to-cyan-400 text-slate-900 font-semibold text-sm hover:from-violet-300 hover:to-cyan-300 shadow-lg shadow-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Continue <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </>
        )}

        {/* Step: Enter Details */}
        {step === 'details' && plan && (
          <>
            <button onClick={() => setStep('plan')} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-8 transition-colors">
              <ArrowLeft className="h-4 w-4" /> Back to plans
            </button>

            <div className="grid md:grid-cols-2 gap-10">
              <div>
                <h2 className="text-2xl font-bold mb-6">Your Details</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Full Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="John Smith"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-violet-400 focus:ring-1 focus:ring-violet-400 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Email Address *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="john@company.co.uk"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-violet-400 focus:ring-1 focus:ring-violet-400 outline-none transition-all"
                    />
                    <p className="text-xs text-slate-500 mt-1">Verification links will be sent to this email</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Company Name (optional)</label>
                    <input
                      type="text"
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      placeholder="Acme Ltd"
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 focus:border-violet-400 focus:ring-1 focus:ring-violet-400 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1.5">Purpose (optional)</label>
                    <select
                      value={formData.purpose}
                      onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-violet-400 focus:ring-1 focus:ring-violet-400 outline-none transition-all"
                    >
                      <option value="" className="bg-slate-900">Select purpose...</option>
                      <option value="right_to_work" className="bg-slate-900">Right to Work Check</option>
                      <option value="right_to_rent" className="bg-slate-900">Right to Rent Check</option>
                      <option value="kyc_aml" className="bg-slate-900">KYC / AML Compliance</option>
                      <option value="visa_immigration" className="bg-slate-900">Visa & Immigration</option>
                      <option value="tenant_screening" className="bg-slate-900">Tenant Screening</option>
                      <option value="client_onboarding" className="bg-slate-900">Client Onboarding</option>
                      <option value="other" className="bg-slate-900">Other</option>
                    </select>
                  </div>
                </div>

                {error && (
                  <div className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {error}
                  </div>
                )}

                <button
                  onClick={handleCheckout}
                  disabled={loading || !formData.name || !formData.email}
                  className="mt-6 w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-violet-400 to-cyan-400 text-slate-900 font-semibold text-sm hover:from-violet-300 hover:to-cyan-300 shadow-lg shadow-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {loading ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Redirecting to payment...</>
                  ) : (
                    <><CreditCard className="h-4 w-4" /> Pay {plan.priceDisplay} with Stripe</>
                  )}
                </button>
              </div>

              {/* Order Summary */}
              <div>
                <div className="rounded-2xl bg-white/[0.03] border border-white/10 p-6">
                  <h3 className="font-semibold text-lg mb-4">Order Summary</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between"><span className="text-slate-400">Package</span><span className="font-medium">{plan.name}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Verification checks</span><span className="font-medium">{plan.checks}</span></div>
                    <div className="flex justify-between"><span className="text-slate-400">Link validity</span><span className="font-medium">{plan.checks === 1 ? '30 days' : plan.checks === 10 ? '60 days' : '90 days'}</span></div>
                    <hr className="border-white/10" />
                    <div className="flex justify-between text-base"><span className="font-semibold">Total</span><span className="font-bold text-violet-400">{plan.priceDisplay}</span></div>
                  </div>

                  <div className="mt-6 space-y-2.5">
                    {[
                      { icon: Shield, text: 'Secure payment via Stripe' },
                      { icon: Lock, text: 'Your data is encrypted' },
                      { icon: BadgeCheck, text: 'Certified verification results' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-slate-500">
                        <item.icon className="h-3.5 w-3.5 text-violet-400" />
                        {item.text}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 rounded-2xl bg-violet-400/5 border border-violet-400/10 p-5">
                  <h4 className="text-sm font-semibold text-violet-400 mb-3">How it works after payment</h4>
                  <ol className="space-y-2 text-xs text-slate-400">
                    <li className="flex items-start gap-2"><span className="h-5 w-5 rounded-full bg-violet-400/10 flex items-center justify-center text-violet-400 font-bold text-[10px] flex-shrink-0">1</span>You receive {plan.checks} unique verification link{plan.checks > 1 ? 's' : ''} by email</li>
                    <li className="flex items-start gap-2"><span className="h-5 w-5 rounded-full bg-violet-400/10 flex items-center justify-center text-violet-400 font-bold text-[10px] flex-shrink-0">2</span>Send the link to the person you want to verify</li>
                    <li className="flex items-start gap-2"><span className="h-5 w-5 rounded-full bg-violet-400/10 flex items-center justify-center text-violet-400 font-bold text-[10px] flex-shrink-0">3</span>They scan their ID document and take a selfie</li>
                    <li className="flex items-start gap-2"><span className="h-5 w-5 rounded-full bg-violet-400/10 flex items-center justify-center text-violet-400 font-bold text-[10px] flex-shrink-0">4</span>You receive the certified result by email</li>
                  </ol>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Step: Processing */}
        {step === 'processing' && (
          <div className="text-center py-20">
            <Loader2 className="h-12 w-12 text-violet-400 animate-spin mx-auto mb-6" />
            <h2 className="text-2xl font-bold mb-2">Verifying your payment...</h2>
            <p className="text-slate-400">Please wait while we confirm your purchase and generate your verification links.</p>
          </div>
        )}

        {/* Step: Success */}
        {step === 'success' && successData && (
          <div className="text-center py-12">
            <div className="h-16 w-16 rounded-2xl bg-emerald-400/10 border border-emerald-400/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="h-8 w-8 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
            <p className="text-slate-400 mb-8">Your verification links have been generated and sent to <span className="text-white font-medium">{successData.email}</span>.</p>

            {successData.links && successData.links.length > 0 && (
              <div className="max-w-lg mx-auto text-left mb-8">
                <h3 className="text-sm font-semibold text-slate-300 mb-3">Your Verification Links</h3>
                <div className="space-y-2">
                  {successData.links.map((link: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 bg-white/5 rounded-xl p-4 border border-white/5">
                      <Fingerprint className="h-5 w-5 text-violet-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-mono text-slate-300 truncate">{link.url}</div>
                        <div className="text-xs text-slate-500">Expires: {new Date(link.expiresAt).toLocaleDateString()}</div>
                      </div>
                      <button
                        onClick={() => navigator.clipboard.writeText(link.url)}
                        className="px-3 py-1.5 rounded-lg bg-violet-400/10 text-violet-400 text-xs font-medium hover:bg-violet-400/20 transition-colors"
                      >
                        Copy
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl glass text-white text-sm font-semibold hover:bg-white/10 transition-colors">
                <ArrowLeft className="h-4 w-4" /> Back to Homepage
              </Link>
              <Link href="/register" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-400 to-cyan-400 text-slate-900 text-sm font-semibold hover:from-violet-300 hover:to-cyan-300 transition-all">
                Create Free Account <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}

        {/* Step: Error */}
        {step === 'error' && (
          <div className="text-center py-20">
            <div className="h-16 w-16 rounded-2xl bg-red-400/10 border border-red-400/20 flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="h-8 w-8 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Something Went Wrong</h2>
            <p className="text-slate-400 mb-8">{error || 'There was an issue processing your payment. Please try again.'}</p>
            <button onClick={() => { setStep('plan'); setError(''); }} className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-400 to-cyan-400 text-slate-900 text-sm font-semibold">
              <ArrowLeft className="h-4 w-4" /> Try Again
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-6 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} HomeLedger. Secure payments by Stripe. All rights reserved.</p>
      </footer>
    </div>
  );
}
