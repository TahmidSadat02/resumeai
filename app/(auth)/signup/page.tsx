'use client';

import type { Metadata } from 'next';
import Link from 'next/link';
import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

// ─── Validation ───────────────────────────────────────────────────────────────
function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
function validatePassword(pw: string) {
  return pw.length >= 8;
}

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ fullName: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const set = (field: string, value: string) => {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => ({ ...e, [field]: '' }));
    setApiError('');
  };

  const validate = useCallback(() => {
    const e: Record<string, string> = {};
    if (!form.fullName.trim()) e.fullName = 'Full name is required.';
    if (!validateEmail(form.email)) e.email = 'Enter a valid email address.';
    if (!validatePassword(form.password)) e.password = 'Password must be at least 8 characters.';
    if (form.password !== form.confirm) e.confirm = 'Passwords do not match.';
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
      const { error } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: { data: { full_name: form.fullName } },
      });

      if (error) {
        if (error.message.toLowerCase().includes('already')) {
          setApiError('An account with this email already exists. Please log in.');
        } else {
          setApiError(error.message);
        }
        return;
      }

      setSuccess(true);
    } catch {
      setApiError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
  }

  if (success) {
    return (
      <div className="card p-10 w-full max-w-md text-center animate-fade-in-up">
        <div className="text-5xl mb-4">✉️</div>
        <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--navy)' }}>Check your inbox</h2>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          We sent a confirmation link to <strong>{form.email}</strong>.
          Click it to activate your account, then come back to log in.
        </p>
        <Link href="/login" className="btn-primary mt-6 w-full text-center">Go to Login</Link>
      </div>
    );
  }

  return (
    <div className="card p-8 sm:p-10 w-full max-w-md animate-fade-in-up">
      <div className="mb-7 text-center">
        <h1 className="text-2xl font-black tracking-tight mb-1" style={{ color: 'var(--navy)' }}>
          Create your account
        </h1>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          5 free resume generations · No credit card needed
        </p>
      </div>

      {apiError && <div className="alert-error mb-5">{apiError}</div>}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {/* Full Name */}
        <div>
          <label htmlFor="fullName" className="input-label">Full Name</label>
          <input id="fullName" type="text" placeholder="Tahmid Sadat" autoComplete="name"
            className={`input-field ${errors.fullName ? 'error' : ''}`}
            value={form.fullName} onChange={e => set('fullName', e.target.value)} />
          {errors.fullName && <p className="text-xs mt-1" style={{ color: 'var(--error)' }}>{errors.fullName}</p>}
        </div>

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
          <label htmlFor="password" className="input-label">Password</label>
          <input id="password" type="password" placeholder="Min. 8 characters" autoComplete="new-password"
            className={`input-field ${errors.password ? 'error' : ''}`}
            value={form.password} onChange={e => set('password', e.target.value)} />
          {errors.password && <p className="text-xs mt-1" style={{ color: 'var(--error)' }}>{errors.password}</p>}
        </div>

        {/* Confirm */}
        <div>
          <label htmlFor="confirm" className="input-label">Confirm Password</label>
          <input id="confirm" type="password" placeholder="Repeat your password" autoComplete="new-password"
            className={`input-field ${errors.confirm ? 'error' : ''}`}
            value={form.confirm} onChange={e => set('confirm', e.target.value)} />
          {errors.confirm && <p className="text-xs mt-1" style={{ color: 'var(--error)' }}>{errors.confirm}</p>}
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full mt-1"
          style={{ justifyContent: 'center' }}>
          {loading ? <><span className="spinner" /> Creating account…</> : 'Create Account'}
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
        Already have an account?{' '}
        <Link href="/login" className="font-semibold no-underline" style={{ color: 'var(--navy)' }}>
          Log in
        </Link>
      </p>
    </div>
  );
}
