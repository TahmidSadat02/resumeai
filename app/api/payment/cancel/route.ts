import { NextRequest, NextResponse } from 'next/server';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? '';

/**
 * POST /api/payment/cancel
 *
 * SSLCommerz redirects here when the user cancels the payment on the
 * hosted payment page. Logs the event and redirects back to the dashboard.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const tranId = formData.get('tran_id') as string | null;
    const status = formData.get('status')  as string | null;

    console.info('[/api/payment/cancel] Payment cancelled by user:', { tranId, status });

    return NextResponse.redirect(`${APP_URL}/dashboard?payment=cancelled`, 302);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error.';
    console.error('[/api/payment/cancel] Unhandled error:', message);
    return NextResponse.redirect(`${APP_URL}/dashboard?payment=error`, 302);
  }
}
