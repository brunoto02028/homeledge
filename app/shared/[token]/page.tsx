'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/loading-spinner';
import {
  PoundSterling, BarChart3, Receipt, FileText, Building2, TrendingUp, TrendingDown,
  AlertTriangle, Lock,
} from 'lucide-react';

interface SharedData {
  ownerName: string;
  label: string;
  scope: string[];
  generatedAt: string;
  financialSummary?: {
    totalIncome: number;
    totalExpenses: number;
    netProfit: number;
    totalTransactions: number;
    byCategory: { name: string; amount: number; type: string; hmrcMapping: string | null }[];
  };
  bills?: { name: string; amount: number; currency: string; frequency: string; dueDay: number; category: string; provider: string }[];
  invoices?: { providerName: string; invoiceNumber: string; amount: number; status: string; invoiceDate: string; category: string }[];
  entities?: { name: string; type: string; taxRegime: string; companyNumber: string; utr: string }[];
}

const fmt = (n: number) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(n);

export default function SharedPortalPage() {
  const params = useParams();
  const token = params?.token as string;
  const [data, setData] = useState<SharedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/shared-links/${token}`)
      .then(async (res) => {
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to load');
        }
        return res.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) return (
    <div className="min-h-screen bg-slate-50 dark:bg-background flex items-center justify-center">
      <LoadingSpinner />
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-slate-50 dark:bg-background flex items-center justify-center">
      <Card className="max-w-md w-full mx-4">
        <CardContent className="p-8 text-center">
          <Lock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    </div>
  );

  if (!data) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background">
      {/* Header */}
      <div className="bg-slate-900 text-white py-6 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center">
              <PoundSterling className="h-5 w-5 text-slate-900" />
            </div>
            <div>
              <h1 className="text-xl font-bold">HomeLedger</h1>
              <p className="text-sm text-slate-400">Shared Financial Portal</p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3 items-center">
            <p className="text-slate-300">
              Shared by <strong className="text-white">{data.ownerName}</strong>
            </p>
            <Badge variant="secondary" className="bg-slate-700 text-slate-200">{data.label}</Badge>
            <span className="text-xs text-slate-500">
              Generated {new Date(data.generatedAt).toLocaleDateString('en-GB')}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6 pb-12">
        {/* Financial Summary */}
        {data.financialSummary && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Income</p>
                      <p className="text-xl font-bold text-emerald-600">{fmt(data.financialSummary.totalIncome)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-red-100 flex items-center justify-center">
                      <TrendingDown className="h-5 w-5 text-red-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Expenses</p>
                      <p className="text-xl font-bold text-red-600">{fmt(data.financialSummary.totalExpenses)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Net Profit</p>
                      <p className={`text-xl font-bold ${data.financialSummary.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {fmt(data.financialSummary.netProfit)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Category Breakdown ({data.financialSummary.totalTransactions} transactions)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2 font-medium text-muted-foreground">Category</th>
                        <th className="text-left p-2 font-medium text-muted-foreground">Type</th>
                        <th className="text-left p-2 font-medium text-muted-foreground">HMRC Box</th>
                        <th className="text-right p-2 font-medium text-muted-foreground">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.financialSummary.byCategory.map((c, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="p-2 font-medium">{c.name}</td>
                          <td className="p-2"><Badge variant="outline" className="text-xs">{c.type}</Badge></td>
                          <td className="p-2 text-xs text-muted-foreground">{c.hmrcMapping || '-'}</td>
                          <td className="p-2 text-right font-mono">{fmt(c.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Bills */}
        {data.bills && data.bills.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Active Bills ({data.bills.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Bill</th>
                      <th className="text-left p-2">Provider</th>
                      <th className="text-left p-2">Frequency</th>
                      <th className="text-left p-2">Due Day</th>
                      <th className="text-right p-2">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.bills.map((b, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="p-2 font-medium">{b.name}</td>
                        <td className="p-2 text-muted-foreground">{b.provider || '-'}</td>
                        <td className="p-2"><Badge variant="outline" className="text-xs">{b.frequency}</Badge></td>
                        <td className="p-2">{b.dueDay}</td>
                        <td className="p-2 text-right font-mono">{fmt(b.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Invoices */}
        {data.invoices && data.invoices.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Invoices ({data.invoices.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Provider</th>
                      <th className="text-left p-2">Invoice #</th>
                      <th className="text-left p-2">Date</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-right p-2">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.invoices.map((inv, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="p-2 font-medium">{inv.providerName || '-'}</td>
                        <td className="p-2 text-muted-foreground">{inv.invoiceNumber || '-'}</td>
                        <td className="p-2">{inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleDateString('en-GB') : '-'}</td>
                        <td className="p-2"><Badge variant="outline" className="text-xs">{inv.status}</Badge></td>
                        <td className="p-2 text-right font-mono">{inv.amount ? fmt(inv.amount) : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Entities */}
        {data.entities && data.entities.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Entities ({data.entities.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {data.entities.map((e, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                    <div>
                      <p className="font-medium">{e.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {e.type?.replace(/_/g, ' ')} · {e.taxRegime?.replace(/_/g, ' ')}
                        {e.companyNumber && ` · Co. #${e.companyNumber}`}
                      </p>
                    </div>
                    {e.utr && <Badge variant="outline" className="text-xs">UTR: {e.utr}</Badge>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground pt-6 border-t">
          <p>This is a read-only view shared via HomeLedger. Data is live and reflects the owner&apos;s current records.</p>
          <p className="mt-1">Powered by <strong>HomeLedger</strong> &mdash; homeledger.co.uk</p>
        </div>
      </div>
    </div>
  );
}
