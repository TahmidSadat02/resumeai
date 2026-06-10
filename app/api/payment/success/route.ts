import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyPayment } from '@/lib/sslcommerz';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? '';

/**
 * POST /api/payment/success
 *
 * SSLCommerz posts here (and to the IPN URL) after a successful payment.
 * This handler:
 *   1. Reads form-encoded POST data from SSLCommerz
 *   2. Verifies the payment via SSLCommerz validation API
 *   3. Derives the user ID from tran_id (format: "{userId}_{timestamp}")
 *   4. Upgrades the user's subscription in Supabase
 *   5. Redirects to /dashboard?payment=success
 */
export async function POST(request: NextRequest) {
  try {
    // ── 1. Parse form-encoded body from SSLCommerz ───────────────────────────
    const formData = await request.formData();
    const valId   = formData.get('val_id')   as string | null;
    const tranId  = formData.get('tran_id')  as string | null;
    const status  = formData.get('status')   as string | null;

    console.log('[/api/payment/success] received:', { valId, tranId, status });

    if (!valId || !tranId) {
      console.error('[/api/payment/success] Missing val_id or tran_id');
      return NextResponse.redirect(`${APP_URL}/dashboard?payment=error`, 302);
    }

    // ── 2. Verify payment with SSLCommerz ────────────────────────────────────
    const verification = await verifyPayment(valId);

    if (!verification.success) {
      console.error('[/api/payment/success] Verification failed for val_id:', valId);
      return NextResponse.redirect(`${APP_URL}/dashboard?payment=failed`, 302);
    }

    // ── 3. Derive userId from tran_id (format: "{userId}_{timestamp}") ───────
    // tran_id is built in lib/sslcommerz.ts as `${userId}_${Date.now()}`
    const userId = tranId.split('_').slice(0, -1).join('_');

    if (!userId) {
      console.error('[/api/payment/success] Could not derive userId from tran_id:', tranId);
      return NextResponse.redirect(`${APP_URL}/dashboard?payment=error`, 302);
    }

    // ── 4. Determine which plan was purchased from the amount ─────────────────
    const plan = verification.amount >= 500 ? 'premium' : 'pro';

    // ── 5. Upgrade subscription in Supabase using service-role client ─────────
    // Note: We use createClient() here. For production, prefer a service-role
    // client so this succeeds even when the user session isn't in the cookie.
    const supabase = await createClient();

    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1); // 1-month billing cycle

    const { error: subError } = await supabase
      .from('subscriptions')
      .update({
        plan,
        status:             'active',
        transaction_id:     verification.transactionId,
        amount_paid:        verification.amount,
        currency:           'BDT',
        current_period_end: periodEnd.toISOString(),
        generation_limit:   plan === 'premium' ? 200 : 50,
        generations_used:   0,        // reset usage on upgrade
        updated_at:         new Date().toISOString(),
      })
      .eq('user_id', userId);

    if (subError) {
      console.error('[/api/payment/success] Supabase subscription update failed:', subError);
      // Don't block the redirect — payment was real; investigate via logs
    }

    return NextResponse.redirect(`${APP_URL}/dashboard?payment=success`, 302);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error.';
    console.error('[/api/payment/success] Unhandled error:', message);
    return NextResponse.redirect(`${APP_URL}/dashboard?payment=error`, 302);
  }
}
