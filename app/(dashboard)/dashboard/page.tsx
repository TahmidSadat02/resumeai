'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { fetchSubscription, fetchGenerationHistory, type SubscriptionInfo, type GenerationHistoryItem } from '@/lib/api';

const PLAN_LABELS: Record<string, string> = {
  free:    'Free',
  pro:     'Pro',
  premium: 'Premium',
};

const PLAN_COLORS: Record<string, string> = {
  free:    'badge-navy',
  pro:     'badge-gold',
  premium: 'badge-green',
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser]             = useState<{ email: string; full_name?: string } | null>(null);
  const [subscription, setSub]      = useState<SubscriptionInfo | null>(null);
  const [history, setHistory]       = useState<GenerationHistoryItem[]>([]);
  const [paymentMsg, setPaymentMsg] = useState<string | null>(null);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    // Check for payment callback query param
    const params = new URLSearchParams(window.location.search);
    const payment = params.get('payment');
    if (payment === 'success') setPaymentMsg('🎉 Payment successful! Your plan has been upgraded.');
    if (payment === 'failed')  setPaymentMsg('❌ Payment failed. Please try again.');
    if (payment === 'cancelled') setPaymentMsg('Payment was cancelled.');

    async function load() {
      const supabase = createClient();
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        setUser({
          email:     authUser.email ?? '',
          full_name: authUser.user_metadata?.full_name,
        });
      }

      const [sub, hist] = await Promise.all([
        fetchSubscription(),
        fetchGenerationHistory(),
      ]);
      setSub(sub);
      setHistory(hist);
      setLoading(false);
    }
    load();
  }, []);

  const usagePercent = subscription
    ? Math.min(100, Math.round((subscription.generations_used / subscription.generation_limit) * 100))
    : 0;

  const greeting = user?.full_name
    ? `Welcome back, ${user.full_name.split(' ')[0]}!`
    : 'Welcome back!';

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black tracking-tight" style={{ color: 'var(--navy)' }}>
            {loading ? 'Dashboard' : greeting}
          </h1>
          {user?.email && (
            <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>{user.email}</p>
          )}
        </div>
        {subscription && (
          <span className={`badge ${PLAN_COLORS[subscription.plan]} text-sm px-4 py-1.5`}>
            {PLAN_LABELS[subscription.plan]} Plan
          </span>
        )}
      </div>

      {/* Payment notification */}
      {paymentMsg && (
        <div className={`mb-6 ${paymentMsg.startsWith('🎉') ? 'alert-success' : 'alert-error'}`}>
          {paymentMsg}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-24 gap-3">
          <div className="spinner spinner-dark" />
          <span className="text-sm" style={{ color: 'var(--muted)' }}>Loading your dashboard…</span>
        </div>
      ) : (
        <>
          {/* ── Stats + Quick actions ── */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
            {/* Usage card */}
            <div className="card p-6 lg:col-span-1">
              <p className="label-text mb-3">Generations this month</p>
              <div className="flex items-end gap-2 mb-3">
                <span className="text-4xl font-black" style={{ color: 'var(--navy)' }}>
                  {subscription?.generations_used ?? 0}
                </span>
                <span className="text-lg mb-1" style={{ color: 'var(--muted)' }}>
                  / {subscription?.generation_limit ?? 5}
                </span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${usagePercent}%`,
                  background: usagePercent >= 90 ? 'var(--error)' : 'var(--gold)' }} />
              </div>
              <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>
                {subscription?.generation_limit && subscription.generations_used >= subscription.generation_limit
                  ? 'Limit reached — upgrade to continue'
                  : `${subscription?.generation_limit ?? 5 - (subscription?.generations_used ?? 0)} remaining`}
              </p>
            </div>

            {/* Quick Generate Resume */}
            <Link href="/generate" className="card p-6 flex flex-col gap-3 no-underline group"
              style={{ cursor: 'pointer' }}>
              <div className="text-2xl" style={{ color: 'var(--gold)' }}>✦</div>
              <div>
                <p className="font-bold" style={{ color: 'var(--navy)' }}>Generate Resume</p>
                <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>
                  Create a tailored, ATS-optimised resume
                </p>
              </div>
              <span className="text-sm font-semibold mt-auto" style={{ color: 'var(--navy)' }}>
                Start now →
              </span>
            </Link>

            {/* Quick Generate Cover Letter */}
            <Link href="/generate" className="card p-6 flex flex-col gap-3 no-underline group"
              style={{ cursor: 'pointer' }}>
              <div className="text-2xl" style={{ color: 'var(--gold)' }}>◈</div>
              <div>
                <p className="font-bold" style={{ color: 'var(--navy)' }}>Generate Cover Letter</p>
                <p className="text-sm mt-0.5" style={{ color: 'var(--muted)' }}>
                  Write a compelling, tailored cover letter
                </p>
              </div>
              <span className="text-sm font-semibold mt-auto" style={{ color: 'var(--navy)' }}>
                Start now →
              </span>
            </Link>
          </div>

          {/* ── Upgrade banner (free users only) ── */}
          {subscription?.plan === 'free' && (
            <div className="card p-6 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              style={{ background: 'var(--navy)', border: 'none' }}>
              <div>
                <p className="font-bold text-white mb-1">Unlock more with Pro</p>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
                  Get 50 generations/month, PDF export, and Gemini 2.5 Flash — for just 299 BDT/month.
                </p>
              </div>
              <Link href="/billing" className="btn-gold shrink-0">
                Upgrade Now →
              </Link>
            </div>
          )}

          {/* ── Generation History ── */}
          <div className="card p-6">
            <h2 className="font-bold text-base mb-5" style={{ color: 'var(--navy)' }}>
              Generation History
            </h2>

            {history.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-4xl mb-3" style={{ opacity: 0.2 }}>◈</div>
                <p className="text-sm" style={{ color: 'var(--muted)' }}>
                  No generations yet.{' '}
                  <Link href="/generate" className="font-semibold no-underline" style={{ color: 'var(--navy)' }}>
                    Generate your first resume →
                  </Link>
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {['Type', 'Title', 'Model', 'Date', 'Saved'].map(h => (
                        <th key={h} className="text-left pb-3 pr-4 font-semibold text-xs"
                          style={{ color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {history.map(item => (
                      <tr key={item.id} style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                        className="hover:bg-[var(--cream)] transition-colors"
                        onClick={() => router.push(`/history/${item.id}`)}>
                        <td className="py-3 pr-4">
                          <span className={`badge ${item.type === 'resume' ? 'badge-navy' : 'badge-gold'} text-xs`}>
                            {item.type === 'resume' ? '✦ Resume' : '◈ Cover Letter'}
                          </span>
                        </td>
                        <td className="py-3 pr-4" style={{ color: 'var(--navy)' }}>
                          {item.title ?? '—'}
                        </td>
                        <td className="py-3 pr-4 text-xs" style={{ color: 'var(--muted)' }}>
                          {item.model_version?.replace('gemini-', '') ?? '—'}
                        </td>
                        <td className="py-3 pr-4 text-xs" style={{ color: 'var(--muted)' }}>
                          {new Date(item.created_at).toLocaleDateString('en-GB', {
                            day: '2-digit', month: 'short', year: 'numeric',
                          })}
                        </td>
                        <td className="py-3">
                          <span className={`badge ${item.is_saved ? 'badge-green' : ''} text-xs`}
                            style={!item.is_saved ? { color: 'var(--muted)' } : {}}>
                            {item.is_saved ? 'Saved' : '—'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
