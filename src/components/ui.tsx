'use client';

import { createContext, useCallback, useContext, useState } from 'react';
import clsx from 'clsx';
import { Inbox, Loader2, X } from 'lucide-react';
import { motion } from 'motion/react';
import { CountUp } from './fx';

export { clsx };

export function Logo({ size = 28, text = true, className }: { size?: number; text?: boolean; className?: string }) {
  return (
    <span className={clsx('inline-flex items-center gap-2 font-bold tracking-tight text-ink', className)}>
      <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden>
        <defs>
          <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#7c3aed" /><stop offset=".5" stopColor="#4f46e5" /><stop offset="1" stopColor="#2563eb" />
          </linearGradient>
        </defs>
        <path d="M8 4h26v8H16v4h14v8H16v4h18v8H8a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4z" fill="url(#lg)" />
      </svg>
      {text && <span style={{ fontSize: size * 0.8 }}>Evalix</span>}
    </span>
  );
}

type BtnProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'; size?: 'sm' | 'md' | 'lg'; loading?: boolean };
export function Button({ variant = 'primary', size = 'md', loading, className, children, disabled, ...p }: BtnProps) {
  return (
    <button
      {...p}
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition active:scale-[.97] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap',
        size === 'sm' && 'h-8 px-3 text-sm', size === 'md' && 'h-10 px-4 text-sm', size === 'lg' && 'h-12 px-6 text-base',
        variant === 'primary' && 'brand-gradient text-white shadow-md shadow-indigo-500/25 hover:shadow-lg hover:shadow-indigo-500/30 hover:brightness-110',
        variant === 'secondary' && 'bg-white border border-line text-ink hover:border-brand-200 hover:bg-brand-50',
        variant === 'ghost' && 'text-muted hover:bg-brand-50 hover:text-ink',
        variant === 'danger' && 'bg-red-600 text-white hover:bg-red-700',
        variant === 'success' && 'bg-emerald-600 text-white hover:bg-emerald-700',
        className
      )}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

export const Card = ({ className, children, ...p }: React.HTMLAttributes<HTMLDivElement>) => (
  <div {...p} className={clsx('card', className)}>{children}</div>
);

export function Input({ label, hint, className, ...p }: React.InputHTMLAttributes<HTMLInputElement> & { label?: string; hint?: string }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>}
      <input {...p} className={clsx('h-10 w-full rounded-xl border border-line bg-white px-3 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100', className)} />
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function Textarea({ label, className, ...p }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>}
      <textarea {...p} className={clsx('w-full rounded-xl border border-line bg-white px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-4 focus:ring-brand-100', className)} />
    </label>
  );
}

export function Select({ label, children, className, ...p }: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>}
      <select {...p} className={clsx('h-10 w-full rounded-xl border border-line bg-white px-3 text-sm outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100', className)}>{children}</select>
    </label>
  );
}

export function Switch({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 py-2">
      <span>
        <span className="block text-sm font-medium">{label}</span>
        {hint && <span className="block text-xs text-muted">{hint}</span>}
      </span>
      <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
        className={clsx('relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition', checked ? 'bg-brand-600' : 'bg-slate-300')}>
        <span className={clsx('absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition', checked ? 'left-[22px]' : 'left-0.5')} />
      </button>
    </label>
  );
}

const BADGE: Record<string, string> = {
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200', red: 'bg-red-50 text-red-700 ring-red-200', amber: 'bg-amber-50 text-amber-700 ring-amber-200',
  blue: 'bg-blue-50 text-blue-700 ring-blue-200', violet: 'bg-brand-50 text-brand-700 ring-brand-100', gray: 'bg-slate-100 text-slate-600 ring-slate-200',
};
export const Badge = ({ color = 'gray', children, className }: { color?: keyof typeof BADGE | string; children: React.ReactNode; className?: string }) => (
  <span className={clsx('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset', BADGE[color] || BADGE.gray, className)}>{children}</span>
);

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    draft: ['gray', 'Draft'], published: ['green', 'Live'], closed: ['blue', 'Completed'], in_progress: ['violet', 'In progress'],
    submitted: ['green', 'Submitted'], locked: ['red', 'Locked'], pending: ['amber', 'Pending review'], confirmed: ['red', 'Cheating confirmed'], dismissed: ['gray', 'Dismissed'],
  };
  const [c, l] = map[status] || ['gray', status];
  return <Badge color={c}>{l}</Badge>;
}

export function Stat({ label, value, icon, tint = 'violet', sub, suffix = '', decimals = 0 }: { label: string; value: React.ReactNode; icon?: React.ReactNode; tint?: string; sub?: string; suffix?: string; decimals?: number }) {
  const tints: Record<string, string> = {
    violet: 'from-violet-500 to-indigo-600 shadow-indigo-500/30', green: 'from-emerald-400 to-teal-600 shadow-emerald-500/30', blue: 'from-sky-400 to-blue-600 shadow-blue-500/30',
    amber: 'from-amber-400 to-orange-500 shadow-orange-500/30', red: 'from-rose-400 to-red-600 shadow-red-500/30',
  };
  const glow: Record<string, string> = { violet: 'bg-indigo-400', green: 'bg-emerald-400', blue: 'bg-sky-400', amber: 'bg-amber-400', red: 'bg-rose-400' };
  return (
    <Card className="card-hover group relative overflow-hidden p-5">
      <span className={clsx('absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-[.12] blur-xl transition group-hover:opacity-25', glow[tint] || glow.violet)} />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-muted">{label}</p>
          <p className="mt-2 font-display text-3xl font-extrabold tracking-tight">{typeof value === 'number' ? <CountUp value={value} decimals={decimals} suffix={suffix} duration={0.9} /> : value}</p>
          {sub && <p className="mt-1 truncate text-xs text-muted">{sub}</p>}
        </div>
        {icon && <span className={clsx('grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-lg transition group-hover:scale-110 group-hover:rotate-3', tints[tint] || tints.violet)}>{icon}</span>}
      </div>
    </Card>
  );
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className={clsx('card max-h-[90vh] w-full overflow-auto p-6', wide ? 'max-w-3xl' : 'max-w-lg')} onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-muted hover:bg-slate-100 cursor-pointer"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export const Spinner = ({ label }: { label?: string }) => (
  <div className="flex items-center justify-center gap-2 py-16 text-muted" role="status"><Loader2 className="h-5 w-5 animate-spin text-brand-500" />{label || 'Loading…'}</div>
);

/** Placeholder layout while a dashboard loads. */
export const DashSkeleton = () => (
  <div className="space-y-6" role="status" aria-label="Loading">
    <div className="skeleton h-40" />
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-28" />)}</div>
    <div className="grid gap-6 lg:grid-cols-3"><div className="skeleton h-72 lg:col-span-2" /><div className="skeleton h-72" /></div>
  </div>
);

export const Empty = ({ title, body, action, icon }: { title: string; body?: string; action?: React.ReactNode; icon?: React.ReactNode }) => (
  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-brand-200 bg-white/70 px-6 py-14 text-center">
    <span className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-brand-50 text-brand-500">{icon || <Inbox className="h-6 w-6" />}</span>
    <p className="font-semibold">{title}</p>
    {body && <p className="mt-1 max-w-md text-sm text-muted">{body}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export const PageHeader = ({ title, sub, actions }: { title: string; sub?: string; actions?: React.ReactNode }) => (
  <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
    <div>
      <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">{title}</h1>
      {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
    </div>
    {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
  </div>
);

export function Tabs<T extends string>({ tabs, value, onChange }: { tabs: { id: T; label: React.ReactNode }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="mb-6 flex w-fit max-w-full gap-1 overflow-x-auto rounded-2xl border border-line bg-white p-1 shadow-sm" role="tablist">
      {tabs.map((t) => (
        <button key={t.id} role="tab" aria-selected={value === t.id} onClick={() => onChange(t.id)}
          className={clsx('relative cursor-pointer whitespace-nowrap rounded-xl px-4 py-2 text-sm font-semibold transition', value === t.id ? 'text-brand-700' : 'text-muted hover:text-ink')}>
          {value === t.id && <motion.span layoutId={`tab-${tabs.map((x) => x.id).join('')}`} className="absolute inset-0 rounded-xl bg-brand-50 ring-1 ring-brand-100" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
          <span className="relative">{t.label}</span>
        </button>
      ))}
    </div>
  );
}

// ---- toasts ----
type Toast = { id: number; msg: string; kind: 'success' | 'error' | 'info' };
const ToastCtx = createContext<(msg: string, kind?: Toast['kind']) => void>(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const show = useCallback((msg: string, kind: Toast['kind'] = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);
  return (
    <ToastCtx.Provider value={show}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex max-w-sm flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.id} className={clsx('rounded-xl px-4 py-3 text-sm font-medium text-white shadow-lg', t.kind === 'error' ? 'bg-red-600' : t.kind === 'info' ? 'bg-slate-800' : 'bg-emerald-600')}>{t.msg}</div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export const fmtDate = (d?: string | Date | null) => (d ? new Date(d).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—');
export const fmtDay = (d?: string | Date | null) => (d ? new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
export const pct = (score?: number | null, total?: number | null) => (score == null || !total ? null : Math.round((score / total) * 100));
