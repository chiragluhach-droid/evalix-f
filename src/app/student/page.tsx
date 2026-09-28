'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowRight, Award, Calendar, Camera, CheckCircle2, Clock, FileText, Lock, PlayCircle, RefreshCcw, TrendingUp } from 'lucide-react';
import { api, getUser } from '@/lib/api';
import { Card, DashSkeleton, Empty, Stat, clsx, fmtDate } from '@/components/ui';
import { ChartTooltip, Stagger } from '@/components/fx';
import Welcome, { Chip } from '@/components/Welcome';

type Ex = { _id: string; title: string; subject?: string; durationMin: number; startAt?: string; endAt?: string; teacher?: string; questionCount: number; totalMarks: number; open: boolean; upcoming?: boolean; aiProctoring: boolean; attempt: { _id: string; status: string; score?: number } | null };
type Res = { _id: string; title: string; submittedAt: string; pct: number | null; published: boolean };
const STRIPS = ['from-violet-500 to-indigo-600', 'from-sky-500 to-blue-600', 'from-emerald-500 to-teal-600', 'from-fuchsia-500 to-purple-600', 'from-amber-500 to-orange-600'];

function Ring({ pct }: { pct: number }) {
  const r = 18, c = 2 * Math.PI * r;
  const color = pct >= 60 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444';
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" className="shrink-0" aria-label={`${pct}%`}>
      <circle cx="24" cy="24" r={r} fill="none" stroke="#eef0f6" strokeWidth="5" />
      <circle cx="24" cy="24" r={r} fill="none" stroke={color} strokeWidth="5" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} transform="rotate(-90 24 24)" style={{ transition: 'stroke-dashoffset 1s' }} />
      <text x="24" y="28" textAnchor="middle" fontSize="11" fontWeight="700" fill="#0f1535">{pct}</text>
    </svg>
  );
}

export default function StudentHome() {
  const [exams, setExams] = useState<Ex[] | null>(null);
  const [results, setResults] = useState<Res[]>([]);
  useEffect(() => { api('/student/exams').then(setExams); api('/student/results').then(setResults); }, []);
  if (!exams) return <DashSkeleton />;
  const available = exams.filter((e) => !e.attempt || e.attempt.status !== 'submitted');
  const openNow = available.filter((e) => e.open || e.attempt?.status === 'in_progress');
  const done = results.filter((r) => r.pct != null);
  const avg = done.length ? Math.round(done.reduce((s, r) => s + (r.pct || 0), 0) / done.length) : 0;
  const best = done.length ? Math.max(...done.map((r) => r.pct || 0)) : 0;
  const first = getUser()?.name.split(' ')[0] || 'there';

  return (
    <>
      <Welcome name={`Hi, ${first}`} sub={openNow.length ? `You have ${openNow.length} exam${openNow.length > 1 ? 's' : ''} open right now. Keep your camera on and stay in fullscreen — good luck!` : 'No exams open right now. Review your results and keep improving.'}
        chips={<><Chip><Award className="h-3.5 w-3.5" />Best {best}%</Chip><Chip><TrendingUp className="h-3.5 w-3.5" />Average {avg}%</Chip></>}
        actions={openNow[0] && (
          <Link href={`/exam/${openNow[0]._id}`} className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-brand-700 shadow-lg transition hover:-translate-y-0.5">
            {openNow[0].attempt?.status === 'in_progress' ? <><RefreshCcw className="h-4 w-4" />Resume {openNow[0].title}</> : <><PlayCircle className="h-4 w-4" />Start {openNow[0].title}</>}
          </Link>
        )} />

      <Stagger className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          <Stat key="a" label="Open exams" value={openNow.length} icon={<FileText className="h-5 w-5" />} />,
          <Stat key="b" label="Completed" value={results.length} icon={<CheckCircle2 className="h-5 w-5" />} tint="green" />,
          <Stat key="c" label="Average score" value={avg} suffix="%" icon={<TrendingUp className="h-5 w-5" />} tint="blue" />,
          <Stat key="d" label="Best score" value={best} suffix="%" icon={<Award className="h-5 w-5" />} tint="amber" />,
        ]}
      </Stagger>

      <div className="mb-3 mt-8 flex items-center justify-between"><h2 className="font-display text-xl font-bold">Your exams</h2></div>
      {available.length === 0 ? <Empty title="No exams right now" body="New exams from your teachers will appear here." icon={<Calendar className="h-6 w-6" />} /> : (
        <Stagger className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {available.map((e, i) => {
            const resume = e.attempt?.status === 'in_progress';
            const locked = e.attempt?.status === 'locked';
            return (
              <Card key={e._id} className="card-hover flex h-full flex-col overflow-hidden">
                <div className={clsx('relative bg-gradient-to-br p-5 text-white', STRIPS[i % STRIPS.length])}>
                  <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/15" />
                  <div className="relative flex items-start justify-between gap-2">
                    <div><p className="text-xs font-medium text-white/75">{e.subject || 'General'}</p><p className="font-display text-lg font-bold leading-tight">{e.title}</p></div>
                    <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold backdrop-blur">{resume ? 'In progress' : locked ? 'Locked' : e.open ? 'Open' : e.upcoming ? 'Upcoming' : 'Closed'}</span>
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-muted">
                    <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{e.durationMin} min</span>
                    <span className="flex items-center gap-1"><FileText className="h-3.5 w-3.5" />{e.questionCount} Qs · {e.totalMarks} marks</span>
                    {e.aiProctoring && <span className="flex items-center gap-1"><Camera className="h-3.5 w-3.5" />Camera</span>}
                  </div>
                  <p className="mt-2 text-xs text-muted">By {e.teacher}{e.startAt ? ` · ${fmtDate(e.startAt)} – ${fmtDate(e.endAt)}` : ''}</p>
                  <div className="mt-auto pt-4">
                    {locked ? <p className="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-sm font-medium text-amber-800"><Lock className="h-4 w-4" />Locked — ask your teacher</p>
                      : e.open || resume ? (
                        <Link href={`/exam/${e._id}`} className="brand-gradient group flex h-11 items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition hover:shadow-lg">
                          {resume ? <><RefreshCcw className="h-4 w-4" />Resume exam</> : <><PlayCircle className="h-4 w-4" />Start exam</>}<ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                        </Link>
                      ) : <p className="rounded-xl bg-canvas py-2.5 text-center text-sm font-medium text-muted">Not open yet</p>}
                  </div>
                </div>
              </Card>
            );
          })}
        </Stagger>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <p className="font-display text-lg font-bold">Progress tracking</p><p className="text-sm text-muted">Your score across exams</p>
          <div className="mt-4 h-64">
            {done.length ? (
              <ResponsiveContainer>
                <AreaChart data={done.map((r) => ({ name: r.title, pct: r.pct }))} margin={{ left: -12, right: 8, top: 8 }}>
                  <defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5b5cf0" stopOpacity={0.35} /><stop offset="1" stopColor="#5b5cf0" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid vertical={false} stroke="#eef0f6" strokeDasharray="4 4" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={11} tickFormatter={(v: string) => (v.length > 12 ? v.slice(0, 11) + '…' : v)} />
                  <YAxis domain={[0, 100]} unit="%" tickLine={false} axisLine={false} fontSize={12} />
                  <Tooltip content={<ChartTooltip unit="%" />} cursor={{ stroke: '#c7ccff', strokeWidth: 2 }} />
                  <Area type="monotone" dataKey="pct" name="Your score" stroke="#5b5cf0" strokeWidth={3} fill="url(#sg)" dot={{ r: 5, fill: '#fff', stroke: '#5b5cf0', strokeWidth: 2.5 }} activeDot={{ r: 7 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : <Empty title="No results yet" body="Your progress chart appears after your first exam." />}
          </div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between"><p className="font-display text-lg font-bold">Recent results</p><Link href="/student/results" className="flex items-center gap-1 text-sm font-semibold text-brand-600">All <ArrowRight className="h-3.5 w-3.5" /></Link></div>
          <div className="mt-4 space-y-1">
            {[...results].reverse().slice(0, 5).map((r) => (
              <Link key={r._id} href={`/student/results/${r._id}`} className="group flex items-center gap-3 rounded-xl p-2 transition hover:bg-canvas">
                {r.pct != null ? <Ring pct={r.pct} /> : <span className="grid h-12 w-12 place-items-center rounded-full bg-canvas text-[10px] text-muted">Soon</span>}
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold group-hover:text-brand-700">{r.title}</p><p className="text-xs text-muted">{fmtDate(r.submittedAt)}</p></div>
                <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-500" />
              </Link>
            ))}
            {!results.length && <p className="text-sm text-muted">No results yet.</p>}
          </div>
        </Card>
      </div>
    </>
  );
}
