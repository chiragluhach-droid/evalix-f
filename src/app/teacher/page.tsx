'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowRight, Camera, CheckCircle2, ClipboardList, Copy, FileText, MonitorSmartphone, Plus, Radio, ShieldAlert, TrendingUp, Trophy, Users, WifiOff } from 'lucide-react';
import { api, getUser } from '@/lib/api';
import { Card, DashSkeleton, Empty, Stat, StatusBadge, clsx, fmtDay } from '@/components/ui';
import { ChartTooltip, Stagger } from '@/components/fx';
import Welcome, { Chip } from '@/components/Welcome';

type Dash = {
  totalExams: number; students: number; completed: number; avgScore: number; liveNow: number; pendingFlags: number;
  performance: { name: string; avg: number }[]; top: { name: string; pct: number }[]; distribution: { range: string; count: number }[];
  activity: { day: string; count: number }[];
  suspicious: { tabSwitches: number; fullscreenExits: number; copyPaste: number; aiFlags: number; disconnects: number; deviceChanges: number };
  recentExams: { _id: string; title: string; status: string; createdAt: string; students: number }[];
};
const COLORS = ['#10b981', '#5b5cf0', '#f59e0b', '#ef4444'];
const MEDAL = ['from-amber-300 to-amber-500', 'from-slate-300 to-slate-400', 'from-orange-300 to-orange-500'];

export default function TeacherHome() {
  const [d, setD] = useState<Dash | null>(null);
  useEffect(() => { api('/teacher/dashboard').then(setD); }, []);
  if (!d) return <DashSkeleton />;
  const name = getUser()?.name || 'Teacher';
  const distTotal = d.distribution.reduce((s, x) => s + x.count, 0) || 1;
  const sus = d.suspicious;
  const susMax = Math.max(1, sus.tabSwitches, sus.fullscreenExits, sus.copyPaste, sus.aiFlags, sus.disconnects, sus.deviceChanges);

  return (
    <>
      <Welcome name={name} sub="Here’s what’s happening across your exams — results, live sessions and anything that needs your review."
        chips={<>
          {d.liveNow > 0 && <Chip><span className="pulse-ring h-2 w-2 rounded-full bg-emerald-400" />{d.liveNow} writing now</Chip>}
          {d.pendingFlags > 0 && <Chip tone="alert"><Camera className="h-3.5 w-3.5" />{d.pendingFlags} AI flags to review</Chip>}
          <Chip><Users className="h-3.5 w-3.5" />{d.students} students</Chip>
        </>}
        actions={<>
          <Link href="/teacher/exams/new" className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-brand-700 shadow-lg transition hover:-translate-y-0.5"><Plus className="h-4 w-4" />New exam</Link>
          {d.pendingFlags > 0 && <Link href="/teacher/flags" className="glass-dark inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm font-semibold text-white transition hover:bg-white/20"><ShieldAlert className="h-4 w-4" />Review flags</Link>}
        </>} />

      <Stagger className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          <Stat key="a" label="Total exams" value={d.totalExams} icon={<FileText className="h-5 w-5" />} />,
          <Stat key="b" label="Students" value={d.students} icon={<Users className="h-5 w-5" />} tint="blue" />,
          <Stat key="c" label="Exams completed" value={d.completed} icon={<CheckCircle2 className="h-5 w-5" />} tint="green" />,
          <Stat key="d" label="Average score" value={d.avgScore} decimals={1} suffix="%" icon={<TrendingUp className="h-5 w-5" />} tint="amber" />,
        ]}
      </Stagger>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <div className="flex items-start justify-between">
            <div><p className="font-display text-lg font-bold">Performance overview</p><p className="text-sm text-muted">Class average per exam</p></div>
            {d.performance.length > 1 && (() => { const diff = d.performance.at(-1)!.avg - d.performance.at(-2)!.avg; return <span className={clsx('rounded-full px-2.5 py-1 text-xs font-bold', diff >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600')}>{diff >= 0 ? '▲' : '▼'} {Math.abs(diff)}% vs previous</span>; })()}
          </div>
          <div className="mt-4 h-72">
            {d.performance.length ? (
              <ResponsiveContainer>
                <AreaChart data={d.performance} margin={{ left: -12, right: 8, top: 8 }}>
                  <defs><linearGradient id="pg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#5b5cf0" stopOpacity={0.35} /><stop offset="1" stopColor="#5b5cf0" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid vertical={false} stroke="#eef0f6" strokeDasharray="4 4" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} tickFormatter={(v: string) => (v.length > 14 ? v.slice(0, 13) + '…' : v)} />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} domain={[0, 100]} unit="%" />
                  <Tooltip content={<ChartTooltip unit="%" />} cursor={{ stroke: '#c7ccff', strokeWidth: 2 }} />
                  <Area type="monotone" dataKey="avg" name="Class average" stroke="#5b5cf0" strokeWidth={3} fill="url(#pg)" dot={{ r: 5, fill: '#fff', stroke: '#5b5cf0', strokeWidth: 2.5 }} activeDot={{ r: 7 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : <Empty title="No results yet" body="Once students submit, trends appear here." />}
          </div>
        </Card>
        <Card className="flex flex-col p-6">
          <div className="flex items-center justify-between"><p className="font-display text-lg font-bold">Recent exams</p><Link href="/teacher/exams" className="flex items-center gap-1 text-sm font-semibold text-brand-600 hover:gap-2 transition-all">View all <ArrowRight className="h-3.5 w-3.5" /></Link></div>
          <div className="mt-4 flex-1 space-y-1">
            {d.recentExams.map((e) => (
              <Link key={e._id} href={`/teacher/exams/${e._id}`} className="group flex items-center gap-3 rounded-xl p-2.5 transition hover:bg-canvas">
                <span className={clsx('grid h-10 w-10 shrink-0 place-items-center rounded-xl', e.status === 'published' ? 'bg-emerald-50 text-emerald-600' : 'bg-brand-50 text-brand-600')}>{e.status === 'published' ? <Radio className="h-4.5 w-4.5" /> : <ClipboardList className="h-4.5 w-4.5" />}</span>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold group-hover:text-brand-700">{e.title}</p><p className="text-xs text-muted">{fmtDay(e.createdAt)} · {e.students} students</p></div>
                <StatusBadge status={e.status} />
              </Link>
            ))}
            {!d.recentExams.length && <p className="text-sm text-muted">No exams yet.</p>}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="p-6">
          <p className="flex items-center gap-2 font-display text-lg font-bold"><Trophy className="h-5 w-5 text-amber-500" />Top performers</p>
          <ol className="mt-4 space-y-2">
            {d.top.map((t, i) => (
              <li key={t.name + i} className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-canvas">
                <span className={clsx('grid h-8 w-8 place-items-center rounded-full text-xs font-bold', i < 3 ? `bg-gradient-to-br ${MEDAL[i]} text-white shadow` : 'bg-canvas text-muted')}>{i + 1}</span>
                <span className="flex-1 truncate text-sm font-medium">{t.name}</span>
                <span className="w-24"><span className="block h-1.5 rounded-full bg-canvas"><span className="brand-gradient block h-1.5 rounded-full" style={{ width: `${t.pct}%` }} /></span></span>
                <span className="w-10 text-right text-sm font-bold">{t.pct}%</span>
              </li>
            ))}
          </ol>
        </Card>
        <Card className="p-6">
          <p className="font-display text-lg font-bold">Score distribution</p>
          <div className="relative h-44">
            <ResponsiveContainer>
              <PieChart><Pie data={d.distribution} dataKey="count" nameKey="range" innerRadius={52} outerRadius={78} paddingAngle={3} cornerRadius={6} stroke="none">
                {d.distribution.map((_x, i) => <Cell key={i} fill={COLORS[i]} />)}</Pie><Tooltip content={<ChartTooltip />} /></PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 grid place-items-center text-center"><div><p className="font-display text-2xl font-extrabold">{distTotal}</p><p className="text-[11px] text-muted">submissions</p></div></div>
          </div>
          <ul className="mt-2 grid grid-cols-2 gap-2 text-xs">
            {d.distribution.map((x, i) => (
              <li key={x.range} className="flex items-center justify-between rounded-lg bg-canvas px-2.5 py-1.5"><span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[i] }} />{x.range}</span><b>{Math.round((x.count / distTotal) * 100)}%</b></li>
            ))}
          </ul>
        </Card>
        <Card className="p-6">
          <div className="flex items-center justify-between"><p className="font-display text-lg font-bold">Integrity & monitoring</p><ShieldAlert className="h-5 w-5 text-red-400" /></div>
          <ul className="mt-4 space-y-3 text-sm">
            {([[ClipboardList, 'Tab switches', sus.tabSwitches, 'bg-amber-400'], [MonitorSmartphone, 'Fullscreen exits', sus.fullscreenExits, 'bg-amber-400'], [Copy, 'Copy / paste', sus.copyPaste, 'bg-orange-400'],
              [Camera, 'AI camera flags', sus.aiFlags, 'bg-red-500'], [WifiOff, 'Disconnects', sus.disconnects, 'bg-sky-400'], [MonitorSmartphone, 'Device changes', sus.deviceChanges, 'bg-red-400']] as const).map(([Icon, l, v, c]) => (
              <li key={l}>
                <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-muted"><Icon className="h-4 w-4" />{l}</span><span className="font-bold">{v}</span></div>
                <div className="mt-1 h-1.5 rounded-full bg-canvas"><div className={clsx('h-1.5 rounded-full transition-all duration-700', c)} style={{ width: `${(v / susMax) * 100}%` }} /></div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card className="mt-6 p-6">
        <div className="flex items-center justify-between"><div><p className="font-display text-lg font-bold">Violations over the last 7 days</p><p className="text-sm text-muted">Tab switches, fullscreen exits, copy/paste and AI flags</p></div></div>
        <div className="mt-4 h-52">
          {d.activity.length ? (
            <ResponsiveContainer>
              <BarChart data={d.activity} margin={{ left: -16 }}>
                <defs><linearGradient id="vb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7c3aed" /><stop offset="1" stopColor="#4f46e5" stopOpacity={0.7} /></linearGradient></defs>
                <CartesianGrid vertical={false} stroke="#eef0f6" strokeDasharray="4 4" />
                <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} /><YAxis tickLine={false} axisLine={false} fontSize={12} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: '#eef0ff', radius: 8 }} />
                <Bar dataKey="count" name="Violations" fill="url(#vb)" radius={[8, 8, 0, 0]} maxBarSize={48} />
              </BarChart>
            </ResponsiveContainer>
          ) : <Empty title="No violations this week" icon={<CheckCircle2 className="h-6 w-6" />} />}
        </div>
      </Card>
    </>
  );
}
