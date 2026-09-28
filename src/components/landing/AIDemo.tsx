'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { BookOpen, CameraOff, CheckCircle2, EyeOff, Loader2, Mail, ScanFace, Smartphone, Users } from 'lucide-react';
import { clsx } from '@/components/ui';

type Scenario = { id: string; label: string; icon: React.ElementType; severity: 'none' | 'medium' | 'high'; types: string[]; reason: string; json: Record<string, unknown> };
const BASE = { facePresent: true, personCount: 1, identityMatch: true, phoneDetected: false, booksOrNotes: false, lookingAway: false, cameraBlocked: false };
const SCENARIOS: Scenario[] = [
  { id: 'clean', label: 'Honest student', icon: CheckCircle2, severity: 'none', types: [], reason: 'Student is facing the screen. Nothing suspicious.', json: BASE },
  { id: 'phone', label: 'Using a phone', icon: Smartphone, severity: 'high', types: ['Phone'], reason: 'A mobile phone is visible in the student’s hand.', json: { ...BASE, phoneDetected: true } },
  { id: 'person', label: 'Someone helping', icon: Users, severity: 'high', types: ['Multiple people'], reason: 'A second person is visible behind the student.', json: { ...BASE, personCount: 2 } },
  { id: 'notes', label: 'Reading notes', icon: BookOpen, severity: 'medium', types: ['Books/notes', 'Looking away'], reason: 'Student is looking down at an open notebook.', json: { ...BASE, booksOrNotes: true, lookingAway: true } },
  { id: 'away', label: 'Left the seat', icon: EyeOff, severity: 'medium', types: ['No face'], reason: 'No face is visible in the frame.', json: { ...BASE, facePresent: false, personCount: 0 } },
  { id: 'blocked', label: 'Camera covered', icon: CameraOff, severity: 'high', types: ['Camera blocked'], reason: 'The camera appears to be covered.', json: { ...BASE, facePresent: false, cameraBlocked: true, personCount: 0 } },
];

function Scene({ s }: { s: Scenario }) {
  const away = s.id === 'away';
  const lookDown = s.id === 'notes';
  return (
    <svg viewBox="0 0 400 300" className="h-full w-full">
      <defs>
        <linearGradient id="wall" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#e8e6f5" /><stop offset="1" stopColor="#cfd2ea" /></linearGradient>
        <linearGradient id="shirt" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#4f46e5" /><stop offset="1" stopColor="#3730a3" /></linearGradient>
      </defs>
      <rect width="400" height="300" fill="url(#wall)" />
      <rect x="28" y="30" width="90" height="70" rx="6" fill="#bfdbfe" stroke="#fff" strokeWidth="5" />
      <line x1="73" y1="30" x2="73" y2="100" stroke="#fff" strokeWidth="4" />
      <g transform="translate(335 150)"><rect x="-14" y="30" width="28" height="30" rx="4" fill="#a16207" /><ellipse cx="0" cy="12" rx="22" ry="26" fill="#16a34a" /><ellipse cx="-12" cy="0" rx="12" ry="18" fill="#22c55e" /></g>
      {/* second person in background */}
      <AnimatePresence>
        {s.id === 'person' && (
          <motion.g initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
            <circle cx="300" cy="110" r="26" fill="#8d5a3b" /><path d="M274 104 q26 -34 52 0 q-4 -18 -26 -20 q-22 2 -26 20z" fill="#1f2937" />
            <path d="M255 200 q45 -70 90 0 v40 h-90z" fill="#0f766e" />
          </motion.g>
        )}
      </AnimatePresence>
      {/* desk */}
      <rect x="0" y="250" width="400" height="50" fill="#a78b6d" /><rect x="0" y="246" width="400" height="8" fill="#8b6f52" />
      {/* student */}
      <AnimatePresence>
        {!away && (
          <motion.g initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 30 }} transition={{ duration: 0.4 }}>
            <path d="M110 260 q90 -120 180 0z" fill="url(#shirt)" />
            <rect x="188" y="168" width="24" height="24" fill="#c68a62" />
            <motion.g animate={{ rotate: lookDown ? 14 : 0, y: lookDown ? 6 : 0 }} style={{ transformBox: 'view-box', transformOrigin: '200px 175px' }} transition={{ type: 'spring', stiffness: 120 }}>
              <ellipse cx="200" cy="135" rx="40" ry="46" fill="#d69a70" />
              <path d="M160 128 q2 -48 40 -50 q40 2 40 50 q-6 -26 -40 -28 q-34 2 -40 28z" fill="#1f2937" />
              <circle cx="186" cy="138" r="4" fill="#1f2937" /><circle cx="214" cy="138" r="4" fill="#1f2937" />
              <path d="M188 160 q12 8 24 0" stroke="#7c3f2a" strokeWidth="3" fill="none" strokeLinecap="round" />
            </motion.g>
          </motion.g>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {s.id === 'phone' && (
          <motion.g initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }}>
            <ellipse cx="262" cy="232" rx="16" ry="12" fill="#d69a70" />
            <rect x="248" y="178" width="30" height="54" rx="6" fill="#111827" /><rect x="252" y="184" width="22" height="40" rx="3" fill="#60a5fa" />
          </motion.g>
        )}
        {s.id === 'notes' && (
          <motion.g initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <path d="M130 262 l70 -10 l70 10 l-70 14z" fill="#fff" stroke="#cbd5e1" /><line x1="200" y1="252" x2="200" y2="276" stroke="#94a3b8" />
            {[0, 1, 2].map((i) => <line key={i} x1={148 + i * 2} y1={262 + i * 3} x2={188} y2={258 + i * 3} stroke="#94a3b8" strokeWidth="1.5" />)}
          </motion.g>
        )}
      </AnimatePresence>
      <AnimatePresence>{s.id === 'blocked' && <motion.rect initial={{ opacity: 0 }} animate={{ opacity: 0.97 }} exit={{ opacity: 0 }} width="400" height="300" fill="#0b0b14" />}</AnimatePresence>
    </svg>
  );
}

export default function AIDemo() {
  const [idx, setIdx] = useState(1);
  const [stage, setStage] = useState<'scanning' | 'result'>('scanning');
  const [auto, setAuto] = useState(true);
  const s = SCENARIOS[idx];
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    timer.current = setTimeout(() => setStage('result'), 1400);
    return () => clearTimeout(timer.current);
  }, [idx]);
  useEffect(() => {
    if (!auto || stage !== 'result') return;
    const t = setTimeout(() => { setStage('scanning'); setIdx((i) => (i + 1) % SCENARIOS.length); }, 4200);
    return () => clearTimeout(t);
  }, [auto, stage]);

  const pick = (i: number) => { setAuto(false); setStage('scanning'); setIdx(i); };
  const flagged = s.severity !== 'none';

  return (
    <div className="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
      <div>
        <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-slate-900 shadow-2xl shadow-indigo-500/20 ring-1 ring-white/10">
          <Scene s={s} />
          <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-black/55 px-3 py-1 text-xs font-medium text-white backdrop-blur">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />REC · webcam frame
          </div>
          <div className="absolute right-4 top-4 rounded-full bg-black/55 px-3 py-1 font-mono text-xs text-white backdrop-blur">00:24:1{idx}</div>
          {stage === 'scanning' && (
            <>
              <div className="scan-line absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-indigo-400 to-transparent shadow-[0_0_16px_4px_rgba(129,140,248,.6)]" />
              <div className="absolute bottom-4 left-4 flex items-center gap-2 rounded-full bg-black/60 px-3 py-1.5 text-xs text-white backdrop-blur"><Loader2 className="h-3.5 w-3.5 animate-spin" />Gemini is analysing the frame…</div>
            </>
          )}
          <AnimatePresence>
            {stage === 'result' && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                className={clsx('absolute bottom-4 left-4 flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold text-white', flagged ? 'bg-red-600' : 'bg-emerald-600')}>
                {flagged ? <><ScanFace className="h-4 w-4" />Flagged: {s.types.join(' + ')}</> : <><CheckCircle2 className="h-4 w-4" />Clean frame</>}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {SCENARIOS.map((x, i) => (
            <button key={x.id} onClick={() => pick(i)} aria-pressed={i === idx}
              className={clsx('flex cursor-pointer flex-col items-center gap-1 rounded-2xl border px-2 py-2.5 text-[11px] font-medium transition', i === idx ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-sm' : 'border-line bg-white text-muted hover:border-brand-200 hover:text-ink')}>
              <x.icon className="h-4.5 w-4.5" />{x.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div className="rounded-3xl bg-ink p-5 font-mono text-[12.5px] leading-relaxed text-slate-300 shadow-xl">
          <p className="mb-2 flex items-center justify-between font-sans text-xs text-slate-400"><span>AI response</span><span className="rounded bg-white/10 px-2 py-0.5">gemini-2.5-flash</span></p>
          <AnimatePresence mode="wait">
            {stage === 'scanning' ? (
              <motion.div key="s" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2 py-1">
                {[80, 60, 72, 50, 66].map((w, i) => <div key={i} className="h-3 animate-pulse rounded bg-white/10" style={{ width: `${w}%` }} />)}
              </motion.div>
            ) : (
              <motion.pre key={s.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="whitespace-pre-wrap">
                {'{\n'}{Object.entries({ ...s.json, severity: s.severity }).map(([k, v]) => (
                  <span key={k}>  <span className="text-indigo-300">&quot;{k}&quot;</span>: <span className={clsx(typeof v === 'boolean' ? (v === (k === 'facePresent' || k === 'identityMatch') ? 'text-emerald-300' : 'text-rose-300') : 'text-amber-200')}>{JSON.stringify(v)}</span>,{'\n'}</span>
                ))}  <span className="text-indigo-300">&quot;reason&quot;</span>: <span className="text-amber-200">&quot;{s.reason}&quot;</span>{'\n}'}
              </motion.pre>
            )}
          </AnimatePresence>
        </div>
        <AnimatePresence mode="wait">
          {stage === 'result' && (
            <motion.div key={s.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} transition={{ delay: 0.25 }}
              className={clsx('card flex items-start gap-3 p-4', flagged ? 'border-red-200' : 'border-emerald-200')}>
              <span className={clsx('grid h-10 w-10 shrink-0 place-items-center rounded-xl', flagged ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600')}>{flagged ? <Mail className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}</span>
              <div>
                <p className="font-semibold">{flagged ? 'Evidence sent to the exam creator' : 'No action needed'}</p>
                <p className="text-sm text-muted">{flagged ? `Live alert + notification + email with this frame. Severity ${s.severity}. The teacher confirms or dismisses — the AI never decides alone.` : 'The frame is stored in the attempt log. Monitoring continues every few seconds and after every tab switch.'}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <p className="text-xs text-muted">This is an illustration. In the real exam, the student’s webcam frames are checked the same way and compared against the reference photo taken at the start.</p>
      </div>
    </div>
  );
}
