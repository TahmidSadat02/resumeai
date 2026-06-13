// We use native fetch to call the SSLCommerz API to avoid CommonJS/ESM bundling issues in Next.js

// ---------------------------------------------------------------------------
// Minimal type surface for the sslcommerz-lts instance
// ---------------------------------------------------------------------------

interface SSLCommerzInitData {
  total_amount: number;
  currency: string;
  tran_id: string;
  success_url: string;
  fail_url: string;
  cancel_url: string;
  ipn_url: string;
  product_name: string;
  product_category: string;
  product_profile: string;
  cus_name: string;
  cus_email: string;
  cus_add1: string;
  cus_city: string;
  cus_country: string;
  cus_phone: string;
  shipping_method: string;
  ship_name: string;
  ship_add1: string;
  ship_city: string;
  ship_country: string;
  num_of_item: number;
}

interface SSLCommerzInitResponse {
  status: string;
  /** Redirect URL for the hosted payment page */
  GatewayPageURL: string;
  /** Session key to reference this transaction */
  sessionkey: string;
  failedreason?: string;
}

interface SSLCommerzValidationResponse {
  status: string;
  tran_id: string;
  val_id: string;
  amount: string;
  store_amount: string;
  bank_tran_id: string;
  card_type: string;
  currency: string;
  error?: string;
}



// ---------------------------------------------------------------------------
// Environment validation — fail fast at startup
// ---------------------------------------------------------------------------

const STORE_ID       = process.env.SSLCOMMERZ_STORE_ID;
const STORE_PASSWORD = process.env.SSLCOMMERZ_STORE_PASSWORD;
const IS_LIVE        = process.env.SSLCOMMERZ_IS_LIVE === 'true';
const APP_URL        = process.env.NEXT_PUBLIC_APP_URL;

if (!STORE_ID || !STORE_PASSWORD || !APP_URL) {
  throw new Error(
    'Missing SSLCommerz environment variables. ' +
    'Please set SSLCOMMERZ_STORE_ID, SSLCOMMERZ_STORE_PASSWORD, ' +
    'and NEXT_PUBLIC_APP_URL in your .env.local.',
  );
}

// ---------------------------------------------------------------------------
// Plan configuration
// ---------------------------------------------------------------------------

/** Billable plan tiers (free users are never charged). */
export type BillablePlan = 'pro' | 'premium';

/** Canonical prices in BDT for each plan. */
export const PLAN_PRICES: Record<BillablePlan, number> = {
  pro:     299,
  premium: 599,
};

// ---------------------------------------------------------------------------
// Return types
// ---------------------------------------------------------------------------

export interface InitPaymentResult {
  /** SSLCommerz session key — store this to verify the payment later. */
  sessionKey: string;
  /** URL to redirect the user to for completing payment. */
  redirectUrl: string;
}

export interface VerifyPaymentResult {
  /** Whether the payment was validated successfully. */
  success: boolean;
  /** SSLCommerz bank transaction ID. */
  transactionId: string;
  /** Validated amount in BDT. */
  amount: number;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Initialises an SSLCommerz payment session for a subscription upgrade.
 *
 * Call this from your `/api/payment/init` route. On success, redirect the
 * user to the returned `redirectUrl` so they can complete payment on the
 * SSLCommerz hosted page.
 *
 * @param userId - Supabase user UUID (used as the internal transaction ID).
 * @param plan   - The plan the user is upgrading to ('pro' | 'premium').
 * @param amount - Amount in BDT. Defaults to the canonical plan price if you
 *                 pass {@link PLAN_PRICES}[plan], but kept as a parameter for
 *                 flexibility (e.g. discount codes).
 * @returns Session key and redirect URL from SSLCommerz.
 * @throws {Error} When the SSLCommerz API rejects the request.
 *
 * @example
 * const { redirectUrl } = await initializePayment(userId, 'pro', PLAN_PRICES.pro);
 * return NextResponse.redirect(redirectUrl);
 */
export async function initializePayment(
  userId: string,
  plan: BillablePlan,
  amount: number,
): Promise<InitPaymentResult> {
  const baseURL = `https://${IS_LIVE ? 'securepay' : 'sandbox'}.sslcommerz.com`;
  const initURL = `${baseURL}/gwprocess/v4/api.php`;

  // Unique transaction ID: userId + timestamp to handle multiple attempts
  const tranId = `${userId}_${Date.now()}`;

  const params = new URLSearchParams();
  params.append('store_id', STORE_ID!);
  params.append('store_passwd', STORE_PASSWORD!);
  params.append('total_amount', amount.toString());
  params.append('currency', 'BDT');
  params.append('tran_id', tranId);
  params.append('success_url', `${APP_URL}/api/payment/success`);
  params.append('fail_url', `${APP_URL}/api/payment/fail`);
  params.append('cancel_url', `${APP_URL}/api/payment/cancel`);
  params.append('ipn_url', `${APP_URL}/api/payment/success`);
  params.append('product_name', `ResumeAI ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`);
  params.append('product_category', 'SaaS Subscription');
  params.append('product_profile', 'non-physical-goods');
  params.append('cus_name', 'ResumeAI User');
  params.append('cus_email', `${userId}@resumeai.app`);
  params.append('cus_add1', 'Dhaka');
  params.append('cus_city', 'Dhaka');
  params.append('cus_country', 'Bangladesh');
  params.append('cus_phone', '01700000000');
  params.append('shipping_method', 'NO');
  params.append('ship_name', 'Digital Delivery');
  params.append('ship_add1', 'N/A');
  params.append('ship_city', 'Dhaka');
  params.append('ship_country', 'Bangladesh');
  params.append('num_of_item', '1');

  // SSLCommerz library also appends empty strings for all other possible optional fields.
  // We'll map them here to match expected data structures exactly.
  const optionalFields = [
    'productcategory', 'multi_card_name', 'allowed_bin', 'emi_option',
    'emi_max_inst_option', 'emi_selected_inst', 'cus_add2', 'cus_state',
    'cus_postcode', 'cus_fax', 'shipcity', 'ship_add2', 'ship_state',
    'ship_postcode', 'ship_country', 'hours_till_departure', 'flight_type',
    'pnr', 'journey_from_to', 'third_party_booking', 'hotel_name',
    'length_of_stay', 'check_in_time', 'hotel_city', 'product_type',
    'topup_number', 'country_topup', 'cart', 'product_amount',
    'discount_amount', 'convenience_fee', 'value_a', 'value_b',
    'value_c', 'value_d'
  ];
  for (const field of optionalFields) {
    params.append(field, '');
  }

  const res = await fetch(initURL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!res.ok) {
    throw new Error(`SSLCommerz init request failed with status ${res.status}`);
  }

  const response = (await res.json()) as SSLCommerzInitResponse;

  if (response.status !== 'SUCCESS' || !response.GatewayPageURL) {
    throw new Error(
      `SSLCommerz init failed: ${response.failedreason ?? 'Unknown error'}`,
    );
  }

  return {
    sessionKey:  response.sessionkey,
    redirectUrl: response.GatewayPageURL,
  };
}

/**
 * Verifies a completed SSLCommerz payment using the `val_id` posted to the
 * success/IPN webhook by SSLCommerz.
 *
 * Call this inside your `/api/payment/success` route handler after receiving
 * the POST from SSLCommerz. Only upgrade the user's subscription when this
 * returns `success: true`.
 *
 * @param valId - The `val_id` value from the SSLCommerz success POST body.
 * @returns Payment validation result including transaction ID and amount.
 * @throws {Error} When the validation API call itself fails (network error etc.).
 *
 * @example
 * const { success, transactionId } = await verifyPayment(formData.get('val_id'));
 * if (success) { // upgrade user plan in Supabase }
 */
export async function verifyPayment(
  valId: string,
): Promise<VerifyPaymentResult> {
  const baseURL = `https://${IS_LIVE ? 'securepay' : 'sandbox'}.sslcommerz.com`;
  const validationURL = `${baseURL}/validator/api/validationserverAPI.php?val_id=${valId}&store_id=${STORE_ID}&store_passwd=${STORE_PASSWORD}&v=1&format=json`;

  const res = await fetch(validationURL, {
    method: 'GET',
  });

  if (!res.ok) {
    throw new Error(`SSLCommerz verification request failed with status ${res.status}`);
  }

  const response = (await res.json()) as SSLCommerzValidationResponse;

  const success =
    response.status === 'VALID' || response.status === 'VALIDATED';

  return {
    success,
    transactionId: response.bank_tran_id ?? response.tran_id ?? '',
    amount:        parseFloat(response.store_amount ?? response.amount ?? '0'),
  };
}
