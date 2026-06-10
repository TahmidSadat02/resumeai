import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'ResumeAI — AI-Powered Resumes & Cover Letters',
  description: 'Generate professional, ATS-optimised resumes and cover letters in seconds using the power of Google Gemini AI.',
};

const FEATURES = [
  {
    icon: '✦',
    title: 'Gemini-Powered AI',
    desc: 'Built on Google\'s latest Gemini models. The better your plan, the more powerful the model.',
  },
  {
    icon: '◈',
    title: 'ATS-Optimised',
    desc: 'Our prompts are engineered to mirror job description keywords, maximising your ATS pass rate.',
  },
  {
    icon: '⊞',
    title: 'Instant JSON Output',
    desc: 'Structured resume data you can render in any template, export to PDF, or paste anywhere.',
  },
  {
    icon: '◎',
    title: 'Cover Letters Too',
    desc: 'Tailored, compelling cover letters in 3–4 paragraphs. Never start with "I am writing to apply…".',
  },
  {
    icon: '◑',
    title: 'Plan-Based Models',
    desc: 'Free users get Flash Lite. Pro users get Flash. Premium users get Gemini 2.5 Pro.',
  },
  {
    icon: '◐',
    title: 'Secure & Private',
    desc: 'Auth via Supabase. Your data is tied to your account and never shared.',
  },
];

const STEPS = [
  { n: '01', title: 'Create an account', desc: 'Sign up free in seconds — no credit card required.' },
  { n: '02', title: 'Paste your details', desc: 'Enter your experience, skills, and the target job description.' },
  { n: '03', title: 'Generate & download', desc: 'Click Generate. Get a polished, ATS-ready resume instantly.' },
];

const PLANS = [
  {
    name: 'Free',
    price: '0',
    currency: 'BDT',
    period: 'forever',
    features: ['5 generations / month', 'Gemini Flash Lite model', 'Resume + Cover Letter', 'Basic templates'],
    cta: 'Get Started Free',
    href: '/signup',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '299',
    currency: 'BDT',
    period: 'month',
    features: ['50 generations / month', 'Gemini Flash model', 'All templates', 'PDF export', 'Priority support'],
    cta: 'Upgrade to Pro',
    href: '/signup',
    highlight: true,
  },
  {
    name: 'Premium',
    price: '599',
    currency: 'BDT',
    period: 'month',
    features: ['200 generations / month', 'Gemini 2.5 Pro model', 'Job match scoring', 'All Pro features', 'Early access to new features'],
    cta: 'Go Premium',
    href: '/signup',
    highlight: false,
  },
];

export default function LandingPage() {
  return (
    <>
      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-24 pb-32 px-4 sm:px-6">
        {/* Background decoration */}
        <div aria-hidden className="absolute inset-0 pointer-events-none overflow-hidden">
          <div style={{
            position: 'absolute', top: '-20%', right: '-10%',
            width: '600px', height: '600px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(201,169,110,0.12) 0%, transparent 70%)',
          }} />
          <div style={{
            position: 'absolute', bottom: '-10%', left: '-5%',
            width: '400px', height: '400px', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(26,43,61,0.06) 0%, transparent 70%)',
          }} />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <span className="label-text animate-fade-in-up">Powered by Google Gemini</span>

          <h1 className="display-heading mt-4 mb-6 animate-fade-in-up" style={{ animationDelay: '0.05s' }}>
            Resumes that get you<br />
            <span style={{
              background: 'linear-gradient(135deg, var(--navy) 0%, var(--gold) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>past the ATS</span>
          </h1>

          <p className="text-lg sm:text-xl max-w-2xl mx-auto mb-10 animate-fade-in-up"
            style={{ color: 'var(--muted)', animationDelay: '0.1s' }}>
            AI writes the resume. You get the interview. Generate polished, keyword-optimised
            resumes and cover letters in seconds — not hours.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up" style={{ animationDelay: '0.15s' }}>
            <Link href="/signup" className="btn-primary text-base" style={{ padding: '0.875rem 2rem' }}>
              Generate My Resume Free →
            </Link>
            <Link href="/pricing" className="btn-outline text-base" style={{ padding: '0.875rem 2rem' }}>
              View Pricing
            </Link>
          </div>

          <p className="mt-5 text-sm animate-fade-in-up" style={{ color: 'var(--muted)', animationDelay: '0.2s' }}>
            No credit card required · 5 free generations/month
          </p>
        </div>

        {/* Hero card preview */}
        <div className="relative max-w-2xl mx-auto mt-16 animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
          <div className="card p-6" style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
            <div className="flex items-center gap-2 mb-4">
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF5F57', display: 'inline-block' }} />
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#FEBC2E', display: 'inline-block' }} />
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#28C840', display: 'inline-block' }} />
              <span className="ml-2 text-xs" style={{ color: 'var(--muted)' }}>resume.json · Generated by ResumeAI</span>
            </div>
            <pre className="text-left overflow-x-auto text-xs" style={{ color: 'var(--navy)', lineHeight: 1.7 }}>
{`{
  "name": "Tahmid Sadat",
  "summary": "Full-stack engineer with 4 years building
    scalable SaaS products. Led migration that reduced
    API latency by 42% and improved team velocity...",
  "experience": [{
    "company": "TechCorp",
    "title": "Senior Software Engineer",
    "bullets": [
      "Architected microservices reducing deploy time by 60%",
      "Mentored 3 junior engineers; 2 promoted within a year"
    ]
  }],
  "skills": ["TypeScript", "Next.js", "Supabase", "AI"]
}`}
            </pre>
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────────────── */}
      <section id="features" className="py-24 px-4 sm:px-6" style={{ background: '#fff' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="label-text">What you get</span>
            <h2 className="section-heading mt-3">Everything you need to land the job</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(({ icon, title, desc }) => (
              <div key={title} className="card p-6">
                <div className="mb-4 text-2xl" style={{ color: 'var(--gold)' }}>{icon}</div>
                <h3 className="font-bold text-base mb-2" style={{ color: 'var(--navy)' }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it Works ───────────────────────────────────────────────────── */}
      <section id="how-it-works" className="py-24 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="label-text">Simple process</span>
            <h2 className="section-heading mt-3">From blank page to hired in 3 steps</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-8">
            {STEPS.map(({ n, title, desc }) => (
              <div key={n} className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-5 text-sm font-black"
                  style={{ background: 'var(--navy)', color: 'var(--gold)' }}>
                  {n}
                </div>
                <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--navy)' }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing Preview ─────────────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6" style={{ background: '#fff' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="label-text">Pricing</span>
            <h2 className="section-heading mt-3">Simple, transparent pricing</h2>
            <p className="mt-4 text-base" style={{ color: 'var(--muted)' }}>
              Start free. Upgrade when you need more power.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {PLANS.map(({ name, price, currency, period, features, cta, href, highlight }) => (
              <div key={name} className="card p-7 flex flex-col"
                style={highlight ? { border: '2px solid var(--navy)', position: 'relative' } : {}}>
                {highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="badge badge-navy text-xs px-4 py-1">Most Popular</span>
                  </div>
                )}
                <p className="label-text mb-2">{name}</p>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-4xl font-black" style={{ color: 'var(--navy)' }}>{price}</span>
                  <span className="text-sm mb-2" style={{ color: 'var(--muted)' }}>{currency}/{period}</span>
                </div>
                <div className="divider" />
                <ul className="flex-1 flex flex-col gap-2 mb-6">
                  {features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm" style={{ color: 'var(--navy)' }}>
                      <span style={{ color: 'var(--gold)', flexShrink: 0 }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link href={href} className={highlight ? 'btn-primary text-center' : 'btn-outline text-center'}>
                  {cta}
                </Link>
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/pricing" className="text-sm font-semibold no-underline" style={{ color: 'var(--navy)' }}>
              See full feature comparison →
            </Link>
          </div>
        </div>
      </section>

      {/* ── CTA Banner ──────────────────────────────────────────────────────── */}
      <section className="py-24 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center card p-12"
          style={{ background: 'var(--navy)', border: 'none' }}>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white mb-4">
            Ready to land your next role?
          </h2>
          <p className="text-base mb-8" style={{ color: 'rgba(255,255,255,0.7)' }}>
            Join thousands of job seekers using AI to stand out from the crowd.
          </p>
          <Link href="/signup" className="btn-gold text-base" style={{ padding: '0.875rem 2.5rem' }}>
            Start For Free →
          </Link>
        </div>
      </section>
    </>
  );
}
