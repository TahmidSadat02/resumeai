'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [form, setForm] = useState({ password: '', confirmPassword: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState('');
  const [apiSuccess, setApiSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (field: string, value: string) => {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => ({ ...e, [field]: '' }));
    setApiError('');
  };

  const validate = useCallback(() => {
    const e: Record<string, string> = {};
    if (!form.password || form.password.length < 6) {
      e.password = 'Password must be at least 6 characters long.';
    }
    if (form.password !== form.confirmPassword) {
      e.confirmPassword = 'Passwords do not match.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [form]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setApiError('');
    setApiSuccess('');

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({
        password: form.password,
      });

      if (error) {
        setApiError(error.message);
        return;
      }

      setApiSuccess('Password updated successfully! Redirecting to dashboard...');
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);
    } catch {
      setApiError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-8 sm:p-10 w-full max-w-md animate-fade-in-up">
      <div className="mb-7 text-center">
        <h1 className="text-2xl font-black tracking-tight mb-1" style={{ color: 'var(--navy)' }}>
          Update password
        </h1>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Enter a new secure password for your account
        </p>
      </div>

      {apiError && <div className="alert-error mb-5">{apiError}</div>}
      {apiSuccess && <div className="alert-success mb-5">{apiSuccess}</div>}

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        {/* Password */}
        <div>
          <label htmlFor="password" className="input-label">New Password</label>
          <input id="password" type="password" placeholder="Min. 6 characters" autoComplete="new-password"
            className={`input-field ${errors.password ? 'error' : ''}`}
            value={form.password} onChange={e => set('password', e.target.value)} />
          {errors.password && <p className="text-xs mt-1" style={{ color: 'var(--error)' }}>{errors.password}</p>}
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="confirmPassword" className="input-label">Confirm New Password</label>
          <input id="confirmPassword" type="password" placeholder="Re-type password" autoComplete="new-password"
            className={`input-field ${errors.confirmPassword ? 'error' : ''}`}
            value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} />
          {errors.confirmPassword && <p className="text-xs mt-1" style={{ color: 'var(--error)' }}>{errors.confirmPassword}</p>}
        </div>

        <button type="submit" disabled={loading || !!apiSuccess} className="btn-primary w-full mt-1"
          style={{ justifyContent: 'center' }}>
          {loading ? <><span className="spinner" /> Updating…</> : 'Update Password'}
        </button>
      </form>
    </div>
  );
}
