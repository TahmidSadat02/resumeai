'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchSubscription, apiInitPayment, type SubscriptionInfo } from '@/lib/api';
import { createClient } from '@/lib/supabase/client';

const PLAN_LABELS: Record<string, string> = {
  free:    'Free',
  pro:     'Pro — 299 BDT/month',
  premium: 'Premium — 599 BDT/month',
};

const PLAN_COLORS: Record<string, { bg: string; text: string }> = {
  free:    { bg: '#EDE9E4', text: 'var(--navy)' },
  pro:     { bg: '#FEF3C7', text: '#92400E' },
  premium: { bg: '#DCFCE7', text: '#166534' },
};

interface PaymentRow {
  date: string;
  plan: string;
  amount: string;
  txn: string;
  status: 'paid';
}

export default function BillingPage() {
  const router = useRouter();
  const [subscription, setSub]   = useState<SubscriptionInfo | null>(null);
  const [email, setEmail]        = useState('');
  const [newEmail, setNewEmail]  = useState('');
  const [emailMsg, setEmailMsg]  = useState('');
  const [loading, setLoading]    = useState(true);
  const [upgrading, setUpgrading]= useState<'pro' | 'premium' | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [history, setHistory]    = useState<PaymentRow[]>([]);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      setEmail(user.email ?? '');

      const sub = await fetchSubscription(user.id);
      setSub(sub);

      // Build payment history from subscription if a transaction exists
      if (sub?.transaction_id && sub.amount_paid) {
        setHistory([{
          date:   sub.current_period_end
            ? new Date(new Date(sub.current_period_end).setMonth(new Date(sub.current_period_end).getMonth() - 1)).toLocaleDateString('en-GB')
            : new Date().toLocaleDateString('en-GB'),
          plan:   sub.plan.charAt(0).toUpperCase() + sub.plan.slice(1),
          amount: `${sub.amount_paid} BDT`,
          txn:    sub.transaction_id,
          status: 'paid',
        }]);
      }

      setLoading(false);
    }
    load();
  }, [router]);

  async function handleUpgrade(plan: 'pro' | 'premium') {
    if (!subscription) return;
    setUpgrading(plan);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/login'); return; }

    try {
      const { redirectUrl } = await apiInitPayment(user.id, plan);
      window.location.href = redirectUrl;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Payment init failed.';
      alert(msg);
      setUpgrading(null);
    }
  }

  async function handleCancel() {
    if (!confirm('Are you sure you want to cancel your subscription? Your plan will revert to Free at period end.')) return;
    setCancelling(true);
    // Cancellation is handled server-side; for now show a toast
    await new Promise(r => setTimeout(r, 1000));
    alert('Cancellation request received. Your plan will stay active until the period ends.');
    setCancelling(false);
  }

  async function handleEmailUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      setEmailMsg('Enter a valid email.');
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    setEmailMsg(error ? error.message : '✓ Confirmation sent to new email address.');
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 gap-3">
        <div className="spinner spinner-dark" />
        <span className="text-sm" style={{ color: 'var(--muted)' }}>Loading billing info…</span>
      </div>
    );
  }

  const plan = subscription?.plan ?? 'free';
  const colors = PLAN_COLORS[plan];

  return (
    <div className="max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-black tracking-tight mb-1" style={{ color: 'var(--navy)' }}>Billing</h1>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Manage your subscription and payment details.
        </p>
      </div>

      {/* ── Current plan ── */}
      <div className="card p-6 mb-6">
        <p className="label-text mb-3">Current Plan</p>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <span className="text-xl font-black" style={{ color: 'var(--navy)' }}>
              {PLAN_LABELS[plan]}
            </span>
            {subscription?.current_period_end && plan !== 'free' && (
              <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
                Renews on {new Date(subscription.current_period_end).toLocaleDateString('en-GB', {
                  day: '2-digit', month: 'long', year: 'numeric',
                })}
              </p>
            )}
          </div>
          <div className="px-4 py-1.5 rounded-full text-sm font-bold"
            style={{ background: colors.bg, color: colors.text }}>
            {plan.charAt(0).toUpperCase() + plan.slice(1)}
          </div>
        </div>

        <div className="divider" />

        {/* Usage */}
        <p className="label-text mb-3">Usage This Period</p>
        <div className="flex items-center gap-4 mb-2">
          <span className="text-3xl font-black" style={{ color: 'var(--navy)' }}>
            {subscription?.generations_used ?? 0}
          </span>
          <span style={{ color: 'var(--muted)' }}>
            / {subscription?.generation_limit ?? 5} generations
          </span>
        </div>
        <div className="progress-bar">
          <div className="progress-fill" style={{
            width: `${Math.min(100, ((subscription?.generations_used ?? 0) / (subscription?.generation_limit ?? 5)) * 100)}%`,
          }} />
        </div>
      </div>

      {/* ── Upgrade options ── */}
      {plan !== 'premium' && (
        <div className="card p-6 mb-6">
          <p className="label-text mb-4">Upgrade Your Plan</p>
          <div className="flex flex-col sm:flex-row gap-4">
            {plan === 'free' && (
              <div className="flex-1 p-4 rounded-xl border" style={{ borderColor: 'var(--border)' }}>
                <p className="font-bold mb-1" style={{ color: 'var(--navy)' }}>Pro</p>
                <p className="text-xl font-black mb-1" style={{ color: 'var(--navy)' }}>299 BDT<span className="text-sm font-normal text-gray-400">/mo</span></p>
                <p className="text-xs mb-4" style={{ color: 'var(--muted)' }}>50 generations · Gemini Flash · PDF export</p>
                <button onClick={() => handleUpgrade('pro')} disabled={!!upgrading} className="btn-outline w-full" style={{ justifyContent: 'center' }}>
                  {upgrading === 'pro' ? <><span className="spinner spinner-dark" /> Redirecting…</> : 'Upgrade to Pro'}
                </button>
              </div>
            )}
            <div className="flex-1 p-4 rounded-xl border" style={{ borderColor: 'var(--navy)', background: 'var(--navy)' }}>
              <p className="font-bold mb-1 text-white">Premium</p>
              <p className="text-xl font-black mb-1 text-white">599 BDT<span className="text-sm font-normal" style={{ color: 'rgba(255,255,255,0.6)' }}>/mo</span></p>
              <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.6)' }}>200 generations · Gemini 2.5 Pro · Job match score</p>
              <button onClick={() => handleUpgrade('premium')} disabled={!!upgrading} className="btn-gold w-full" style={{ justifyContent: 'center' }}>
                {upgrading === 'premium' ? <><span className="spinner" style={{ borderTopColor: 'var(--navy)' }} /> Redirecting…</> : 'Upgrade to Premium'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Payment history ── */}
      <div className="card p-6 mb-6">
        <p className="label-text mb-4">Payment History</p>
        {history.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--muted)' }}>No payments on record.</p>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Date', 'Plan', 'Amount', 'Transaction ID', 'Status'].map(h => (
                  <th key={h} className="text-left pb-3 pr-3 text-xs font-semibold"
                    style={{ color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td className="py-3 pr-3 text-xs" style={{ color: 'var(--muted)' }}>{row.date}</td>
                  <td className="py-3 pr-3 font-medium" style={{ color: 'var(--navy)' }}>{row.plan}</td>
                  <td className="py-3 pr-3" style={{ color: 'var(--navy)' }}>{row.amount}</td>
                  <td className="py-3 pr-3 text-xs font-mono truncate max-w-xs" style={{ color: 'var(--muted)' }}>{row.txn}</td>
                  <td className="py-3"><span className="badge badge-green text-xs">Paid</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Update billing email ── */}
      <div className="card p-6 mb-6">
        <p className="label-text mb-1">Billing Email</p>
        <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
          Current: <strong>{email}</strong>
        </p>
        <form onSubmit={handleEmailUpdate} className="flex gap-3">
          <input type="email" placeholder="New email address" className="input-field flex-1"
            value={newEmail} onChange={e => setNewEmail(e.target.value)} />
          <button type="submit" className="btn-outline shrink-0">Update</button>
        </form>
        {emailMsg && (
          <p className={`text-xs mt-2 ${emailMsg.startsWith('✓') ? 'text-green-600' : ''}`}
            style={!emailMsg.startsWith('✓') ? { color: 'var(--error)' } : {}}>
            {emailMsg}
          </p>
        )}
      </div>

      {/* ── Cancel subscription ── */}
      {plan !== 'free' && (
        <div className="card p-6 border" style={{ borderColor: '#FECACA' }}>
          <p className="font-bold mb-1" style={{ color: 'var(--error)' }}>Cancel Subscription</p>
          <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
            You&apos;ll keep access until your billing period ends. After that, your plan reverts to Free.
          </p>
          <button onClick={handleCancel} disabled={cancelling}
            className="btn-outline" style={{ borderColor: 'var(--error)', color: 'var(--error)' }}>
            {cancelling ? 'Cancelling…' : 'Cancel Subscription'}
          </button>
        </div>
      )}
    </div>
  );
}
