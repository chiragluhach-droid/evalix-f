'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ArrowRight, BarChart3, Brain, CheckCircle2, FileText, MonitorSmartphone, PlayCircle, ShieldCheck, Smartphone, TrendingUp, UserCheck, Users } from 'lucide-react';
import { CountUp, Tilt } from '@/components/fx';
import { Logo } from '@/components/ui';

const WORDS = ['Secure.', 'Intelligent.', 'Fair.'];
const ALERTS = [
  { icon: Smartphone, color: 'text-red-600 bg-red-50', title: 'AI flag · Phone detected', body: 'Riya S. — evidence sent to Dr. Kapoor' },
  { icon: MonitorSmartphone, color: 'text-amber-600 bg-amber-50', title: 'Resumed on a new device', body: 'Aditya V. — device changed: YES' },
  { icon: ShieldCheck, color: 'text-emerald-600 bg-emerald-50', title: 'All clear', body: '118 students · no violations in 5 min' },
  { icon: Users, color: 'text-red-600 bg-red-50', title: 'AI flag · Second person', body: 'Karan S. — review in AI Flags' },
];
const CHART = 'M0 78 C 25 70, 35 62, 55 64 S 90 40, 110 44 S 145 20, 165 30 S 200 36, 220 26 S 260 8, 300 6';

function RotatingWord() {
  const [i, setI] = useState(0);
  useEffect(() => { const t = setInterval(() => setI((x) => (x + 1) % WORDS.length), 2200); return () => clearInterval(t); }, []);
  return (
    <span className="relative inline-flex h-[1.2em] min-w-[6.5ch] overflow-hidden align-bottom">
      <AnimatePresence mode="popLayout">
        <motion.span key={WORDS[i]} className="brand-text" initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '-100%', opacity: 0 }} transition={{ duration: 0.45, ease: [0.2, 0.8, 0.2, 1] }}>
          {WORDS[i]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

function HeroDashboard() {
  const reduce = useReducedMotion();
  const [alert, setAlert] = useState(0);
  useEffect(() => { const t = setInterval(() => setAlert((a) => (a + 1) % ALERTS.length), 3200); return () => clearInterval(t); }, []);
  const A = ALERTS[alert];
  return (
    <Tilt className="relative" max={6}>
      <div className="card overflow-hidden p-0 shadow-2xl shadow-indigo-500/15">
        <div className="flex items-center gap-1.5 border-b border-line bg-canvas/70 px-4 py-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-300" /><span className="h-2.5 w-2.5 rounded-full bg-amber-300" /><span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
          <span className="ml-3 rounded-md bg-white px-3 py-0.5 text-[11px] text-muted ring-1 ring-line">evalix.app/teacher</span>
        </div>
        <div className="flex">
          <div className="hidden w-40 shrink-0 border-r border-line p-4 sm:block">
            <Logo size={18} />
            {['Dashboard', 'Exams', 'Live monitor', 'AI Flags', 'Reports'].map((x, i) => (
              <div key={x} className={`mt-2.5 rounded-lg px-2 py-1.5 text-[11px] ${i === 0 ? 'bg-brand-50 font-semibold text-brand-700' : 'text-muted'}`}>{x}</div>
            ))}
          </div>
          <div className="min-w-0 flex-1 p-5">
            <p className="font-display text-base font-bold">Dashboard</p><p className="text-[11px] text-muted">Welcome back, Teacher!</p>
            <div className="mt-3 grid grid-cols-2 gap-2.5 md:grid-cols-4">
              {[[FileText, 'Total Exams', 24, ''], [Users, 'Students', 532, ''], [CheckCircle2, 'Completed', 186, ''], [TrendingUp, 'Avg. Score', 76.4, '%']].map(([I, l, v, s]) => {
                const Icon = I as React.ElementType;
                return (
                  <div key={l as string} className="rounded-xl border border-line p-2.5">
                    <div className="flex items-center justify-between"><p className="text-[10px] text-muted">{l as string}</p><Icon className="h-3.5 w-3.5 text-brand-500" /></div>
                    <p className="mt-1 font-display text-lg font-bold"><CountUp value={v as number} decimals={s ? 1 : 0} suffix={s as string} /></p>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 rounded-xl border border-line p-3">
              <div className="flex items-center justify-between text-[11px]"><span className="font-semibold">Exam activity</span><span className="flex items-center gap-1 text-emerald-600"><span className="pulse-ring h-1.5 w-1.5 rounded-full bg-emerald-500" />Live</span></div>
              <svg viewBox="0 0 300 90" className="mt-1 w-full">
                <defs><linearGradient id="hg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#6366f1" stopOpacity=".3" /><stop offset="1" stopColor="#6366f1" stopOpacity="0" /></linearGradient></defs>
                <motion.path d={`${CHART} L300 90 L0 90Z`} fill="url(#hg)" initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.9, duration: 0.6 }} />
                <motion.path d={CHART} fill="none" stroke="#6366f1" strokeWidth="2.5" strokeLinecap="round" initial={reduce ? false : { pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.6, ease: 'easeInOut' }} />
              </svg>
            </div>
            <div className="mt-3 space-y-1.5">
              {[['Mid Sem Exam', '120 students'], ['DSA Test', '85 students'], ['Math Quiz', '43 students']].map(([x, n]) => (
                <div key={x} className="flex items-center justify-between text-[11px]"><span><b className="font-medium">{x}</b> <span className="text-muted">· {n}</span></span><span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">Completed</span></div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* floating live alert */}
      <div className="absolute -bottom-8 -left-6 z-10 hidden w-72 md:block">
        <AnimatePresence mode="wait">
          <motion.div key={alert} initial={{ opacity: 0, y: 12, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.98 }} transition={{ duration: 0.35 }}
            className="glass flex items-start gap-3 rounded-2xl p-3.5 shadow-xl shadow-indigo-500/10">
            <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${A.color}`}><A.icon className="h-4.5 w-4.5" /></span>
            <div><p className="text-sm font-semibold">{A.title}</p><p className="text-xs text-muted">{A.body}</p></div>
          </motion.div>
        </AnimatePresence>
      </div>
      {/* floating phone mockup */}
      <div className="float-slow absolute -right-5 -top-8 z-10 hidden w-36 rounded-[22px] border-4 border-ink bg-white p-2.5 shadow-2xl lg:block">
        <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-slate-200" />
        <p className="text-[9px] text-muted">Section A · Q12 of 30</p>
        <div className="mt-1 rounded-md bg-ink p-1.5 font-mono text-[7px] leading-tight text-slate-200">let a = 5;<br />let b = 10;<br />console.log(a + b);</div>
        {['15', '10', '5'].map((o, i) => <div key={o} className={`mt-1 rounded-md border px-1.5 py-0.5 text-[8px] ${i === 0 ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-line'}`}>{String.fromCharCode(65 + i)}. {o}</div>)}
        <div className="mt-1.5 rounded-md bg-brand-600 py-0.5 text-center text-[8px] font-semibold text-white">Save & Next</div>
      </div>
    </Tilt>
  );
}

export default function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="grid-lines absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />
      <div className="blob -left-20 top-10 h-72 w-72 bg-violet-300" />
      <div className="blob right-0 top-40 h-80 w-80 bg-blue-300" style={{ animationDelay: '-6s' }} />
      <div className="blob bottom-0 left-1/3 h-60 w-60 bg-indigo-300" style={{ animationDelay: '-12s' }} />
      <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-4 pb-24 pt-14 md:px-8 lg:grid-cols-[1.05fr_1fr] lg:pt-20">
        <div>
          <motion.a href="#ai-demo" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="glass inline-flex items-center gap-2 rounded-full py-1 pl-1 pr-3 text-sm shadow-sm">
            <span className="brand-gradient rounded-full px-2.5 py-0.5 text-xs font-semibold text-white">New</span>
            AI camera monitoring is live <ArrowRight className="h-3.5 w-3.5" />
          </motion.a>
          <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
            className="mt-6 text-[2.6rem] font-extrabold leading-[1.05] sm:text-6xl lg:text-7xl">
            <span className="brand-text">Smart AI-Powered</span><br />Evaluation Platform
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="mt-6 font-display text-2xl font-bold sm:text-3xl">
            Exams that are <RotatingWord />
          </motion.p>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-4 max-w-xl text-lg leading-relaxed text-muted">
            Replace Google Forms with a secure exam platform: AI checks every webcam frame, the browser is locked down, and every tab switch, resume and device change is on record.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-8 flex flex-wrap gap-3">
            <Link href="/login" className="brand-gradient group inline-flex h-12 items-center gap-2 rounded-2xl px-6 font-semibold text-white shadow-lg shadow-indigo-500/30 transition hover:shadow-xl hover:shadow-indigo-500/40">
              Get started <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
            </Link>
            <a href="#ai-demo" className="glass inline-flex h-12 items-center gap-2 rounded-2xl px-6 font-semibold transition hover:bg-white">
              <PlayCircle className="h-5 w-5 text-brand-600" /> See the AI in action
            </a>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }} className="mt-12 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-4">
            {[[ShieldCheck, 'Secure exam environment'], [Brain, 'AI-powered monitoring'], [BarChart3, 'Smart analytics'], [UserCheck, 'Trusted & reliable']].map(([I, t]) => {
              const Icon = I as React.ElementType;
              return (
                <div key={t as string} className="glass group rounded-2xl p-3 text-center transition hover:-translate-y-1 hover:bg-white">
                  <Icon className="mx-auto h-6 w-6 text-brand-600 transition group-hover:scale-110" />
                  <p className="mt-1.5 text-xs font-semibold leading-tight">{t as string}</p>
                </div>
              );
            })}
          </motion.div>
        </div>
        <motion.div initial={{ opacity: 0, y: 30, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.25, duration: 0.7, ease: [0.2, 0.8, 0.2, 1] }}>
          <HeroDashboard />
        </motion.div>
      </div>
    </section>
  );
}
