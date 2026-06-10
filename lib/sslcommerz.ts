// sslcommerz-lts ships as a plain CommonJS module with no bundled types
// eslint-disable-next-line @typescript-eslint/no-require-imports
const SSLCommerzPayment = require('sslcommerz-lts') as new (
  storeId: string,
  storePassword: string,
  isLive: boolean,
) => SSLCommerzInstance;

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

interface SSLCommerzInstance {
  init(data: SSLCommerzInitData): Promise<SSLCommerzInitResponse>;
  validate(data: { val_id: string }): Promise<SSLCommerzValidationResponse>;
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
  const sslcz: SSLCommerzInstance = new SSLCommerzPayment(
    STORE_ID!,
    STORE_PASSWORD!,
    IS_LIVE,
  );

  // Unique transaction ID: userId + timestamp to handle multiple attempts
  const tranId = `${userId}_${Date.now()}`;

  const data: SSLCommerzInitData = {
    total_amount:     amount,
    currency:         'BDT',
    tran_id:          tranId,
    // SSLCommerz posts to these URLs after payment
    success_url:      `${APP_URL}/api/payment/success`,
    fail_url:         `${APP_URL}/api/payment/fail`,
    cancel_url:       `${APP_URL}/api/payment/cancel`,
    ipn_url:          `${APP_URL}/api/payment/success`, // IPN mirrors success handler
    product_name:     `ResumeAI ${plan.charAt(0).toUpperCase() + plan.slice(1)} Plan`,
    product_category: 'SaaS Subscription',
    product_profile:  'non-physical-goods',
    // Customer fields — SSLCommerz requires these even for digital goods
    cus_name:         'ResumeAI User',
    cus_email:        `${userId}@resumeai.app`, // replaced server-side with real email
    cus_add1:         'Dhaka',
    cus_city:         'Dhaka',
    cus_country:      'Bangladesh',
    cus_phone:        '01700000000',
    // Shipping — not applicable for digital products but required by SSLCommerz
    shipping_method:  'NO',
    ship_name:        'Digital Delivery',
    ship_add1:        'N/A',
    ship_city:        'Dhaka',
    ship_country:     'Bangladesh',
    num_of_item:      1,
  };

  const response = await sslcz.init(data);

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
  const sslcz: SSLCommerzInstance = new SSLCommerzPayment(
    STORE_ID!,
    STORE_PASSWORD!,
    IS_LIVE,
  );

  const response = await sslcz.validate({ val_id: valId });

  const success =
    response.status === 'VALID' || response.status === 'VALIDATED';

  return {
    success,
    transactionId: response.bank_tran_id ?? response.tran_id ?? '',
    amount:        parseFloat(response.store_amount ?? response.amount ?? '0'),
  };
}
