import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Hardcoded fallback rates (GBP base) - updated periodically
const FALLBACK_RATES: Record<string, number> = {
  GBP: 1,
  USD: 1.27,
  EUR: 1.17,
  BRL: 6.35,
  CAD: 1.73,
  AUD: 1.93,
  JPY: 191.5,
  CHF: 1.12,
  INR: 106.5,
  CNY: 9.22,
  PLN: 5.07,
  SEK: 13.2,
  NOK: 13.5,
  DKK: 8.72,
  ZAR: 23.1,
  NZD: 2.09,
  SGD: 1.71,
  HKD: 9.88,
  KRW: 1740,
  MXN: 21.8,
  TRY: 38.5,
  AED: 4.67,
  SAR: 4.76,
  NGN: 2010,
  PKR: 354,
  BDT: 152,
  PHP: 72.3,
  THB: 44.1,
  VND: 32200,
  EGP: 62.5,
};

const CURRENCY_INFO: Record<string, { name: string; symbol: string }> = {
  GBP: { name: 'British Pound', symbol: '£' },
  USD: { name: 'US Dollar', symbol: '$' },
  EUR: { name: 'Euro', symbol: '€' },
  BRL: { name: 'Brazilian Real', symbol: 'R$' },
  CAD: { name: 'Canadian Dollar', symbol: 'CA$' },
  AUD: { name: 'Australian Dollar', symbol: 'A$' },
  JPY: { name: 'Japanese Yen', symbol: '¥' },
  CHF: { name: 'Swiss Franc', symbol: 'CHF' },
  INR: { name: 'Indian Rupee', symbol: '₹' },
  CNY: { name: 'Chinese Yuan', symbol: '¥' },
  PLN: { name: 'Polish Zloty', symbol: 'zł' },
  SEK: { name: 'Swedish Krona', symbol: 'kr' },
  NOK: { name: 'Norwegian Krone', symbol: 'kr' },
  DKK: { name: 'Danish Krone', symbol: 'kr' },
  ZAR: { name: 'South African Rand', symbol: 'R' },
  NZD: { name: 'New Zealand Dollar', symbol: 'NZ$' },
  SGD: { name: 'Singapore Dollar', symbol: 'S$' },
  HKD: { name: 'Hong Kong Dollar', symbol: 'HK$' },
  KRW: { name: 'South Korean Won', symbol: '₩' },
  MXN: { name: 'Mexican Peso', symbol: 'MX$' },
  TRY: { name: 'Turkish Lira', symbol: '₺' },
  AED: { name: 'UAE Dirham', symbol: 'د.إ' },
  SAR: { name: 'Saudi Riyal', symbol: '﷼' },
  NGN: { name: 'Nigerian Naira', symbol: '₦' },
  PKR: { name: 'Pakistani Rupee', symbol: '₨' },
  BDT: { name: 'Bangladeshi Taka', symbol: '৳' },
  PHP: { name: 'Philippine Peso', symbol: '₱' },
  THB: { name: 'Thai Baht', symbol: '฿' },
  VND: { name: 'Vietnamese Dong', symbol: '₫' },
  EGP: { name: 'Egyptian Pound', symbol: 'E£' },
};

// GET - Get exchange rates and convert
export async function GET(request: Request) {
  try {
    await requireUserId();
    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from')?.toUpperCase() || 'GBP';
    const to = searchParams.get('to')?.toUpperCase();
    const amount = parseFloat(searchParams.get('amount') || '1');

    if (to) {
      // Convert specific amount
      const fromRate = FALLBACK_RATES[from] || 1;
      const toRate = FALLBACK_RATES[to] || 1;
      const converted = (amount / fromRate) * toRate;
      const rate = toRate / fromRate;

      return NextResponse.json({
        from,
        to,
        amount,
        converted: Math.round(converted * 100) / 100,
        rate: Math.round(rate * 10000) / 10000,
        source: 'fallback',
      });
    }

    // Return all rates relative to base
    const baseRate = FALLBACK_RATES[from] || 1;
    const rates: Record<string, { rate: number; name: string; symbol: string }> = {};

    Object.entries(FALLBACK_RATES).forEach(([code, rate]) => {
      rates[code] = {
        rate: Math.round((rate / baseRate) * 10000) / 10000,
        name: CURRENCY_INFO[code]?.name || code,
        symbol: CURRENCY_INFO[code]?.symbol || code,
      };
    });

    return NextResponse.json({
      base: from,
      rates,
      source: 'fallback',
      lastUpdated: '2025-01-15',
    });
  } catch (error: any) {
    if (error.message === 'UNAUTHORIZED') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}
