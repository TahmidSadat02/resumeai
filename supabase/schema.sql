-- ============================================================
-- ResumeAI — Supabase Database Schema
-- Run this entire script in the Supabase SQL Editor once.
-- ============================================================


-- ============================================================
-- ENUMS
-- ============================================================

-- Subscription plan tiers
CREATE TYPE plan_type AS ENUM ('free', 'pro', 'premium');

-- Subscription status
CREATE TYPE subscription_status AS ENUM ('active', 'expired', 'cancelled', 'trialing');

-- Type of AI-generated document
CREATE TYPE generation_type AS ENUM ('resume', 'cover_letter');

-- Payment gateway status
CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');


-- ============================================================
-- TABLE: users
-- Extends auth.users with additional profile information.
-- One row is auto-inserted per user on signup via trigger.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.users (
  id            uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         text        NOT NULL UNIQUE,
  full_name     text,
  avatar_url    text,
  phone         text,
  country       text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- Index for fast email lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Auto-update updated_at on any row change
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-insert a users row when a new auth.users row is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);


-- ============================================================
-- TABLE: subscriptions
-- Tracks each user's current plan, billing cycle, and status.
-- Each user has at most one active subscription row.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                  uuid              PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid              NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  plan                plan_type         NOT NULL DEFAULT 'free',
  status              subscription_status NOT NULL DEFAULT 'active',
  -- SSLCommerz transaction reference
  transaction_id      text,
  amount_paid         numeric(10, 2),
  currency            text              DEFAULT 'BDT',
  -- When the current billing period ends
  current_period_end  timestamptz,
  -- How many AI generations the user gets per cycle
  generation_limit    int               NOT NULL DEFAULT 5,
  generations_used    int               NOT NULL DEFAULT 0,
  created_at          timestamptz       NOT NULL DEFAULT now(),
  updated_at          timestamptz       NOT NULL DEFAULT now()
);

-- Index for fast per-user subscription lookups
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id  ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status   ON public.subscriptions(status);

CREATE TRIGGER trg_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create a free subscription for every new user
CREATE OR REPLACE FUNCTION public.handle_new_subscription()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.subscriptions (user_id, plan, status, generation_limit)
  VALUES (NEW.id, 'free', 'active', 5);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_on_user_created_subscription
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_subscription();

-- RLS
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscription"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users cannot directly modify subscriptions"
  ON public.subscriptions FOR UPDATE
  USING (false);  -- Only server-side (service role) can update


-- ============================================================
-- TABLE: templates
-- Stores resume template designs available to users.
-- Populated by admins; read-only for regular users.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.templates (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text        NOT NULL,
  description   text,
  thumbnail_url text,
  -- JSON structure defining the template layout/styles
  config        jsonb       NOT NULL DEFAULT '{}',
  -- If true, only pro/premium users can use it
  is_premium    boolean     NOT NULL DEFAULT false,
  is_active     boolean     NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_templates_is_premium ON public.templates(is_premium);
CREATE INDEX IF NOT EXISTS idx_templates_is_active  ON public.templates(is_active);

CREATE TRIGGER trg_templates_updated_at
  BEFORE UPDATE ON public.templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read active templates
CREATE POLICY "Authenticated users can view active templates"
  ON public.templates FOR SELECT
  TO authenticated
  USING (is_active = true);


-- ============================================================
-- TABLE: generations
-- Logs every AI-generated resume or cover letter.
-- Stores the input, output, and metadata for each generation.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.generations (
  id              uuid              PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid              NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  template_id     uuid              REFERENCES public.templates(id) ON DELETE SET NULL,
  type            generation_type   NOT NULL,
  -- Raw user input (job title, experience, job description, etc.)
  input_data      jsonb             NOT NULL DEFAULT '{}',
  -- The final AI-generated content (HTML or Markdown)
  output_content  text,
  -- Which Gemini model version was used
  model_version   text              DEFAULT 'gemini-2.0-flash',
  -- Generation quality score (0–100) from self-evaluation
  quality_score   int,
  -- Token usage for cost tracking
  tokens_used     int,
  -- User can name/save generations
  title           text,
  is_saved        boolean           NOT NULL DEFAULT false,
  created_at      timestamptz       NOT NULL DEFAULT now(),
  updated_at      timestamptz       NOT NULL DEFAULT now()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_generations_user_id    ON public.generations(user_id);
CREATE INDEX IF NOT EXISTS idx_generations_type       ON public.generations(type);
CREATE INDEX IF NOT EXISTS idx_generations_is_saved   ON public.generations(is_saved);
CREATE INDEX IF NOT EXISTS idx_generations_created_at ON public.generations(created_at DESC);

CREATE TRIGGER trg_generations_updated_at
  BEFORE UPDATE ON public.generations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- RLS
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own generations"
  ON public.generations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own generations"
  ON public.generations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own generations"
  ON public.generations FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own generations"
  ON public.generations FOR DELETE
  USING (auth.uid() = user_id);


-- ============================================================
-- TABLE: user_settings
-- Stores per-user preferences such as theme and language.
-- One row per user, created automatically on signup.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_settings (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid        NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  -- UI theme preference
  theme           text        NOT NULL DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
  -- Preferred UI language
  language        text        NOT NULL DEFAULT 'en',
  -- Email notification toggles
  notify_email    boolean     NOT NULL DEFAULT true,
  notify_tips     boolean     NOT NULL DEFAULT true,
  -- Default template selection
  default_template_id uuid    REFERENCES public.templates(id) ON DELETE SET NULL,
  -- Any extra preferences stored as JSON (extensible)
  extra           jsonb       NOT NULL DEFAULT '{}',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);

CREATE TRIGGER trg_user_settings_updated_at
  BEFORE UPDATE ON public.user_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create default settings for every new user
CREATE OR REPLACE FUNCTION public.handle_new_user_settings()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.user_settings (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_on_user_created_settings
  AFTER INSERT ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_settings();

-- RLS
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own settings"
  ON public.user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
  ON public.user_settings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
