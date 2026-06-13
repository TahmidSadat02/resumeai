/**
 * lib/api.ts
 * Client-side utility functions for communicating with Next.js API routes.
 * All functions use fetch() and return typed results.
 * Import these in page/component files — never call API routes directly.
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ApiError {
  error: string;
  limit?: number;
  used?: number;
}

export interface GenerateResumeResult {
  resume: string;
}

export interface GenerateCoverLetterResult {
  coverLetter: string;
}

export interface InitPaymentResult {
  sessionKey: string;
  redirectUrl: string;
}

export interface GenerationHistoryItem {
  id: string;
  type: 'resume' | 'cover_letter';
  title: string | null;
  is_saved: boolean;
  model_version: string | null;
  created_at: string;
}

export interface SubscriptionInfo {
  plan: 'free' | 'pro' | 'premium';
  status: string;
  generation_limit: number;
  generations_used: number;
  current_period_end: string | null;
  amount_paid: number | null;
  transaction_id: string | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function apiFetch<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...options,
  });

  const data = await res.json();

  if (!res.ok) {
    throw Object.assign(new Error((data as ApiError).error ?? 'Request failed'), data);
  }

  return data as T;
}

// ─── Generation API ───────────────────────────────────────────────────────────

/**
 * Sends user input to the resume generation API route.
 * @returns The generated resume as a JSON string (standard) or plain text (ats).
 */
export async function apiGenerateResume(
  userInput: string,
  jobDescription: string,
  format: 'standard' | 'ats' = 'standard',
): Promise<GenerateResumeResult> {
  return apiFetch<GenerateResumeResult>('/api/generate/resume', {
    method: 'POST',
    body: JSON.stringify({ userInput, jobDescription, format }),
  });
}

/**
 * Sends user input to the cover letter generation API route.
 * @returns The generated cover letter as plain text.
 */
export async function apiGenerateCoverLetter(
  userInput: string,
  jobDescription: string,
): Promise<GenerateCoverLetterResult> {
  return apiFetch<GenerateCoverLetterResult>('/api/generate/cover-letter', {
    method: 'POST',
    body: JSON.stringify({ userInput, jobDescription }),
  });
}

// ─── Payment API ──────────────────────────────────────────────────────────────

/**
 * Initialises an SSLCommerz payment session.
 * @returns Session key and redirect URL to forward the user to.
 */
export async function apiInitPayment(
  userId: string,
  plan: 'pro' | 'premium',
): Promise<InitPaymentResult> {
  return apiFetch<InitPaymentResult>('/api/payment/init', {
    method: 'POST',
    body: JSON.stringify({ userId, plan }),
  });
}

// ─── Supabase data helpers (client-side) ──────────────────────────────────────

import { createClient } from '@/lib/supabase/client';

/**
 * Fetches the authenticated user's subscription row.
 */
export async function fetchSubscription(): Promise<SubscriptionInfo | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('subscriptions')
    .select('plan,status,generation_limit,generations_used,current_period_end,amount_paid,transaction_id')
    .eq('user_id', user.id)
    .single();

  return data as SubscriptionInfo | null;
}

/**
 * Fetches the authenticated user's generation history (most recent 50).
 */
export async function fetchGenerationHistory(): Promise<GenerationHistoryItem[]> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('generations')
    .select('id,type,title,is_saved,model_version,created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  return (data ?? []) as GenerationHistoryItem[];
}

/**
 * Signs out the current user.
 */
export async function apiSignOut(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
}
