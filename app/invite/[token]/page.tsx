'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/loading-spinner';
import {
  UserPlus, CheckCircle, XCircle, Loader2, PoundSterling, LogIn,
} from 'lucide-react';

export default function InviteAcceptPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [state, setState] = useState<'loading' | 'ready' | 'accepting' | 'success' | 'error'>('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      // Not logged in — redirect to login with callback
      router.push(`/login?callbackUrl=/invite/${token}`);
      return;
    }
    setState('ready');
  }, [session, status, token, router]);

  const handleAccept = async () => {
    setState('accepting');
    try {
      const res = await fetch(`/api/invitations/accept/${token}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setState('success');
      setTimeout(() => router.push('/household'), 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to accept invitation');
      setState('error');
    }
  };

  if (status === 'loading' || state === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center space-y-6">
          {/* Header */}
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg overflow-hidden shadow-md shadow-amber-500/20">
              <img src="/site-logo.png" alt="HomeLedger" className="h-full w-full object-contain" />
            </div>
            <span className="font-bold text-xl">HomeLedger</span>
          </div>

          {state === 'ready' && (
            <>
              <div className="h-16 w-16 rounded-2xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto">
                <UserPlus className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold">You&apos;ve Been Invited!</h1>
                <p className="text-muted-foreground mt-2 text-sm">
                  Click below to accept the invitation and join the household.
                </p>
              </div>
              <Button onClick={handleAccept} className="w-full">
                <UserPlus className="h-4 w-4 mr-2" />
                Accept Invitation
              </Button>
            </>
          )}

          {state === 'accepting' && (
            <>
              <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
              <p className="text-muted-foreground">Accepting invitation...</p>
            </>
          )}

          {state === 'success' && (
            <>
              <div className="h-16 w-16 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto">
                <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Welcome!</h1>
                <p className="text-muted-foreground mt-2 text-sm">
                  You&apos;ve successfully joined the household. Redirecting...
                </p>
              </div>
            </>
          )}

          {state === 'error' && (
            <>
              <div className="h-16 w-16 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center mx-auto">
                <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Something Went Wrong</h1>
                <p className="text-muted-foreground mt-2 text-sm">{error}</p>
              </div>
              <Button variant="outline" onClick={() => router.push('/')}>
                Go to Dashboard
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
