'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, CheckCircle2, AlertCircle, Loader2, ExternalLink, ArrowLeft, FileCheck, Camera, Fingerprint, QrCode, Smartphone, Monitor, Copy, Check } from 'lucide-react';
import Link from 'next/link';

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

export default function VerifyIdentityPage() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [status, setStatus] = useState<'loading' | 'ready' | 'verifying' | 'completed' | 'failed' | 'error'>('loading');
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [mockMode, setMockMode] = useState(false);
  const [copied, setCopied] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Check current verification status
  useEffect(() => {
    fetch('/api/settings')
      .then(r => r.json())
      .then(d => {
        if (d.idVerified) {
          setStatus('completed');
        } else {
          setStatus('ready');
        }
      })
      .catch(() => setStatus('ready'));
  }, []);

  // Auto-polling when verifying
  useEffect(() => {
    if (status === 'verifying' && sessionId && !mockMode) {
      pollingRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/yoti/result/${sessionId}`);
          const data = await res.json();
          if (data.status === 'completed') {
            setStatus('completed');
          } else if (data.status === 'failed') {
            setStatus('failed');
          }
        } catch { /* ignore */ }
      }, 5000);
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [status, sessionId, mockMode]);

  // Generate QR code client-side
  const generateQR = useCallback(async (url: string) => {
    try {
      const res = await fetch(`/api/yoti/qrcode?url=${encodeURIComponent(url)}`);
      const data = await res.json();
      if (data.qr) setQrDataUrl(data.qr);
    } catch { /* ignore */ }
  }, []);

  const startVerification = async () => {
    setCreating(true);
    try {
      const res = await fetch('/api/yoti/create-session', { method: 'POST' });
      const data = await res.json();

      if (!res.ok) {
        if (data.error === 'Identity already verified') {
          setStatus('completed');
          return;
        }
        throw new Error(data.error || 'Failed to create session');
      }

      setSessionId(data.sessionId);
      setIframeUrl(data.iframeUrl);
      const isMock = data.iframeUrl?.includes('/mock');
      setMockMode(isMock);
      setStatus('verifying');

      // Generate QR code for desktop users
      if (!isMobile && !isMock && data.iframeUrl) {
        generateQR(data.iframeUrl);
      }
    } catch (err: any) {
      console.error('Error starting verification:', err);
      setStatus('error');
    } finally {
      setCreating(false);
    }
  };

  const completeMock = async () => {
    if (!sessionId) return;
    try {
      const res = await fetch('/api/yoti/mock-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      if (res.ok) setStatus('completed');
      else setStatus('failed');
    } catch {
      setStatus('error');
    }
  };

  const copyLink = () => {
    if (iframeUrl) {
      navigator.clipboard.writeText(iframeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/settings" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-blue-500/10">
              <Shield className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Identity Verification</h1>
              <p className="text-sm text-muted-foreground">Verify your identity securely with Yoti</p>
            </div>
          </div>
        </div>

        {/* Loading */}
        {status === 'loading' && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Completed */}
        {status === 'completed' && (
          <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-8 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-500 mb-2">Identity Verified</h2>
            <p className="text-muted-foreground mb-6">
              Your identity has been successfully verified. You now have access to all premium features.
            </p>
            <Link
              href="/settings"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-green-500 text-white font-medium hover:bg-green-600 transition-colors"
            >
              Back to Settings
            </Link>
          </div>
        )}

        {/* Ready */}
        {status === 'ready' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-xl border bg-card p-5">
                <FileCheck className="h-8 w-8 text-blue-500 mb-3" />
                <h3 className="font-semibold mb-1">Document Check</h3>
                <p className="text-sm text-muted-foreground">
                  Upload a photo of your passport, driving licence, or national ID card.
                </p>
              </div>
              <div className="rounded-xl border bg-card p-5">
                <Camera className="h-8 w-8 text-purple-500 mb-3" />
                <h3 className="font-semibold mb-1">Selfie Match</h3>
                <p className="text-sm text-muted-foreground">
                  Take a selfie to match against your document photo for identity confirmation.
                </p>
              </div>
              <div className="rounded-xl border bg-card p-5">
                <Fingerprint className="h-8 w-8 text-amber-500 mb-3" />
                <h3 className="font-semibold mb-1">Liveness Check</h3>
                <p className="text-sm text-muted-foreground">
                  A quick video check to ensure you are a real person, not a photo or video.
                </p>
              </div>
            </div>

            <div className="rounded-xl border bg-card p-6">
              <h3 className="font-semibold mb-3">Before you start, make sure you have:</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                  A valid government-issued photo ID (passport, driving licence, or national ID)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                  Good lighting for the selfie and document photo
                </li>
                <li className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-blue-500 flex-shrink-0" />
                  <strong>A smartphone with a camera</strong> (you will scan a QR code if on desktop)
                </li>
              </ul>
            </div>

            <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
              <p className="text-sm text-muted-foreground">
                <Shield className="h-4 w-4 inline mr-1 text-blue-500" />
                <strong>Privacy:</strong> Your identity verification is processed securely by Yoti, a UK-certified
                identity service provider (DIATF certified). Your biometric data is not stored by HomeLedger —
                only the verification result (pass/fail) is retained.
              </p>
            </div>

            <div className="text-center pt-4">
              <button
                onClick={startVerification}
                disabled={creating}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-blue-600 text-white font-semibold text-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {creating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Shield className="h-5 w-5" />}
                Start Identity Verification
              </button>
              <p className="text-xs text-muted-foreground mt-3">
                This usually takes 2–3 minutes to complete
              </p>
            </div>
          </div>
        )}

        {/* Verifying */}
        {status === 'verifying' && (
          <div className="space-y-6">
            {mockMode ? (
              <div className="rounded-2xl border-2 border-dashed border-amber-500/30 bg-amber-500/5 p-8 text-center">
                <div className="flex items-center justify-center gap-2 text-amber-500 mb-4">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-semibold">Sandbox / Test Mode</span>
                </div>
                <p className="text-muted-foreground mb-6">
                  Yoti is in sandbox mode. This is a simulated verification for testing.
                </p>
                <div className="space-y-4">
                  <div className="rounded-xl border bg-card p-6 max-w-md mx-auto text-left">
                    <h3 className="font-semibold mb-3">Mock Verification Steps:</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" /> Document uploaded (simulated)
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" /> Selfie captured (simulated)
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" /> Liveness check passed (simulated)
                      </li>
                    </ul>
                  </div>
                  <button
                    onClick={completeMock}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-colors"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Complete Mock Verification
                  </button>
                </div>
              </div>
            ) : isMobile ? (
              // Mobile: show iFrame directly
              <div className="space-y-4">
                <div className="rounded-xl border bg-card overflow-hidden">
                  <iframe
                    src={iframeUrl || ''}
                    className="w-full border-0"
                    style={{ minHeight: '600px' }}
                    allow="camera; microphone"
                    title="Yoti Identity Verification"
                  />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Complete the verification steps above. This page will update automatically.
                </p>
              </div>
            ) : (
              // Desktop: show QR code + link
              <div className="space-y-6">
                <div className="rounded-2xl border bg-card p-8 text-center">
                  <div className="flex items-center justify-center gap-2 text-blue-500 mb-4">
                    <Smartphone className="h-5 w-5" />
                    <span className="font-semibold">Continue on your phone</span>
                  </div>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Identity verification requires a camera for document scanning and selfie.
                    Scan the QR code below with your phone to continue.
                  </p>

                  {/* QR Code */}
                  <div className="flex flex-col items-center gap-4 mb-6">
                    {qrDataUrl ? (
                      <div className="p-4 bg-white rounded-2xl shadow-lg">
                        <img src={qrDataUrl} alt="QR Code" className="w-64 h-64" />
                      </div>
                    ) : (
                      <div className="w-64 h-64 bg-muted rounded-2xl flex items-center justify-center">
                        <QrCode className="h-16 w-16 text-muted-foreground animate-pulse" />
                      </div>
                    )}
                  </div>

                  {/* Manual link */}
                  <div className="max-w-md mx-auto">
                    <p className="text-xs text-muted-foreground mb-2">Or copy this link to open on your phone:</p>
                    <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-2">
                      <input
                        type="text"
                        readOnly
                        value={iframeUrl || ''}
                        className="flex-1 bg-transparent text-xs text-muted-foreground outline-none truncate"
                      />
                      <button
                        onClick={copyLink}
                        className="flex-shrink-0 p-1.5 rounded-md hover:bg-muted transition-colors"
                      >
                        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4 text-muted-foreground" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Waiting indicator */}
                <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                    <span className="text-sm font-medium">Waiting for verification to complete...</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This page will update automatically once you complete the verification on your phone.
                    Checking every 5 seconds.
                  </p>
                </div>

                {/* Alternative: use webcam on desktop */}
                <div className="text-center">
                  <button
                    onClick={() => {
                      if (iframeUrl) window.open(iframeUrl, '_blank');
                    }}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
                  >
                    <Monitor className="h-4 w-4" />
                    Or try using your webcam on this device
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Failed */}
        {status === 'failed' && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-500 mb-2">Verification Failed</h2>
            <p className="text-muted-foreground mb-6">
              We could not verify your identity. This may happen if the document was unclear or the selfie did not match.
            </p>
            <button
              onClick={() => { setStatus('ready'); setSessionId(null); setIframeUrl(null); setQrDataUrl(null); }}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-500 mb-2">Something went wrong</h2>
            <p className="text-muted-foreground mb-6">
              There was an error starting the verification. Please try again later or contact support.
            </p>
            <button
              onClick={() => setStatus('ready')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
