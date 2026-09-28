'use client';

import { Sparkles } from 'lucide-react';

const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };

/** Gradient greeting banner shown at the top of each dashboard. */
export default function Welcome({ name, sub, actions, chips }: { name: string; sub: string; actions?: React.ReactNode; chips?: React.ReactNode }) {
  return (
    <div className="brand-gradient relative mb-6 overflow-hidden rounded-3xl p-6 text-white shadow-xl shadow-indigo-500/25 md:p-8">
      <div className="grid-lines absolute inset-0 opacity-20" />
      <div className="float-slow absolute -right-10 -top-16 h-56 w-56 rounded-full bg-white/10" />
      <div className="float-slower absolute -bottom-20 right-40 h-48 w-48 rounded-full bg-fuchsia-300/20" />
      <svg className="absolute bottom-0 right-6 hidden h-32 opacity-30 md:block" viewBox="0 0 200 100" aria-hidden><path d="M0 90 C30 80 40 60 70 62 S110 30 130 38 S170 10 200 6" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" /></svg>
      <div className="relative flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="flex items-center gap-1.5 text-sm font-medium text-white/80"><Sparkles className="h-4 w-4" />{greeting()}</p>
          <h1 className="mt-1 text-3xl font-extrabold md:text-4xl">{name}</h1>
          <p className="mt-2 max-w-xl text-white/80">{sub}</p>
          {chips && <div className="mt-4 flex flex-wrap gap-2">{chips}</div>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export const Chip = ({ children, tone = 'light' }: { children: React.ReactNode; tone?: 'light' | 'alert' }) => (
  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold backdrop-blur ${tone === 'alert' ? 'bg-red-500/90 text-white' : 'bg-white/15 text-white ring-1 ring-white/25'}`}>{children}</span>
);
