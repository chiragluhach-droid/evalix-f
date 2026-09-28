'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { Bell, BookOpen, ClipboardList, LayoutDashboard, LogOut, Menu, Settings, ShieldAlert, Users, GraduationCap, BarChart3 } from 'lucide-react';
import { api, getUser, homeFor, logout, Role, User } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { motion } from 'motion/react';
import { Logo, clsx, fmtDate, useToast } from './ui';

const NAV: Record<Role, { href: string; label: string; icon: React.ElementType }[]> = {
  admin: [
    { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/admin/users', label: 'Users', icon: Users },
    { href: '/settings', label: 'Settings', icon: Settings },
  ],
  teacher: [
    { href: '/teacher', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/teacher/exams', label: 'Exams', icon: ClipboardList },
    { href: '/teacher/flags', label: 'AI Flags', icon: ShieldAlert },
    { href: '/settings', label: 'Settings', icon: Settings },
  ],
  student: [
    { href: '/student', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/student/results', label: 'Results', icon: BarChart3 },
    { href: '/settings', label: 'Settings', icon: Settings },
  ],
};

type Notif = { _id: string; title: string; body: string; link?: string; kind: string; read: boolean; createdAt: string };

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<{ list: Notif[]; unread: number }>({ list: [], unread: 0 });
  const toast = useToast();
  const router = useRouter();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const load = () => api('/notifications').then(setData).catch(() => {});
    load();
    const s = getSocket();
    const onN = (n: Notif) => { setData((d) => ({ list: [n, ...d.list].slice(0, 30), unread: d.unread + 1 })); toast(n.title, n.kind === 'info' ? 'info' : 'error'); };
    s.on('notification', onN);
    const close = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);
    return () => { s.off('notification', onN); document.removeEventListener('mousedown', close); };
  }, [toast]);

  const toggle = () => {
    setOpen(!open);
    if (!open && data.unread) api('/notifications/read', { method: 'POST' }).then(() => setData((d) => ({ ...d, unread: 0 })));
  };

  return (
    <div className="relative" ref={ref}>
      <button onClick={toggle} className="relative cursor-pointer rounded-xl p-2 text-muted hover:bg-brand-50 hover:text-ink" aria-label="Notifications">
        <Bell className="h-5 w-5" />
        {data.unread > 0 && <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">{data.unread}</span>}
      </button>
      {open && (
        <div className="card absolute right-0 z-40 mt-2 max-h-[70vh] w-[min(360px,calc(100vw-2rem))] overflow-auto p-2">
          <p className="px-2 py-1.5 text-sm font-semibold">Notifications</p>
          {data.list.length === 0 && <p className="px-2 py-6 text-center text-sm text-muted">You&apos;re all caught up</p>}
          {data.list.map((n) => (
            <button key={n._id} onClick={() => { setOpen(false); if (n.link) router.push(n.link); }}
              className="block w-full cursor-pointer rounded-lg px-2 py-2 text-left hover:bg-brand-50">
              <p className={clsx('text-sm font-medium', n.kind === 'alert' && 'text-red-600', n.kind === 'warning' && 'text-amber-700')}>{n.title}</p>
              <p className="line-clamp-2 text-xs text-muted">{n.body}</p>
              <p className="mt-0.5 text-[11px] text-slate-400">{fmtDate(n.createdAt)}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AppShell({ role, children }: { role: Role | Role[]; children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [mobile, setMobile] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const allowed = Array.isArray(role) ? role : [role];

  useEffect(() => {
    const u = getUser();
    if (!u) { router.replace('/login'); return; }
    if (!allowed.includes(u.role)) { router.replace(homeFor(u.role)); return; }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setUser(u);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  if (!user) return null;
  const nav = NAV[user.role];
  const active = (href: string) => (href === homeFor(user.role) ? pathname === href : pathname.startsWith(href));
  const current = nav.find((n) => active(n.href))?.label || '';

  const sidebar = (
    <nav className="flex h-full flex-col p-4" aria-label="Main">
      <Link href={homeFor(user.role)} className="mb-8 px-2 pt-1"><Logo size={28} /></Link>
      <p className="mb-2 px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Menu</p>
      <div className="space-y-1">
        {nav.map((n) => {
          const on = active(n.href);
          return (
            <Link key={n.href} href={n.href} onClick={() => setMobile(false)} aria-current={on ? 'page' : undefined}
              className={clsx('relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition', on ? 'text-white' : 'text-muted hover:bg-brand-50 hover:text-ink')}>
              {on && <motion.span layoutId="nav-active" className="brand-gradient absolute inset-0 rounded-xl shadow-lg shadow-indigo-500/30" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
              <n.icon className="relative h-4.5 w-4.5" /><span className="relative">{n.label}</span>
            </Link>
          );
        })}
      </div>
      <div className="mt-auto">
        <div className="brand-gradient-soft relative overflow-hidden rounded-2xl p-4">
          <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-brand-200/60" />
          {user.role === 'student' ? <GraduationCap className="relative h-5 w-5 text-brand-600" /> : <BookOpen className="relative h-5 w-5 text-brand-600" />}
          <p className="relative mt-2 text-sm font-semibold">{user.role === 'student' ? 'Exam day tip' : user.role === 'teacher' ? 'Live monitoring' : 'Admin tools'}</p>
          <p className="relative mt-0.5 text-xs text-muted">{user.role === 'student' ? 'Keep your camera on and stay in fullscreen.' : user.role === 'teacher' ? 'Open an exam to watch students in real time.' : 'Bulk-import students from a CSV file.'}</p>
        </div>
        <div className="mt-3 flex items-center gap-3 rounded-2xl border border-line p-2.5">
          <span className="brand-gradient grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-bold text-white">{user.name[0]}</span>
          <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{user.name}</span><span className="block text-xs capitalize text-muted">{user.role}</span></span>
          <button onClick={logout} className="grid h-8 w-8 cursor-pointer place-items-center rounded-lg text-muted hover:bg-red-50 hover:text-red-600" title="Log out" aria-label="Log out"><LogOut className="h-4 w-4" /></button>
        </div>
      </div>
    </nav>
  );

  return (
    <div className="min-h-screen">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-line bg-white lg:block">{sidebar}</aside>
      {mobile && (
        <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden" onClick={() => setMobile(false)}>
          <motion.aside initial={{ x: -280 }} animate={{ x: 0 }} className="h-full w-72 bg-white" onClick={(e) => e.stopPropagation()}>{sidebar}</motion.aside>
        </div>
      )}
      <div className="lg:pl-64">
        <header className="glass sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line/70 px-4 md:px-8">
          <div className="flex items-center gap-3">
            <button className="grid h-10 w-10 cursor-pointer place-items-center rounded-xl hover:bg-brand-50 lg:hidden" onClick={() => setMobile(true)} aria-label="Open menu"><Menu className="h-5 w-5" /></button>
            <p className="text-sm text-muted"><span className="capitalize">{user.role}</span>{current && <> <span className="mx-1 text-slate-300">/</span> <span className="font-semibold text-ink">{current}</span></>}</p>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <span className="brand-gradient grid h-9 w-9 place-items-center rounded-xl text-sm font-bold text-white lg:hidden">{user.name[0]}</span>
          </div>
        </header>
        <motion.main key={pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
          className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">{children}</motion.main>
      </div>
    </div>
  );
}
