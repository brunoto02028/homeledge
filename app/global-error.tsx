'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Clarity & Co Global Error]', error);
  }, [error]);

  return (
    <html>
      <body style={{ margin: 0, padding: 0, background: '#0f172a', color: '#f1f5f9', fontFamily: 'sans-serif', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: '420px', padding: '2rem', background: '#1e293b', borderRadius: '1rem', border: '1px solid #334155' }}>
          <div style={{ width: '64px', height: '64px', background: '#fee2e2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Algo correu mal</h2>
          <p style={{ color: '#94a3b8', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
            Ocorreu um erro inesperado. Por favor tenta novamente.
          </p>
          {error?.digest && (
            <p style={{ color: '#64748b', fontSize: '0.75rem', fontFamily: 'monospace', marginBottom: '1rem' }}>
              ID: {error.digest}
            </p>
          )}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1.5rem' }}>
            <button
              onClick={reset}
              style={{ padding: '0.6rem 1.25rem', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 600 }}
            >
              ↺ Tentar Novamente
            </button>
            <a
              href="/dashboard"
              style={{ padding: '0.6rem 1.25rem', background: '#334155', color: 'white', borderRadius: '0.5rem', textDecoration: 'none', fontWeight: 600 }}
            >
              🏠 Dashboard
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
