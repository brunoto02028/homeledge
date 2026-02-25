import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth';
import { getCategorizationMetrics } from '@/lib/categorization-engine';

// GET: Get categorization metrics for the current user
export async function GET() {
  try {
    const userId = await requireUserId();
    const metrics = await getCategorizationMetrics(userId);
    return NextResponse.json(metrics);
  } catch (error: any) {
    console.error('[CatMetrics] GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
  }
}
