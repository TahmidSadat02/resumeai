import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { initializePayment, PLAN_PRICES, type BillablePlan } from '@/lib/sslcommerz';

/**
 * POST /api/payment/init
 *
 * Initialises an SSLCommerz payment session for a plan upgrade.
 * The client should redirect the user to the returned `redirectUrl`.
 *
 * Body: { userId: string, plan: 'pro' | 'premium' }
 * Returns: { sessionKey: string, redirectUrl: string }
 */
export async function POST(request: NextRequest) {
  try {
    // ── 1. Parse and validate request body ──────────────────────────────────
    const body = await request.json() as { userId?: string; plan?: string };
    const { userId, plan } = body;

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid userId.' },
        { status: 400 },
      );
    }

    if (!plan || (plan !== 'pro' && plan !== 'premium')) {
      return NextResponse.json(
        { error: 'Invalid plan. Must be "pro" or "premium".' },
        { status: 400 },
      );
    }

    // ── 2. Verify the requesting user is authenticated and matches userId ────
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthenticated. Please log in.' },
        { status: 401 },
      );
    }

    if (user.id !== userId) {
      return NextResponse.json(
        { error: 'Forbidden. userId mismatch.' },
        { status: 403 },
      );
    }

    // ── 3. Initialise payment session ────────────────────────────────────────
    const amount = PLAN_PRICES[plan as BillablePlan];
    const result = await initializePayment(userId, plan as BillablePlan, amount);

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error.';
    console.error('[/api/payment/init]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
