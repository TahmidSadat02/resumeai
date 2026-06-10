'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { apiSignOut } from '@/lib/api';

const NAV_LINKS = [
  { label: 'Dashboard', href: '/dashboard', icon: '⊞' },
  { label: 'Generate',  href: '/generate',  icon: '✦' },
  { label: 'Billing',   href: '/billing',   icon: '◈' },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [signingOut, setSigningOut] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  async function handleSignOut() {
    setSigningOut(true);
    await apiSignOut();
    router.push('/login');
  }

  return (
    <div className="min-h-screen flex" style={{ background: 'var(--cream)' }}>
      {/* ── Sidebar ── */}
      <aside className="hidden md:flex flex-col w-60 shrink-0 border-r"
        style={{ background: '#fff', borderColor: 'var(--border)' }}>
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b" style={{ borderColor: 'var(--border)' }}>
          <Link href="/dashboard" className="text-xl font-black tracking-tight no-underline" style={{ color: 'var(--navy)' }}>
            Resume<span style={{ color: 'var(--gold)' }}>AI</span>
          </Link>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-6 flex flex-col gap-1">
          {NAV_LINKS.map(({ label, href, icon }) => {
            const active = pathname === href;
            return (
              <Link key={href} href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium no-underline transition-all"
                style={{
                  background: active ? 'var(--cream)' : 'transparent',
                  color: active ? 'var(--navy)' : 'var(--muted)',
                  fontWeight: active ? 700 : 500,
                }}>
                <span className="text-base">{icon}</span>
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Sign out */}
        <div className="px-3 pb-6 border-t pt-4" style={{ borderColor: 'var(--border)' }}>
          <button onClick={handleSignOut} disabled={signingOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
            style={{ color: 'var(--muted)', background: 'transparent' }}>
            {signingOut ? <span className="spinner spinner-dark" /> : <span>↩</span>}
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="md:hidden h-14 flex items-center justify-between px-4 border-b"
          style={{ background: '#fff', borderColor: 'var(--border)' }}>
          <Link href="/dashboard" className="text-lg font-black no-underline" style={{ color: 'var(--navy)' }}>
            Resume<span style={{ color: 'var(--gold)' }}>AI</span>
          </Link>
          <div className="flex items-center gap-4">
            {NAV_LINKS.map(({ label, href, icon }) => (
              <Link key={href} href={href} title={label} className="no-underline text-base"
                style={{ color: pathname === href ? 'var(--navy)' : 'var(--muted)' }}>
                {icon}
              </Link>
            ))}
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-5xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
