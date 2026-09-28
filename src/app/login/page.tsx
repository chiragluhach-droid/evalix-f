'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle, ArrowLeft, ArrowRight, BookOpen, Camera, CheckCircle2, Eye, EyeOff, GraduationCap, KeyRound, Loader2, MonitorSmartphone, ShieldCheck, User as UserIcon } from 'lucide-react';
import { api, getUser, homeFor, setAuth, User } from '@/lib/api';
import { Logo, clsx } from '@/components/ui';

const DEMO = [
  { id: 'student', label: 'Student', icon: GraduationCap, user: 'CSE2025001', pw: 'password123', hint: 'Roll number or email' },
  { id: 'teacher', label: 'Teacher', icon: BookOpen, user: 'teacher@evalix.com', pw: 'password123', hint: 'Institution email' },
  { id: 'admin', label: 'Admin', icon: ShieldCheck, user: 'admin@evalix.com', pw: 'admin123', hint: 'Admin email' },
];
const SLIDES = [
  { icon: Camera, title: 'AI camera monitoring', body: 'Phones, extra people and missing faces are flagged with evidence for the teacher.' },
  { icon: MonitorSmartphone, title: 'Resume without losing answers', body: 'Every resume records whether the device, browser or network changed.' },
  { icon: ShieldCheck, title: 'Locked-down exam window', body: 'Fullscreen, tab-switch detection and copy/paste blocking — all logged.' },
];

export default function Login() {
  const router = useRouter();
  const [role, setRole] = useState(0);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [caps, setCaps] = useState(false);
  const [error, setError] = useState('');
  const [shake, setShake] = useState(0);
  const [state, setState] = useState<'idle' | 'loading' | 'success'>('idle');
  const [slide, setSlide] = useState(0);

  useEffect(() => { const u = getUser(); if (u) router.replace(homeFor(u.role)); }, [router]);
  useEffect(() => { const t = setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), 4000); return () => clearInterval(t); }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setState('loading');
    try {
      const { token, user } = await api<{ token: string; user: User }>('/auth/login', { body: { identifier, password } });
      setAuth(token, user);
      setState('success');
      setTimeout(() => router.replace(homeFor(user.role)), 500);
    } catch (err) {
      setError((err as Error).message);
      setShake((s) => s + 1);
      setState('idle');
    }
  };
  const fillDemo = () => { setIdentifier(DEMO[role].user); setPassword(DEMO[role].pw); setError(''); };
  const S = SLIDES[slide];

  return (
    <div className="grid min-h-screen bg-canvas lg:grid-cols-[1.05fr_1fr]">
      {/* brand panel */}
      <div className="brand-gradient relative hidden overflow-hidden p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="grid-lines absolute inset-0 opacity-20" />
        <div className="blob -right-10 top-10 h-80 w-80 bg-fuchsia-400 opacity-30" />
        <div className="blob bottom-0 left-0 h-96 w-96 bg-sky-400 opacity-30" style={{ animationDelay: '-8s' }} />
        <Link href="/" className="relative flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white"><ArrowLeft className="h-4 w-4" />Back to website</Link>

        <div className="relative">
          <h1 className="text-5xl font-extrabold leading-tight">Secure.<br />Intelligent.<br /><span className="text-white/70">Fair.</span></h1>
          <div className="relative mt-10 h-56 max-w-md">
            <div className="glass-dark float-slow absolute left-0 top-0 w-64 rounded-2xl p-4 shadow-2xl">
              <p className="text-xs text-white/70">Live monitor · OS Quiz</p>
              <div className="mt-2 flex items-end justify-between"><p className="font-display text-3xl font-bold">118</p><p className="flex items-center gap-1.5 text-xs text-emerald-200"><span className="pulse-ring h-2 w-2 rounded-full bg-emerald-400" />online</p></div>
              <div className="mt-3 flex h-10 items-end gap-1">{[40, 55, 48, 70, 62, 80, 74, 90].map((h, i) => <div key={i} className="flex-1 rounded-sm bg-white/40" style={{ height: `${h}%` }} />)}</div>
            </div>
            <div className="glass-dark float-slower absolute bottom-0 right-0 w-64 rounded-2xl p-4 shadow-2xl">
              <p className="flex items-center gap-2 text-sm font-semibold"><span className="grid h-7 w-7 place-items-center rounded-lg bg-red-500/30"><Camera className="h-4 w-4" /></span>AI flag · Phone</p>
              <p className="mt-1 text-xs text-white/70">Evidence sent to the exam creator</p>
            </div>
          </div>
        </div>

        <div className="relative max-w-md">
          <AnimatePresence mode="wait">
            <motion.div key={slide} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }} className="flex gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/15"><S.icon className="h-5 w-5" /></span>
              <div><p className="font-semibold">{S.title}</p><p className="text-sm text-white/75">{S.body}</p></div>
            </motion.div>
          </AnimatePresence>
          <div className="mt-5 flex gap-1.5">{SLIDES.map((_s, i) => <button key={i} aria-label={`Slide ${i + 1}`} onClick={() => setSlide(i)} className={clsx('h-1.5 cursor-pointer rounded-full transition-all', i === slide ? 'w-8 bg-white' : 'w-3 bg-white/40')} />)}</div>
        </div>
      </div>

      {/* form */}
      <div className="relative flex items-center justify-center p-6">
        <div className="dot-grid absolute right-0 top-0 h-40 w-56 opacity-60 [mask-image:linear-gradient(to_bottom_left,black,transparent)]" />
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="relative w-full max-w-md">
          <div className="mb-8 flex items-center justify-between">
            <Logo size={32} />
            <Link href="/" className="text-sm text-muted hover:text-ink lg:hidden">← Website</Link>
          </div>
          <h2 className="text-3xl font-extrabold">Welcome back!</h2>
          <p className="mt-1.5 text-muted">Log in to continue to your account.</p>

          <div className="mt-7 grid grid-cols-3 gap-1 rounded-2xl border border-line bg-white p-1" role="tablist" aria-label="I am a">
            {DEMO.map((d, i) => (
              <button key={d.id} role="tab" aria-selected={role === i} onClick={() => setRole(i)} className={clsx('relative flex cursor-pointer items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold transition', role === i ? 'text-brand-700' : 'text-muted hover:text-ink')}>
                {role === i && <motion.span layoutId="role" className="absolute inset-0 -z-0 rounded-xl bg-brand-50 ring-1 ring-brand-100" transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
                <d.icon className="relative h-4 w-4" /><span className="relative">{d.label}</span>
              </button>
            ))}
          </div>

          <motion.form key={shake} onSubmit={submit} className="mt-5 space-y-4" animate={shake ? { x: [0, -8, 8, -6, 6, 0] } : {}} transition={{ duration: 0.4 }}>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">{DEMO[role].hint}</span>
              <span className="relative block">
                <UserIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted" />
                <input value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder={DEMO[role].user} autoComplete="username" required
                  className={clsx('h-12 w-full rounded-2xl border bg-white pl-11 pr-4 text-[15px] outline-none transition focus:ring-4', error ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-line focus:border-brand-500 focus:ring-brand-100')} />
              </span>
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Password</span>
              <span className="relative block">
                <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted" />
                <input type={show ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required
                  onKeyUp={(e) => setCaps(e.getModifierState('CapsLock'))}
                  className={clsx('h-12 w-full rounded-2xl border bg-white pl-11 pr-12 text-[15px] outline-none transition focus:ring-4', error ? 'border-red-300 focus:border-red-400 focus:ring-red-100' : 'border-line focus:border-brand-500 focus:ring-brand-100')} />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 cursor-pointer place-items-center rounded-xl text-muted hover:bg-canvas" aria-label={show ? 'Hide password' : 'Show password'}>{show ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}</button>
              </span>
              {caps && <span className="mt-1.5 block text-xs font-medium text-amber-600">Caps Lock is on</span>}
            </label>
            <AnimatePresence>
              {error && (
                <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700" role="alert">
                  <AlertCircle className="h-4 w-4 shrink-0" />{error}
                </motion.p>
              )}
            </AnimatePresence>
            <button type="submit" disabled={state !== 'idle'}
              className={clsx('group flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-2xl font-semibold text-white shadow-lg transition', state === 'success' ? 'bg-emerald-600 shadow-emerald-500/30' : 'brand-gradient shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40')}>
              {state === 'loading' ? <Loader2 className="h-5 w-5 animate-spin" /> : state === 'success' ? <><CheckCircle2 className="h-5 w-5" />Welcome!</> : <>Log in <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></>}
            </button>
          </motion.form>

          <p className="mt-4 text-center text-sm text-muted">Forgot password? Ask your institution admin to reset it.</p>

          <div className="mt-8 flex items-center justify-between gap-3 rounded-2xl border border-dashed border-brand-200 bg-brand-50/50 p-4">
            <div className="text-sm"><p className="font-semibold text-brand-700">Demo {DEMO[role].label.toLowerCase()} account</p><p className="text-xs text-muted">{DEMO[role].user} · {DEMO[role].pw}</p></div>
            <button onClick={fillDemo} className="cursor-pointer rounded-xl bg-white px-3.5 py-2 text-sm font-semibold text-brand-700 shadow-sm ring-1 ring-brand-100 transition hover:bg-brand-600 hover:text-white">Use it</button>
          </div>
          <p className="mt-6 flex items-center justify-center gap-1.5 text-xs text-muted"><ShieldCheck className="h-3.5 w-3.5" />Accounts are provisioned by your institution — there is no public sign-up.</p>
        </motion.div>
      </div>
    </div>
  );
}
