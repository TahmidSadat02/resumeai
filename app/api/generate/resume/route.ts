import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { generateResume, selectModel } from '@/lib/gemini';
import type { PlanType } from '@/types/database';

/**
 * POST /api/generate/resume
 *
 * Authenticates the user, checks their plan & usage quota, then calls
 * Gemini to generate a resume. Saves a generation log to Supabase and
 * returns the AI output.
 *
 * Body:    { userInput: string, jobDescription: string }
 * Returns: { resume: string, tokensUsed: number }
 */
export async function POST(request: NextRequest) {
  try {
    // ── 1. Parse request body FIRST (Fixes Next.js POST hanging bug) ─────────
    const body = await request.json() as {
      userInput?: string;
      jobDescription?: string;
      format?: 'standard' | 'ats';
    };

    const { userInput, jobDescription, format = 'standard' } = body;

    // ── 2. Authenticate user ─────────────────────────────────────────────────
    const supabase = await createClient();
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    const user = session?.user;

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthenticated. Please log in.' },
        { status: 401 },
      );
    }

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
    const model  = selectModel(subscription.plan as PlanType);
    const resume = await generateResume(userInput.trim(), jobDescription.trim(), model, format);

    // ── 6. Increment usage counter in subscriptions ──────────────────────────
    await supabase
      .from('subscriptions')
      .update({ generations_used: subscription.generations_used + 1 })
      .eq('user_id', user.id);

    // ── 7. Log generation to Supabase ────────────────────────────────────────
    const { error: logError } = await supabase
      .from('generations')
      .insert({
        user_id:       user.id,
        type:          'resume',
        input_data:    { userInput: userInput.trim(), jobDescription: jobDescription.trim() },
        output_content: resume,
        model_version: model,
        is_saved:      false,
      });

    if (logError) {
      // Non-fatal — the generation succeeded; just warn
      console.warn('[/api/generate/resume] Failed to log generation:', logError.message);
    }

    return NextResponse.json({ resume }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unexpected error.';
    console.error('[/api/generate/resume]', message);

    // Surface quota/content errors to the client with a clear status
    if (message.includes('rate limit') || message.includes('quota')) {
      return NextResponse.json({ error: 'AI rate limit reached. Try again shortly.' }, { status: 429 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
