import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'ChangeDeploy AI',
  description: 'AI-assisted deployment risk and approval workflow dashboard',
};

const navItems = [
  { href: '/', label: 'Dashboard' },
  { href: '/create-deployment', label: 'Create Deployment' },
  { href: '/approval-center', label: 'Approval Center' },
  { href: '/deployment-monitor', label: 'Deployment Monitor' },
  { href: '/audit-trail', label: 'Audit Trail' },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-slate-950 text-slate-100 antialiased">
        <div className="min-h-screen">
          <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-slate-800 bg-slate-950/90 p-6 lg:block">
            <div className="mb-8">
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">ChangeDeploy</div>
              <h1 className="mt-2 text-2xl font-bold text-white">AI</h1>
            </div>

            <nav className="space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center rounded-xl border border-slate-800 bg-slate-900/80 px-3 py-2 text-sm text-slate-200 transition hover:border-cyan-500 hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            <div className="mt-10 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-4">
              <div className="text-xs uppercase tracking-[0.2em] text-cyan-300">Risk posture</div>
              <div className="mt-3 text-3xl font-bold text-white">Low</div>
              <div className="mt-2 text-sm text-slate-300">Auto-generated recommendations are active.</div>
            </div>
          </aside>

          <div className="lg:pl-64">
            <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
              <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-400">Operations intelligence</p>
                  <h2 className="mt-1 text-xl font-semibold text-white">Change management control center</h2>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                    System healthy
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 font-semibold text-cyan-300">
                    CA
                  </div>
                </div>
              </div>
            </header>

            <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
