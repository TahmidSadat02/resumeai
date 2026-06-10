import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--cream)' }}>
      {/* Simple auth header */}
      <header className="h-16 flex items-center px-6 border-b" style={{ background: '#fff', borderColor: 'var(--border)' }}>
        <Link href="/" className="text-xl font-black tracking-tight no-underline" style={{ color: 'var(--navy)' }}>
          Resume<span style={{ color: 'var(--gold)' }}>AI</span>
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        {children}
      </main>

      <footer className="py-4 text-center text-xs" style={{ color: 'var(--muted)' }}>
        © {new Date().getFullYear()} ResumeAI
      </footer>
    </div>
  );
}
