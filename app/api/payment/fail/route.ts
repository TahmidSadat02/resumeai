import { NextRequest, NextResponse } from 'next/server';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? '';

/**
 * POST /api/payment/fail
 *
 * SSLCommerz redirects here when the payment fails (card decline, timeout, etc.).
 * Logs the failure details from the POST body and redirects the user to the
 * dashboard with an error message.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const tranId = formData.get('tran_id') as string | null;
    const status = formData.get('status')  as string | null;
    const error  = formData.get('error')   as string | null;

    console.warn('[/api/payment/fail] Payment failed:', { tranId, status, error });

    return NextResponse.redirect(`${APP_URL}/dashboard?payment=failed`, 302);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error.';
    console.error('[/api/payment/fail] Unhandled error:', message);
    return NextResponse.redirect(`${APP_URL}/dashboard?payment=error`, 302);
  }
}
