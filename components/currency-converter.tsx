'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowRightLeft, Loader2 } from 'lucide-react';

interface Rate {
  rate: number;
  name: string;
  symbol: string;
}

const TOP_CURRENCIES = ['GBP', 'USD', 'EUR', 'BRL', 'CAD', 'AUD', 'JPY', 'CHF', 'INR', 'PLN'];

export function CurrencyConverter() {
  const [rates, setRates] = useState<Record<string, Rate>>({});
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState('GBP');
  const [to, setTo] = useState('EUR');
  const [amount, setAmount] = useState('100');

  useEffect(() => {
    fetch('/api/exchange-rates')
      .then(r => r.json())
      .then(d => setRates(d.rates || {}))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const fromRate = rates[from]?.rate || 1;
  const toRate = rates[to]?.rate || 1;
  const converted = parseFloat(amount || '0') * (toRate / fromRate);
  const exchangeRate = toRate / fromRate;

  const swap = () => { setFrom(to); setTo(from); };

  const currencyOptions = Object.entries(rates).sort((a, b) => {
    const aIdx = TOP_CURRENCIES.indexOf(a[0]);
    const bIdx = TOP_CURRENCIES.indexOf(b[0]);
    if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
    if (aIdx !== -1) return -1;
    if (bIdx !== -1) return 1;
    return a[0].localeCompare(b[0]);
  });

  if (loading) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ArrowRightLeft className="h-5 w-5 text-primary" />
          Currency Converter
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="text-right font-mono"
            />
          </div>
          <Select value={from} onValueChange={setFrom}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {currencyOptions.map(([code, info]) => (
                <SelectItem key={code} value={code}>{code} {info.symbol}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-center">
          <button onClick={swap} className="p-1.5 rounded-full hover:bg-muted transition-colors">
            <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex-1">
            <div className="h-10 px-3 flex items-center justify-end rounded-md border bg-slate-50 dark:bg-slate-800/50 font-mono font-semibold">
              {isNaN(converted) ? '0.00' : converted.toFixed(2)}
            </div>
          </div>
          <Select value={to} onValueChange={setTo}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {currencyOptions.map(([code, info]) => (
                <SelectItem key={code} value={code}>{code} {info.symbol}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <p className="text-[11px] text-muted-foreground text-center">
          1 {from} = {exchangeRate.toFixed(4)} {to}
        </p>
      </CardContent>
    </Card>
  );
}
