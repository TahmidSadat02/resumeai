'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { apiSignOut } from '@/lib/api';
import { User } from '@supabase/supabase-js';

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    const supabase = createClient();
    
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function handleSignOut() {
    await apiSignOut();
    setUser(null);
    router.push('/');
    router.refresh();
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--cream)' }}>
      {/* ── Navbar ── */}
      <header style={{ background: '#fff', borderBottom: '1px solid var(--border)' }}
        className="sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 no-underline">
            <span className="text-xl font-black tracking-tight" style={{ color: 'var(--navy)' }}>
              Resume<span style={{ color: 'var(--gold)' }}>AI</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            {[['Features', '#features'], ['How it Works', '#how-it-works'], ['Pricing', '/pricing']].map(([label, href]) => (
              <Link key={label} href={href}
                className="text-sm font-medium no-underline transition-colors"
                style={{ color: 'var(--muted)' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--navy)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'var(--muted)')}>
                {label}
              </Link>
            ))}
          </nav>

          {/* CTA buttons */}
          <div className="hidden md:flex items-center gap-3">
            {mounted && user ? (
              <>
                <Link href="/dashboard" className="btn-outline" style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}>
                  Dashboard
                </Link>
                <button onClick={handleSignOut} className="btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem', cursor: 'pointer' }}>
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="btn-outline" style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}>
                  Sign In
                </Link>
                <Link href="/signup" className="btn-primary" style={{ padding: '0.5rem 1.25rem', fontSize: '0.875rem' }}>
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button className="md:hidden p-2 rounded-lg" style={{ color: 'var(--navy)' }}
            onClick={() => setMenuOpen(o => !o)} aria-label="Toggle menu">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {menuOpen
                ? <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>
                : <><line x1="3" y1="7" x2="21" y2="7"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="17" x2="21" y2="17"/></>}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden px-4 pb-4 flex flex-col gap-3 border-t" style={{ borderColor: 'var(--border)', background: '#fff' }}>
            {[['Features', '#features'], ['How it Works', '#how-it-works'], ['Pricing', '/pricing']].map(([label, href]) => (
              <Link key={label} href={href} className="text-sm font-medium py-2 no-underline" style={{ color: 'var(--navy)' }}
                onClick={() => setMenuOpen(false)}>{label}</Link>
            ))}
            <div className="flex gap-3 pt-1">
              {mounted && user ? (
                <>
                  <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="btn-outline flex-1 text-center" style={{ padding: '0.5rem', fontSize: '0.875rem' }}>Dashboard</Link>
                  <button onClick={() => { handleSignOut(); setMenuOpen(false); }} className="btn-primary flex-1 text-center cursor-pointer" style={{ padding: '0.5rem', fontSize: '0.875rem' }}>Sign Out</button>
                </>
              ) : (
                <>
                  <Link href="/login" onClick={() => setMenuOpen(false)} className="btn-outline flex-1 text-center" style={{ padding: '0.5rem', fontSize: '0.875rem' }}>Sign In</Link>
                  <Link href="/signup" onClick={() => setMenuOpen(false)} className="btn-primary flex-1 text-center" style={{ padding: '0.5rem', fontSize: '0.875rem' }}>Get Started</Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      {/* ── Footer ── */}
      <footer style={{ background: 'var(--navy)', color: 'rgba(255,255,255,0.7)' }} className="py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row justify-between items-start gap-8">
            <div>
              <p className="text-xl font-black tracking-tight text-white mb-2">
                Resume<span style={{ color: 'var(--gold)' }}>AI</span>
              </p>
              <p className="text-sm max-w-xs">AI-powered resumes and cover letters that get you hired faster.</p>
            </div>
            <div className="flex gap-12">
              <div>
                <p className="text-white font-semibold text-sm mb-3">Product</p>
                {[['Features', '#features'], ['Pricing', '/pricing'], ['Dashboard', '/dashboard']].map(([l, h]) => (
                  <Link key={l} href={h} className="block text-sm no-underline mb-2 hover:text-white transition-colors">{l}</Link>
                ))}
              </div>
              <div>
                <p className="text-white font-semibold text-sm mb-3">Account</p>
                {[['Sign Up', '/signup'], ['Log In', '/login'], ['Billing', '/billing']].map(([l, h]) => (
                  <Link key={l} href={h} className="block text-sm no-underline mb-2 hover:text-white transition-colors">{l}</Link>
                ))}
              </div>
            </div>
          </div>
          <div className="divider" style={{ background: 'rgba(255,255,255,0.1)', marginTop: '2rem' }} />
          <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.4)' }}>
            © {new Date().getFullYear()} ResumeAI. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
