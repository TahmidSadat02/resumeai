export type PlanType = 'free' | 'pro' | 'premium';
export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'trialing';
export type GenerationType = 'resume' | 'cover_letter';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type ThemePreference = 'light' | 'dark' | 'system';

/**
 * Represents a user profile, extending the default Supabase auth.users.
 */
export interface User {
  /** Unique UUID matching auth.users */
  id: string;
  /** User's email address */
  email: string;
  /** Full name of the user, parsed from auth metadata if available */
  full_name: string | null;
  /** URL to the user's avatar image */
  avatar_url: string | null;
  /** User's phone number */
  phone: string | null;
  /** User's country of residence */
  country: string | null;
  /** Timestamp when the profile was created */
  created_at: string;
  /** Timestamp when the profile was last updated */
  updated_at: string;
}

/**
 * Tracks a user's subscription plan, status, and usage limits.
 */
export interface Subscription {
  /** Unique identifier for the subscription record */
  id: string;
  /** The user ID this subscription belongs to */
  user_id: string;
  /** The subscription plan tier */
  plan: PlanType;
  /** Current status of the subscription */
  status: SubscriptionStatus;
  /** SSLCommerz transaction reference */
  transaction_id: string | null;
  /** Amount paid during the last transaction */
  amount_paid: number | null;
  /** Currency of the payment (e.g., 'BDT') */
  currency: string | null;
  /** End date of the current billing cycle */
  current_period_end: string | null;
  /** Number of AI generations allowed per cycle */
  generation_limit: number;
  /** Number of AI generations used in the current cycle */
  generations_used: number;
  /** Timestamp when the subscription was created */
  created_at: string;
  /** Timestamp when the subscription was last updated */
  updated_at: string;
}

/**
 * Defines a resume template available for users.
 */
export interface Template {
  /** Unique identifier for the template */
  id: string;
  /** Name of the template */
  name: string;
  /** Brief description of the template's style or use case */
  description: string | null;
  /** URL to an image preview of the template */
  thumbnail_url: string | null;
  /** JSON configuration defining layout, styles, etc. */
  config: Record<string, any>;
  /** Indicates if the template requires a pro/premium plan */
  is_premium: boolean;
  /** Indicates if the template is currently available for use */
  is_active: boolean;
  /** Timestamp when the template was created */
  created_at: string;
  /** Timestamp when the template was last updated */
  updated_at: string;
}

/**
 * Logs an AI-generated resume or cover letter.
 */
export interface Generation {
  /** Unique identifier for the generation log */
  id: string;
  /** The user ID who initiated the generation */
  user_id: string;
  /** The template ID used (if applicable) */
  template_id: string | null;
  /** Type of document generated */
  type: GenerationType;
  /** Raw user input used for generation (e.g., job title, experience) */
  input_data: Record<string, any>;
  /** The resulting AI-generated content (Markdown, HTML, etc.) */
  output_content: string | null;
  /** Version of the Gemini model used */
  model_version: string | null;
  /** Self-evaluated quality score of the output (0-100) */
  quality_score: number | null;
  /** Number of tokens consumed during generation */
  tokens_used: number | null;
  /** User-provided title to save this generation */
  title: string | null;
  /** Indicates if the user saved this generation for later */
  is_saved: boolean;
  /** Timestamp when the generation occurred */
  created_at: string;
  /** Timestamp when the generation log was last updated */
  updated_at: string;
}

/**
 * Stores user preferences and application settings.
 */
export interface UserSettings {
  /** Unique identifier for the settings record */
  id: string;
  /** The user ID these settings belong to */
  user_id: string;
  /** UI theme preference */
  theme: ThemePreference;
  /** Preferred UI language code (e.g., 'en') */
  language: string;
  /** Indicates if the user wants email notifications */
  notify_email: boolean;
  /** Indicates if the user wants in-app tips and tricks */
  notify_tips: boolean;
  /** ID of the user's preferred default template */
  default_template_id: string | null;
  /** Extensible JSON field for additional preferences */
  extra: Record<string, any>;
  /** Timestamp when the settings were created */
  created_at: string;
  /** Timestamp when the settings were last updated */
  updated_at: string;
}
