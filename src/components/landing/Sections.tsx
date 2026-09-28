'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  BarChart3, Camera, Check, CheckCircle2, ClipboardCheck, Copy, Eye, FileText, Globe, GraduationCap, Laptop, Lock, LogIn, MonitorSmartphone,
  RefreshCcw, Smartphone, Sparkles, Target, Timer, UserCheck, Wifi, X, Building2, Briefcase, Brain, Languages, LineChart, LayoutDashboard,
} from 'lucide-react';
import { CountUp, Reveal, Spotlight, Stagger } from '@/components/fx';
import { clsx } from '@/components/ui';

export function SectionTitle({ eyebrow, title, accent, sub, center }: { eyebrow: string; title: string; accent: string; sub?: string; center?: boolean }) {
  return (
    <Reveal className={center ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
      <p className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-700"><Sparkles className="h-3.5 w-3.5" />{eyebrow}</p>
      <h2 className="mt-4 text-3xl font-extrabold md:text-5xl">{title} <span className="brand-text">{accent}</span></h2>
      {sub && <p className="mt-4 text-lg text-muted">{sub}</p>}
    </Reveal>
  );
}

/* ---------------- audience marquee ---------------- */
export function Marquee() {
  const items = [[GraduationCap, 'Colleges & universities'], [Target, 'Coaching institutes'], [Globe, 'EdTech platforms'], [Briefcase, 'Enterprises'], [Building2, 'Training academies'], [ClipboardCheck, 'Certification bodies']];
  return (
    <div className="relative border-y border-line bg-white py-5 [mask-image:linear-gradient(90deg,transparent,black_12%,black_88%,transparent)]">
      <div className="marquee flex w-max gap-12">
        {[...items, ...items].map(([I, t], i) => {
          const Icon = I as React.ElementType;
          return <span key={i} className="flex items-center gap-2 whitespace-nowrap text-sm font-semibold text-slate-500"><Icon className="h-5 w-5 text-brand-500" />{t as string}</span>;
        })}
      </div>
    </div>
  );
}

/* ---------------- problem: Forms vs Evalix ---------------- */
const COMPARE = [
  ['Tab switching & searching answers', 'Detected, timed and logged — with warnings and optional auto-submit'],
  ['Phone or someone helping off-screen', 'AI checks webcam frames and sends evidence to the teacher'],
  ['Credential sharing / impersonation', 'Reference photo, identity check on resume, one active session'],
  ['Leave, discuss, come back later', 'Server timer keeps running; resumes and device changes recorded'],
  ['Copy-paste answers', 'Blocked in the exam window, attempts logged'],
  ['No proof when cheating happens', 'Full timeline, snapshots and an integrity score per student'],
];
export function Problem() {
  const [evalix, setEvalix] = useState(true);
  return (
    <section id="problem" className="py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="grid items-end gap-8 lg:grid-cols-2">
          <SectionTitle eyebrow="The problem" title="Online exams are" accent="easy to cheat" sub="Most college exams run on Google Forms or unsecured platforms. Students exploit the loopholes — and teachers have no proof." />
          <Reveal className="flex lg:justify-end">
            <div className="glass relative inline-flex rounded-2xl p-1 shadow-sm">
              {[['Google Forms', false], ['With Evalix', true]].map(([l, v]) => (
                <button key={l as string} onClick={() => setEvalix(v as boolean)} className={clsx('relative z-10 cursor-pointer rounded-xl px-5 py-2.5 text-sm font-semibold transition', evalix === v ? (v ? 'text-white' : 'text-white') : 'text-muted hover:text-ink')}>
                  {evalix === v && <motion.span layoutId="cmp" className={clsx('absolute inset-0 -z-10 rounded-xl', v ? 'brand-gradient' : 'bg-red-500')} transition={{ type: 'spring', stiffness: 400, damping: 32 }} />}
                  {l as string}
                </button>
              ))}
            </div>
          </Reveal>
        </div>
        <div className="mt-10 grid gap-3 md:grid-cols-2">
          {COMPARE.map(([bad, good], i) => (
            <Reveal key={bad} delay={i * 0.04}>
              <div className={clsx('card flex items-start gap-4 p-5 transition-colors', evalix ? 'border-emerald-100' : 'border-red-100')}>
                <AnimatePresence mode="wait">
                  <motion.span key={String(evalix)} initial={{ scale: 0.4, rotate: -30, opacity: 0 }} animate={{ scale: 1, rotate: 0, opacity: 1 }} exit={{ scale: 0.4, opacity: 0 }}
                    className={clsx('grid h-9 w-9 shrink-0 place-items-center rounded-xl', evalix ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600')}>
                    {evalix ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
                  </motion.span>
                </AnimatePresence>
                <div>
                  <p className="font-semibold">{bad}</p>
                  <AnimatePresence mode="wait">
                    <motion.p key={String(evalix)} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={clsx('text-sm', evalix ? 'text-emerald-700' : 'text-red-600')}>
                      {evalix ? good : 'Nothing stops it and nothing is recorded.'}
                    </motion.p>
                  </AnimatePresence>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------------- features bento ---------------- */
export function Features() {
  const card = 'card card-hover h-full p-6';
  return (
    <section id="features" className="bg-white py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <SectionTitle center eyebrow="Our solution" title="Introducing" accent="Evalix" sub="A secure, AI-powered examination platform built to ensure fairness, integrity and accuracy in every exam." />
        <Stagger className="mt-14 grid auto-rows-fr gap-5 md:grid-cols-3" gap={0.08}>
          {[
            <Spotlight key="ai" className={clsx(card, 'md:col-span-2')}>
              <div className="flex h-full flex-col justify-between gap-6 md:flex-row md:items-center">
                <div className="max-w-sm">
                  <span className="brand-gradient grid h-12 w-12 place-items-center rounded-2xl text-white shadow-lg shadow-indigo-500/30"><Camera className="h-6 w-6" /></span>
                  <p className="mt-4 font-display text-xl font-bold">AI camera monitoring</p>
                  <p className="mt-2 text-muted">Webcam frames are checked for phones, extra people, missing or different faces, notes and covered cameras. Suspicious frames go straight to the exam creator as evidence.</p>
                </div>
                <div className="grid shrink-0 grid-cols-2 gap-2 text-xs">
                  {[['Phone', 'red'], ['Second person', 'red'], ['Different face', 'red'], ['Notes / books', 'amber'], ['Looking away', 'amber'], ['Camera covered', 'red']].map(([t, c]) => (
                    <span key={t} className={clsx('rounded-full px-3 py-1.5 font-medium ring-1 ring-inset', c === 'red' ? 'bg-red-50 text-red-700 ring-red-100' : 'bg-amber-50 text-amber-700 ring-amber-100')}>{t}</span>
                  ))}
                </div>
              </div>
            </Spotlight>,
            <Spotlight key="lock" className={card}>
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-600"><Lock className="h-6 w-6" /></span>
              <p className="mt-4 font-display text-lg font-bold">Browser lockdown</p>
              <p className="mt-2 text-sm text-muted">Fullscreen enforcement, tab-switch detection with time away, copy/paste, right-click and dev-tools blocking.</p>
            </Spotlight>,
            <Spotlight key="resume" className={card}>
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-50 text-violet-600"><RefreshCcw className="h-6 w-6" /></span>
              <p className="mt-4 font-display text-lg font-bold">Smart resume</p>
              <p className="mt-2 text-sm text-muted">Answers restored exactly. Every resume records device, browser and IP changes — or lock with No Exit & No Resume.</p>
            </Spotlight>,
            <Spotlight key="id" className={card}>
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-600"><UserCheck className="h-6 w-6" /></span>
              <p className="mt-4 font-display text-lg font-bold">Identity check</p>
              <p className="mt-2 text-sm text-muted">Reference photo at the start, re-verified on every resume. One active session per attempt.</p>
            </Spotlight>,
            <Spotlight key="eval" className={card}>
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-50 text-amber-600"><ClipboardCheck className="h-6 w-6" /></span>
              <p className="mt-4 font-display text-lg font-bold">Auto evaluation</p>
              <p className="mt-2 text-sm text-muted">Instant grading with negative marking, question-wise review, rank and class average.</p>
            </Spotlight>,
            <Spotlight key="analytics" className={clsx(card, 'md:col-span-3')}>
              <div className="grid items-center gap-8 md:grid-cols-[1fr_1.4fr]">
                <div>
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-sky-50 text-sky-600"><BarChart3 className="h-6 w-6" /></span>
                  <p className="mt-4 font-display text-xl font-bold">Smart analytics for teachers and students</p>
                  <p className="mt-2 text-muted">Performance trends, score distribution, topic strengths & weaknesses, top performers and integrity reports — all live.</p>
                </div>
                <div className="flex h-36 items-end gap-2">
                  {[42, 58, 50, 72, 64, 80, 76, 88, 70, 92].map((h, i) => (
                    <motion.div key={i} className="brand-gradient flex-1 rounded-t-lg opacity-80" initial={{ height: 0 }} whileInView={{ height: `${h}%` }} viewport={{ once: true }} transition={{ delay: i * 0.06, duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }} />
                  ))}
                </div>
              </div>
            </Spotlight>,
          ]}
        </Stagger>
      </div>
    </section>
  );
}

/* ---------------- how it works (interactive stepper) ---------------- */
const STEPS = [
  { icon: LogIn, t: 'Login & authenticate', d: 'Students sign in with email or roll number. Accounts are provisioned by the institution — no public sign-up.' },
  { icon: FileText, t: 'Create / start exam', d: 'Teachers build and publish. Students read the rules, accept them and take a reference photo.' },
  { icon: Eye, t: 'AI-powered monitoring', d: 'Camera frames, tab switches, fullscreen exits and disconnects stream to the teacher’s live monitor.' },
  { icon: CheckCircle2, t: 'Submit exam', d: 'Answers autosave. The server timer submits automatically when time runs out — even if the tab was closed.' },
  { icon: BarChart3, t: 'Evaluation & insights', d: 'Instant results with question-wise review, topic analysis and an integrity report for every attempt.' },
];
function StepScreen({ i }: { i: number }) {
  const screens = [
    <div key="0" className="mx-auto w-full max-w-xs space-y-3">
      <p className="text-center font-display text-lg font-bold">Welcome back!</p>
      <div className="rounded-xl border border-line px-3 py-2.5 text-sm text-muted">CSE2025001</div>
      <div className="rounded-xl border border-line px-3 py-2.5 text-sm text-muted">••••••••••</div>
      <div className="brand-gradient rounded-xl py-2.5 text-center text-sm font-semibold text-white">Login</div>
    </div>,
    <div key="1" className="space-y-2.5">
      <p className="font-display font-bold">Mid Sem Exam — DS & Algo</p>
      <div className="grid grid-cols-3 gap-2 text-center text-xs">{[['90 min', 'Duration'], ['60', 'Questions'], ['60', 'Marks']].map(([v, l]) => <div key={l} className="rounded-lg bg-canvas p-2"><p className="font-bold">{v}</p><p className="text-muted">{l}</p></div>)}</div>
      {['Do not switch tabs or minimize', 'Face must be visible at all times', 'No mobile phone or other device'].map((r) => <p key={r} className="flex items-center gap-2 text-xs"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />{r}</p>)}
      <div className="brand-gradient rounded-lg py-2 text-center text-xs font-semibold text-white">Start exam</div>
    </div>,
    <div key="2" className="space-y-2">
      {[['Face recognition', 'Active', 'text-emerald-600'], ['Tab monitoring', 'Active', 'text-emerald-600'], ['AI camera check', 'Every 30s', 'text-emerald-600'], ['Suspicious activity', 'Phone detected', 'text-red-600']].map(([l, v, c]) => (
        <div key={l} className="flex items-center justify-between rounded-lg border border-line px-3 py-2 text-xs"><span>{l}</span><span className={clsx('font-semibold', c)}>{v}</span></div>
      ))}
    </div>,
    <div key="3" className="space-y-2">
      <div className="flex items-center justify-between text-xs"><span className="text-muted">Question 12 / 60</span><span className="rounded-md bg-brand-50 px-2 py-0.5 font-mono font-semibold text-brand-700">00:35:20</span></div>
      <div className="rounded-lg bg-ink p-2.5 font-mono text-[11px] text-slate-200">int a = 5;<br />for (int i = 1; i &lt;= 3; i++) a += i;<br />cout &lt;&lt; a;</div>
      {['8', '11', '9'].map((o, k) => <div key={o} className={clsx('rounded-lg border px-3 py-1.5 text-xs', k === 1 ? 'border-brand-500 bg-brand-50' : 'border-line')}>{String.fromCharCode(65 + k)}. {o}</div>)}
    </div>,
    <div key="4">
      <div className="grid grid-cols-3 gap-2 text-center text-xs">{[['248', 'Students'], ['76.4%', 'Average'], ['85.2%', 'Pass rate']].map(([v, l]) => <div key={l} className="rounded-lg bg-canvas p-2"><p className="font-bold">{v}</p><p className="text-muted">{l}</p></div>)}</div>
      <div className="mt-3 flex h-24 items-end gap-1.5">{[50, 62, 58, 75, 70, 86].map((h, k) => <motion.div key={k} className="brand-gradient flex-1 rounded-t" initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ delay: k * 0.05 }} />)}</div>
    </div>,
  ];
  return screens[i];
}
export function HowItWorks() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  useEffect(() => { if (paused) return; const t = setInterval(() => setActive((a) => (a + 1) % STEPS.length), 3500); return () => clearInterval(t); }, [paused]);
  return (
    <section id="how" className="py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <SectionTitle eyebrow="How it works" title="From login to" accent="insights" sub="A smart, secure and seamless experience for teachers and students — in five steps." />
        <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_1.1fr]" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
          <div className="space-y-2">
            {STEPS.map((s, i) => (
              <button key={s.t} onClick={() => setActive(i)} className={clsx('relative flex w-full cursor-pointer items-start gap-4 overflow-hidden rounded-2xl border p-4 text-left transition', active === i ? 'border-brand-200 bg-white shadow-lg shadow-indigo-500/10' : 'border-transparent hover:bg-white/70')}>
                <span className={clsx('grid h-11 w-11 shrink-0 place-items-center rounded-xl transition', active === i ? 'brand-gradient text-white' : 'bg-brand-50 text-brand-600')}><s.icon className="h-5 w-5" /></span>
                <span>
                  <span className="text-xs font-bold text-brand-600">0{i + 1}</span>
                  <span className="block font-display font-bold">{s.t}</span>
                  <AnimatePresence initial={false}>
                    {active === i && <motion.span initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="block overflow-hidden text-sm text-muted">{s.d}</motion.span>}
                  </AnimatePresence>
                </span>
                {active === i && !paused && <motion.span key={`bar${i}`} className="absolute bottom-0 left-0 h-0.5 bg-brand-500" initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 3.5, ease: 'linear' }} />}
              </button>
            ))}
          </div>
          <div className="relative">
            <div className="blob left-10 top-10 h-60 w-60 bg-violet-200" />
            <div className="glass relative flex min-h-[340px] items-center rounded-3xl p-6 shadow-xl shadow-indigo-500/10 md:p-10">
              <div className="absolute left-5 top-4 flex gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-300" /><span className="h-2.5 w-2.5 rounded-full bg-amber-300" /><span className="h-2.5 w-2.5 rounded-full bg-emerald-300" /></div>
              <AnimatePresence mode="wait">
                <motion.div key={active} className="w-full" initial={{ opacity: 0, y: 14, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.35 }}>
                  <StepScreen i={active} />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ---------------- resume & device tracking ---------------- */
export function ResumeTracking() {
  const sessions = [
    { icon: Laptop, t: 'Exam started', d: 'Chrome · Windows 11 · 10.0.4.21', tag: 'Start', c: 'emerald', changed: null },
    { icon: Wifi, t: 'Disconnected', d: 'No heartbeat for 20s — tab closed or network lost', tag: 'Away 2m 14s', c: 'amber', changed: null },
    { icon: Smartphone, t: 'Resumed #1', d: 'Mobile Safari · iOS 18 · 49.36.12.8', tag: 'Resume', c: 'blue', changed: { device: true, browser: true, ip: true } },
    { icon: Laptop, t: 'Resumed #2', d: 'Chrome · Windows 11 · 10.0.4.21', tag: 'Resume', c: 'blue', changed: { device: false, browser: true, ip: true } },
  ];
  return (
    <section id="security" className="relative overflow-hidden bg-brand-900 py-24 text-white">
      <div className="grid-lines absolute inset-0 opacity-30" />
      <div className="blob -right-20 top-0 h-96 w-96 bg-indigo-600 opacity-40" />
      <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-4 md:px-8 lg:grid-cols-2">
        <div>
          <Reveal>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-200"><MonitorSmartphone className="h-3.5 w-3.5" />Security & anti-cheating</p>
            <h2 className="mt-4 text-3xl font-extrabold md:text-5xl">Every resume, every device, <span className="bg-gradient-to-r from-indigo-300 to-sky-300 bg-clip-text text-transparent">on record</span></h2>
            <p className="mt-4 text-lg text-indigo-100/80">Students can safely recover from a dropped connection — but the teacher sees exactly what happened: how long they were away and whether the device, browser or network changed.</p>
          </Reveal>
          <Stagger className="mt-8 grid grid-cols-2 gap-3" gap={0.06}>
            {[[Timer, 'Server-side timer', 'Closing the tab never stops the clock'], [Copy, 'Copy/paste blocked', 'Attempts are still logged'], [UserCheck, 'Identity on resume', 'Fresh photo vs. reference'], [Lock, 'No Exit mode', 'Leaving locks the attempt']].map(([I, t, d]) => {
              const Icon = I as React.ElementType;
              return <div key={t as string} className="glass-dark h-full rounded-2xl p-4"><Icon className="h-5 w-5 text-indigo-300" /><p className="mt-2 font-semibold">{t as string}</p><p className="text-sm text-indigo-100/70">{d as string}</p></div>;
            })}
          </Stagger>
        </div>
        <Reveal delay={0.1}>
          <div className="glass-dark rounded-3xl p-6">
            <div className="mb-4 flex items-center justify-between"><p className="font-semibold">Aditya Verma · Sessions & devices</p><span className="rounded-full bg-red-500/20 px-2.5 py-0.5 text-xs font-semibold text-red-200">Device changed</span></div>
            <ol className="relative space-y-4 border-l border-white/15 pl-6">
              {sessions.map((s, i) => (
                <motion.li key={s.t} className="relative" initial={{ opacity: 0, x: 16 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }} transition={{ delay: 0.15 + i * 0.18 }}>
                  <span className={clsx('absolute -left-[33px] grid h-5 w-5 place-items-center rounded-full ring-4 ring-brand-900', { emerald: 'bg-emerald-400', amber: 'bg-amber-400', blue: 'bg-sky-400' }[s.c])} />
                  <div className="rounded-2xl bg-white/5 p-3.5">
                    <div className="flex items-center justify-between gap-2"><p className="flex items-center gap-2 font-semibold"><s.icon className="h-4 w-4 text-indigo-300" />{s.t}</p><span className="text-xs text-indigo-200">{s.tag}</span></div>
                    <p className="mt-0.5 text-xs text-indigo-100/70">{s.d}</p>
                    {s.changed && (
                      <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
                        {Object.entries(s.changed).map(([k, v]) => <span key={k} className={clsx('rounded-full px-2 py-0.5 font-semibold', v ? 'bg-red-500/25 text-red-100' : 'bg-white/10 text-indigo-100')}>{k} changed: {v ? 'YES' : 'no'}</span>)}
                      </div>
                    )}
                  </div>
                </motion.li>
              ))}
            </ol>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ---------------- stats + market + roadmap ---------------- */
export function Market() {
  const roadmap = [[Brain, 'AI-generated feedback', 'Automated, personalised suggestions'], [Eye, 'Advanced proctoring', 'Emotion & object detection'], [LayoutDashboard, 'Institution dashboard', 'Deep insights for administrators'], [Smartphone, 'Mobile app', 'On-the-go exams & notifications'], [LineChart, 'Predictive analytics', 'Spot students at risk early'], [Languages, 'Multi-language', 'Regional language support']];
  return (
    <section id="roadmap" className="py-24">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <Stagger className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            [<CountUp key="a" value={100} suffix="%" />, 'Secure exam environment', 'text-brand-600'],
            [<CountUp key="b" value={0} />, 'Unfair advantages allowed', 'text-sky-600'],
            [<CountUp key="c" value={7.6} decimals={1} prefix="$" suffix="B+" />, 'Global online exam market (2024)', 'text-violet-600'],
            [<CountUp key="d" value={15.2} decimals={1} suffix="%" />, 'Market CAGR 2024–2030', 'text-emerald-600'],
          ].map(([v, l, c], i) => (
            <div key={i} className="card card-hover h-full p-6 text-center">
              <p className={clsx('font-display text-4xl font-extrabold md:text-5xl', c as string)}>{v}</p>
              <p className="mt-2 text-sm text-muted">{l}</p>
            </div>
          ))}
        </Stagger>
        <div className="mt-24">
          <SectionTitle eyebrow="Future roadmap" title="Where Evalix goes" accent="next" />
          <Stagger className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" gap={0.06}>
            {roadmap.map(([I, t, d], i) => {
              const Icon = I as React.ElementType;
              return (
                <Spotlight key={t as string} className="card card-hover flex h-full items-start gap-4 p-5">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600"><Icon className="h-5 w-5" /></span>
                  <div><p className="text-xs font-bold text-brand-500">PHASE {Math.floor(i / 2) + 2}</p><p className="font-display font-bold">{t as string}</p><p className="text-sm text-muted">{d as string}</p></div>
                </Spotlight>
              );
            })}
          </Stagger>
        </div>
      </div>
    </section>
  );
}
