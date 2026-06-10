'use client';

import Link from 'next/link';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const set = (field: string, value: string) => {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => ({ ...e, [field]: '' }));
    setApiError('');
  };

  const validate = useCallback(() => {
    const e: Record<string, string> = {};
    if (!validateEmail(form.email)) e.email = 'Enter a valid email address.';
    if (!form.password) e.password = 'Password is required.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [form]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setApiError('');

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      });

      if (error) {
        setApiError('Invalid email or password. Please try again.');
        return;
      }

      router.push('/dashboard');
      router.refresh();
    } catch {
      setApiError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (!validateEmail(form.email)) {
      setErrors(e => ({ ...e, email: 'Enter your email above to reset password.' }));
      return;
    }
    const supabase = createClient();
    await supabase.auth.resetPasswordForEmail(form.email, {
      redirectTo: `${window.location.origin}/update-password`,
    });
    setResetSent(true);
  }

  async function handleGoogle() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
  }

  return (
    <div className="card p-8 sm:p-10 w-full max-w-md animate-fade-in-up">
      <div className="mb-7 text-center">
        <h1 className="text-2xl font-black tracking-tight mb-1" style={{ color: 'var(--navy)' }}>
          Welcome back
        </h1>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Log in to continue generating resumes
        </p>
      </div>

      {apiError && <div className="alert-error mb-5">{apiError}</div>}
      {resetSent && (
        <div className="alert-success mb-5">
          Password reset link sent to <strong>{form.email}</strong>. Check your inbox.
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {/* Email */}
        <div>
          <label htmlFor="email" className="input-label">Email</label>
          <input id="email" type="email" placeholder="you@example.com" autoComplete="email"
            className={`input-field ${errors.email ? 'error' : ''}`}
            value={form.email} onChange={e => set('email', e.target.value)} />
          {errors.email && <p className="text-xs mt-1" style={{ color: 'var(--error)' }}>{errors.email}</p>}
        </div>

        {/* Password */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="password" className="input-label" style={{ margin: 0 }}>Password</label>
            <button type="button" onClick={handleForgotPassword}
              className="text-xs font-medium no-underline transition-colors"
              style={{ color: 'var(--navy)', background: 'none', border: 'none', cursor: 'pointer' }}>
              Forgot password?
            </button>
          </div>
          <input id="password" type="password" placeholder="Your password" autoComplete="current-password"
            className={`input-field ${errors.password ? 'error' : ''}`}
            value={form.password} onChange={e => set('password', e.target.value)} />
          {errors.password && <p className="text-xs mt-1" style={{ color: 'var(--error)' }}>{errors.password}</p>}
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full mt-1"
          style={{ justifyContent: 'center' }}>
          {loading ? <><span className="spinner" /> Logging in…</> : 'Log In'}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 divider" style={{ margin: 0 }} />
        <span className="text-xs" style={{ color: 'var(--muted)' }}>or</span>
        <div className="flex-1 divider" style={{ margin: 0 }} />
      </div>

      {/* Google OAuth */}
      <button onClick={handleGoogle}
        className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl border text-sm font-semibold transition-all hover:bg-gray-50"
        style={{ border: '1.5px solid var(--border)', color: 'var(--navy)' }}>
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </button>

      <p className="text-center text-sm mt-6" style={{ color: 'var(--muted)' }}>
        Don&apos;t have an account?{' '}
        <Link href="/signup" className="font-semibold no-underline" style={{ color: 'var(--navy)' }}>
          Sign up free
        </Link>
      </p>
    </div>
  );
}
