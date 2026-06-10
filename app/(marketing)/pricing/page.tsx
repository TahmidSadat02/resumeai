import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Pricing — ResumeAI',
  description: 'Choose the plan that fits your job search. Start free, upgrade anytime.',
};

const PLANS = [
  {
    name: 'Free',
    price: '0',
    usd: null,
    bdt: '0 BDT',
    period: 'forever',
    desc: 'Perfect for trying out ResumeAI.',
    highlight: false,
    badge: null,
    features: [
      { label: '5 generations / month',   ok: true },
      { label: 'Gemini Flash Lite model',  ok: true },
      { label: 'Resume generation',        ok: true },
      { label: 'Cover letter generation',  ok: true },
      { label: 'Basic templates',          ok: true },
      { label: 'PDF export',               ok: false },
      { label: 'Job match scoring',        ok: false },
      { label: 'Priority support',         ok: false },
    ],
    cta: 'Get Started Free',
    href: '/signup',
  },
  {
    name: 'Pro',
    price: '299',
    usd: '$4.99',
    bdt: '299 BDT / month',
    period: 'month',
    desc: 'For serious job seekers who need more power.',
    highlight: true,
    badge: 'Most Popular',
    features: [
      { label: '50 generations / month',   ok: true },
      { label: 'Gemini 2.5 Flash model',   ok: true },
      { label: 'Resume generation',        ok: true },
      { label: 'Cover letter generation',  ok: true },
      { label: 'All 5 templates',          ok: true },
      { label: 'PDF export',               ok: true },
      { label: 'Job match scoring',        ok: false },
      { label: 'Priority support',         ok: true },
    ],
    cta: 'Upgrade to Pro',
    href: '/signup',
  },
  {
    name: 'Premium',
    price: '599',
    usd: '$8',
    bdt: '599 BDT / month',
    period: 'month',
    desc: 'Maximum AI power for the most competitive roles.',
    highlight: false,
    badge: 'Best Value',
    features: [
      { label: '200 generations / month',  ok: true },
      { label: 'Gemini 2.5 Pro model',     ok: true },
      { label: 'Resume generation',        ok: true },
      { label: 'Cover letter generation',  ok: true },
      { label: 'All templates',            ok: true },
      { label: 'PDF export',               ok: true },
      { label: 'Job match scoring',        ok: true },
      { label: 'Priority support',         ok: true },
    ],
    cta: 'Go Premium',
    href: '/signup',
  },
];

const TABLE_FEATURES = [
  { label: 'Generations / month',    free: '5',                  pro: '50',               premium: '200' },
  { label: 'AI Model',               free: 'Flash Lite',         pro: '2.5 Flash',        premium: '2.5 Pro' },
  { label: 'Resume generation',      free: '✓',                  pro: '✓',                premium: '✓' },
  { label: 'Cover letter',           free: '✓',                  pro: '✓',                premium: '✓' },
  { label: 'Templates',              free: 'Basic',              pro: 'All 5',            premium: 'All' },
  { label: 'PDF export',             free: '—',                  pro: '✓',                premium: '✓' },
  { label: 'Job match scoring',      free: '—',                  pro: '—',                premium: '✓' },
  { label: 'Priority support',       free: '—',                  pro: '✓',                premium: '✓' },
  { label: 'Early access features',  free: '—',                  pro: '—',                premium: '✓' },
];

export default function PricingPage() {
  return (
    <>
      {/* ── Header ───────────────────────────────────────────────────────────── */}
      <section className="pt-20 pb-16 px-4 sm:px-6 text-center">
        <span className="label-text">Transparent pricing</span>
        <h1 className="section-heading mt-3 mb-4">
          Start free. Scale when ready.
        </h1>
        <p className="text-lg max-w-xl mx-auto" style={{ color: 'var(--muted)' }}>
          All plans include resume + cover letter generation.
          Upgrade anytime — cancel anytime.
        </p>
      </section>

      {/* ── Plan cards ───────────────────────────────────────────────────────── */}
      <section className="pb-20 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto grid sm:grid-cols-3 gap-6 items-start">
          {PLANS.map(({ name, bdt, period, desc, highlight, badge, features, cta, href }) => (
            <div key={name} className="card p-7 flex flex-col relative"
              style={highlight ? { border: '2px solid var(--navy)' } : {}}>
              {badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className={`badge ${highlight ? 'badge-navy' : 'badge-gold'} px-4 py-1 text-xs`}>
                    {badge}
                  </span>
                </div>
              )}

              <p className="label-text mb-1">{name}</p>
              <p className="text-3xl font-black mb-0.5" style={{ color: 'var(--navy)' }}>
                {bdt}
              </p>
              <p className="text-xs mb-4" style={{ color: 'var(--muted)' }}>{desc}</p>

              <div className="divider" />

              <ul className="flex-1 flex flex-col gap-2.5 mb-7">
                {features.map(({ label, ok }) => (
                  <li key={label} className="flex items-center gap-2 text-sm"
                    style={{ color: ok ? 'var(--navy)' : 'var(--muted)' }}>
                    <span style={{ flexShrink: 0, color: ok ? 'var(--gold)' : 'var(--border)', fontWeight: 700 }}>
                      {ok ? '✓' : '—'}
                    </span>
                    {label}
                  </li>
                ))}
              </ul>

              <Link href={href}
                className={highlight ? 'btn-primary text-center' : 'btn-outline text-center'}>
                {cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* ── Comparison table ─────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6" style={{ background: '#fff' }}>
        <div className="max-w-4xl mx-auto">
          <h2 className="section-heading text-center mb-12">Full feature comparison</h2>

          <div className="card overflow-hidden" style={{ padding: 0 }}>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr style={{ background: 'var(--cream)' }}>
                  <th className="text-left px-6 py-4 font-semibold" style={{ color: 'var(--muted)', width: '40%' }}>Feature</th>
                  {['Free', 'Pro', 'Premium'].map(p => (
                    <th key={p} className="text-center px-4 py-4 font-bold" style={{ color: 'var(--navy)' }}>{p}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TABLE_FEATURES.map(({ label, free, pro, premium }, i) => (
                  <tr key={label} style={{ borderTop: '1px solid var(--border)', background: i % 2 === 0 ? '#fff' : 'var(--cream)' }}>
                    <td className="px-6 py-3.5 font-medium" style={{ color: 'var(--navy)' }}>{label}</td>
                    {[free, pro, premium].map((val, j) => (
                      <td key={j} className="text-center px-4 py-3.5"
                        style={{ color: val === '✓' ? 'var(--success)' : val === '—' ? 'var(--border)' : 'var(--navy)', fontWeight: val === '✓' ? 700 : 400 }}>
                        {val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── FAQ / bottom CTA ──────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 text-center">
        <div className="max-w-xl mx-auto">
          <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--navy)' }}>Questions?</h2>
          <p className="mb-8" style={{ color: 'var(--muted)' }}>
            All plans are billed in BDT via SSLCommerz. You can cancel anytime from your billing page.
            Payments are processed securely and instantly.
          </p>
          <Link href="/signup" className="btn-primary">
            Start Free Today →
          </Link>
        </div>
      </section>
    </>
  );
}
