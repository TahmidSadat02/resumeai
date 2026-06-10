import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateCoverLetter, selectModel } from '@/lib/gemini';
import type { PlanType } from '@/types/database';

/**
 * POST /api/generate/cover-letter
 *
 * Authenticates the user, checks their plan & usage quota, then calls
 * Gemini to generate a cover letter. Saves a generation log to Supabase
 * and returns the AI output.
 *
 * Body:    { userInput: string, jobDescription: string }
 * Returns: { coverLetter: string }
 */
export async function POST(request: NextRequest) {
  try {
    // ── 1. Authenticate user ─────────────────────────────────────────────────
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthenticated. Please log in.' },
        { status: 401 },
      );
    }

    // ── 2. Parse and validate request body ───────────────────────────────────
    const body = await request.json() as {
      userInput?: string;
      jobDescription?: string;
    };

    const { userInput, jobDescription } = body;

    if (!userInput || typeof userInput !== 'string' || userInput.trim() === '') {
      return NextResponse.json(
        { error: 'userInput is required and must be a non-empty string.' },
        { status: 400 },
      );
    }

    if (!jobDescription || typeof jobDescription !== 'string' || jobDescription.trim() === '') {
      return NextResponse.json(
        { error: 'jobDescription is required and must be a non-empty string.' },
        { status: 400 },
      );
    }

    // ── 3. Fetch user's active subscription ──────────────────────────────────
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('plan, status, generation_limit, generations_used')
      .eq('user_id', user.id)
      .single();

    if (subError || !subscription) {
      return NextResponse.json(
        { error: 'Could not load subscription. Please try again.' },
        { status: 500 },
      );
    }

    // ── 4. Enforce generation quota ──────────────────────────────────────────
    if (subscription.status !== 'active') {
      return NextResponse.json(
        { error: 'Your subscription is not active.' },
        { status: 403 },
      );
    }

    if (subscription.generations_used >= subscription.generation_limit) {
      return NextResponse.json(
        {
          error: 'Generation limit reached. Please upgrade your plan.',
          limit: subscription.generation_limit,
          used:  subscription.generations_used,
        },
        { status: 429 },
      );
    }

    // ── 5. Select model based on plan and call Gemini ────────────────────────
    const model       = selectModel(subscription.plan as PlanType);
    const coverLetter = await generateCoverLetter(userInput.trim(), jobDescription.trim(), model);

    // ── 6. Increment usage counter in subscriptions ──────────────────────────
    await supabase
      .from('subscriptions')
      .update({ generations_used: subscription.generations_used + 1 })
      .eq('user_id', user.id);

    // ── 7. Log generation to Supabase ────────────────────────────────────────
    const { error: logError } = await supabase
      .from('generations')
      .insert({
        user_id:        user.id,
        type:           'cover_letter',
        input_data:     { userInput: userInput.trim(), jobDescription: jobDescription.trim() },
        output_content: coverLetter,
        model_version:  model,
        is_saved:       false,
      });

    if (logError) {
      // Non-fatal — the generation succeeded; just warn
      console.warn('[/api/generate/cover-letter] Failed to log generation:', logError.message);
    }

    return NextResponse.json({ coverLetter }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error.';
    console.error('[/api/generate/cover-letter]', message);

    if (message.includes('rate limit') || message.includes('quota')) {
      return NextResponse.json({ error: 'AI rate limit reached. Try again shortly.' }, { status: 429 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
