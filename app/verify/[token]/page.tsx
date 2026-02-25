'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Shield, CheckCircle2, AlertCircle, Loader2, Clock, Smartphone, FileCheck, Camera, Fingerprint } from 'lucide-react';

interface LinkInfo {
  clientName: string;
  companyName?: string;
  status: string;
}

export default function PublicVerifyPage() {
  const params = useParams();
  const token = params.token as string;
  const [stage, setStage] = useState<'loading' | 'ready' | 'verifying' | 'completed' | 'failed' | 'expired' | 'not_found'>('loading');
  const [linkInfo, setLinkInfo] = useState<LinkInfo | null>(null);
  const [iframeUrl, setIframeUrl] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [mockMode, setMockMode] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Load link info
  useEffect(() => {
    if (!token) return;
    fetch(`/api/yoti/verify-link/${token}`)
      .then(r => {
        if (r.status === 404) { setStage('not_found'); return null; }
        if (r.status === 410) { setStage('expired'); return null; }
        return r.json();
      })
      .then(d => {
        if (!d) return;
        setLinkInfo(d);
        if (d.status === 'completed') setStage('completed');
        else if (d.status === 'failed') setStage('failed');
        else setStage('ready');
      })
      .catch(() => setStage('not_found'));
  }, [token]);

  // Auto-poll when verifying
  useEffect(() => {
    if (stage === 'verifying' && sessionId && !mockMode) {
      pollingRef.current = setInterval(async () => {
        try {
          const res = await fetch(`/api/yoti/verify-link/${token}`, { method: 'POST' });
          const data = await res.json();
          if (data.status === 'completed') setStage('completed');
          else if (data.status === 'failed') setStage('failed');
        } catch { /* ignore */ }
      }, 5000);
    }
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [stage, sessionId, token, mockMode]);

  const startVerification = async () => {
    try {
      const res = await fetch(`/api/yoti/verify-link/${token}`, { method: 'POST' });
      const data = await res.json();

      if (data.status === 'completed') { setStage('completed'); return; }
      if (data.status === 'failed') { setStage('failed'); return; }

      setSessionId(data.sessionId);
      setIframeUrl(data.iframeUrl);
      setMockMode(data.iframeUrl?.includes('/mock'));
      setStage('verifying');
    } catch {
      setStage('not_found');
    }
  };

  // Mock completion for sandbox
  const completeMock = async () => {
    if (!sessionId) return;
    try {
      const res = await fetch('/api/yoti/mock-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      if (res.ok) setStage('completed');
      else setStage('failed');
    } catch { setStage('failed'); }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-blue-600 text-white mb-3">
            <Shield className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold">Identity Verification</h1>
          <p className="text-sm text-muted-foreground mt-1">Powered by HomeLedger &amp; Yoti</p>
        </div>

        {/* Loading */}
        {stage === 'loading' && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-blue-500 mx-auto" />
            <p className="text-muted-foreground mt-4">Loading verification...</p>
          </div>
        )}

        {/* Not found */}
        {stage === 'not_found' && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 text-center">
            <AlertCircle className="h-14 w-14 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-red-500 mb-2">Link Not Found</h2>
            <p className="text-muted-foreground">This verification link is invalid or has been removed.</p>
          </div>
        )}

        {/* Expired */}
        {stage === 'expired' && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 text-center">
            <Clock className="h-14 w-14 text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-amber-500 mb-2">Link Expired</h2>
            <p className="text-muted-foreground">This verification link has expired. Please request a new one.</p>
          </div>
        )}

        {/* Ready */}
        {stage === 'ready' && linkInfo && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden">
            {/* Header bar */}
            {linkInfo.companyName && (
              <div className="bg-blue-600 text-white px-6 py-3 text-center">
                <p className="text-sm font-medium">{linkInfo.companyName} requests identity verification</p>
              </div>
            )}

            <div className="p-6 space-y-5">
              <div className="text-center">
                <p className="text-lg font-semibold">Hello, {linkInfo.clientName}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Please verify your identity to continue. This process is quick, secure, and confidential.
                </p>
              </div>

              {/* Steps */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50">
                  <FileCheck className="h-6 w-6 text-blue-500 mx-auto mb-1" />
                  <p className="text-xs font-medium">Document</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50">
                  <Camera className="h-6 w-6 text-purple-500 mx-auto mb-1" />
                  <p className="text-xs font-medium">Selfie</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50">
                  <Fingerprint className="h-6 w-6 text-amber-500 mx-auto mb-1" />
                  <p className="text-xs font-medium">Liveness</p>
                </div>
              </div>

              <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                <Shield className="h-3.5 w-3.5 inline mr-1 text-blue-500" />
                Your data is processed securely by Yoti (DIATF certified). Only the verification result is shared.
              </div>

              <button
                onClick={startVerification}
                className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Shield className="h-5 w-5" />
                Start Verification
              </button>

              <p className="text-xs text-muted-foreground text-center">Takes about 2–3 minutes</p>
            </div>
          </div>
        )}

        {/* Verifying */}
        {stage === 'verifying' && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg overflow-hidden">
            {mockMode ? (
              <div className="p-8 text-center">
                <AlertCircle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
                <h3 className="font-semibold text-amber-500 mb-2">Sandbox Mode</h3>
                <p className="text-sm text-muted-foreground mb-4">Simulated verification for testing.</p>
                <button
                  onClick={completeMock}
                  className="px-6 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700"
                >
                  <CheckCircle2 className="h-4 w-4 inline mr-1" />
                  Complete Mock Verification
                </button>
              </div>
            ) : (
              <div>
                <iframe
                  src={iframeUrl || ''}
                  className="w-full border-0"
                  style={{ minHeight: '650px' }}
                  allow="camera; microphone"
                  title="Yoti Verification"
                />
                <div className="px-4 py-3 bg-blue-50 dark:bg-blue-900/20 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-500" />
                    <span className="text-xs text-muted-foreground">Waiting for completion...</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Completed */}
        {stage === 'completed' && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-green-500 mb-2">Verified!</h2>
            <p className="text-muted-foreground">
              Your identity has been verified successfully. You can close this page.
            </p>
          </div>
        )}

        {/* Failed */}
        {stage === 'failed' && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-lg p-8 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-red-500 mb-2">Verification Failed</h2>
            <p className="text-muted-foreground mb-4">We could not verify your identity. Please try again.</p>
            <button
              onClick={() => { setStage('ready'); setSessionId(null); setIframeUrl(null); }}
              className="px-6 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          &copy; {new Date().getFullYear()} HomeLedger &middot; Powered by Yoti
        </p>
      </div>
    </div>
  );
}
