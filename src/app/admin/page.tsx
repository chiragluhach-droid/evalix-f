'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowRight, BookOpen, ClipboardList, GraduationCap, ShieldAlert, Upload, UserPlus } from 'lucide-react';
import { api, getUser } from '@/lib/api';
import { Card, DashSkeleton, Empty, Stat } from '@/components/ui';
import { ChartTooltip, Stagger } from '@/components/fx';
import Welcome, { Chip } from '@/components/Welcome';

type Stats = { teachers: number; students: number; exams: number; published: number; attempts: number; pendingFlags: number; byDay: { _id: string; count: number }[] };

export default function AdminHome() {
  const [s, setS] = useState<Stats | null>(null);
  useEffect(() => { api('/admin/stats').then(setS); }, []);
  if (!s) return <DashSkeleton />;
  return (
    <>
      <Welcome name={getUser()?.name || 'Admin'} sub="Institution-wide overview — people, exams and integrity at a glance."
        chips={<><Chip>{s.published} exams live</Chip>{s.pendingFlags > 0 && <Chip tone="alert">{s.pendingFlags} AI flags pending</Chip>}</>}
        actions={<Link href="/admin/users" className="inline-flex h-11 items-center gap-2 rounded-xl bg-white px-5 text-sm font-semibold text-brand-700 shadow-lg transition hover:-translate-y-0.5"><UserPlus className="h-4 w-4" />Manage users</Link>} />
      <Stagger className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          <Stat key="a" label="Teachers" value={s.teachers} icon={<BookOpen className="h-5 w-5" />} />,
          <Stat key="b" label="Students" value={s.students} icon={<GraduationCap className="h-5 w-5" />} tint="blue" />,
          <Stat key="c" label="Exams" value={s.exams} sub={`${s.published} live now`} icon={<ClipboardList className="h-5 w-5" />} tint="green" />,
          <Stat key="d" label="Pending AI flags" value={s.pendingFlags} icon={<ShieldAlert className="h-5 w-5" />} tint="red" />,
        ]}
      </Stagger>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <p className="font-display text-lg font-bold">Exam submissions — last 14 days</p>
          <p className="text-sm text-muted">{s.attempts.toLocaleString()} submissions in total</p>
          <div className="mt-4 h-72">
            {s.byDay.length ? (
              <ResponsiveContainer>
                <BarChart data={s.byDay.map((d) => ({ day: d._id.slice(5), count: d.count }))} margin={{ left: -16 }}>
                  <defs><linearGradient id="ab" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#7c3aed" /><stop offset="1" stopColor="#2563eb" stopOpacity={0.75} /></linearGradient></defs>
                  <CartesianGrid vertical={false} stroke="#eef0f6" strokeDasharray="4 4" />
                  <XAxis dataKey="day" tickLine={false} axisLine={false} fontSize={12} />
                  <YAxis tickLine={false} axisLine={false} fontSize={12} allowDecimals={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: '#eef0ff', radius: 8 }} />
                  <Bar dataKey="count" name="Submissions" fill="url(#ab)" radius={[8, 8, 0, 0]} maxBarSize={44} />
                </BarChart>
              </ResponsiveContainer>
            ) : <Empty title="No submissions in the last 14 days" />}
          </div>
        </Card>
        <Card className="p-6">
          <p className="font-display text-lg font-bold">Quick actions</p>
          <div className="mt-4 space-y-2">
            {[[UserPlus, 'Add a teacher or student', 'Create an account with a temporary password'], [Upload, 'Bulk import from CSV', 'name, email, password, roll number'], [ShieldAlert, 'Review integrity', 'Open exams from the teacher view']].map(([I, t, d]) => {
              const Icon = I as React.ElementType;
              return (
                <Link key={t as string} href="/admin/users" className="group flex items-center gap-3 rounded-2xl border border-line p-3 transition hover:border-brand-200 hover:bg-brand-50/50">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:scale-110"><Icon className="h-5 w-5" /></span>
                  <span className="flex-1"><span className="block text-sm font-semibold">{t as string}</span><span className="block text-xs text-muted">{d as string}</span></span>
                  <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-brand-500" />
                </Link>
              );
            })}
          </div>
        </Card>
      </div>
    </>
  );
}
