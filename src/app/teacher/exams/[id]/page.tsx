'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AlertTriangle, Camera, Download, Edit, MonitorSmartphone, Radio, RefreshCcw, Trash2 } from 'lucide-react';
import { api, download } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { Badge, Button, Card, Empty, PageHeader, Spinner, Stat, StatusBadge, Tabs, clsx, fmtDate, pct, useToast } from '@/components/ui';
import FlagCard, { Flag } from '@/components/FlagCard';
import { ChartTooltip } from '@/components/fx';

type Exam = { _id: string; title: string; subject?: string; status: string; durationMin: number; totalMarks: number; questions: unknown[]; resultsPublished: boolean; settings: { aiProctoring: boolean; resumePolicy: string } };
type Row = {
  _id: string; student: { name: string; rollNo?: string; email: string }; status: string; score?: number; totalMarks: number; startedAt: string; submittedAt?: string; submitReason?: string; endsAt: string;
  answered: number; counters: { tabSwitches: number; fullscreenExits: number; copyPaste: number; disconnects: number; aiFlags: number }; resumeCount: number; deviceChangedEver: boolean;
  lockedReason?: string; lastFrameAt?: string; online: boolean; flags: { total: number; pending: number; confirmed: number };
};
type Alert = { kind: string; attemptId: string; student?: string; types?: string[]; reason?: string; severity?: string; at: string };
type Analytics = { submitted: number; average: number; passRate: number; highest: number; distribution: { range: string; count: number }[]; perQuestion: { index: number; topic: string; text: string; accuracy: number }[]; topics: { topic: string; accuracy: number }[]; top: { name: string; pct: number }[] };

const ALERT_LABEL: Record<string, string> = { ai_flag: 'AI flag', device_changed: 'Device changed', resumed: 'Resumed', violation: 'Violation' };
const niceType = (t: string) => t.replace(/_/g, ' ').replace('attempt', '');

export default function ExamDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const [exam, setExam] = useState<Exam | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [tab, setTab] = useState<'live' | 'results' | 'flags'>('live');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [flags, setFlags] = useState<Flag[] | null>(null);
  const [aiOn, setAiOn] = useState<boolean | null>(null);
  const reloadTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const loadRows = useCallback(() => api(`/exams/${id}/attempts`).then(setRows), [id]);
  useEffect(() => {
    api(`/exams/${id}`).then((e: Exam) => { setExam(e); if (e.status === 'closed') setTab('results'); });
    loadRows();
    api('/system').then((s) => setAiOn(s.aiEnabled));
  }, [id, loadRows]);

  useEffect(() => {
    if (tab === 'results') api(`/exams/${id}/analytics`).then(setAnalytics);
    if (tab === 'flags') api(`/flags?exam=${id}`).then(setFlags);
  }, [tab, id]);

  // Live updates
  useEffect(() => {
    const s = getSocket();
    const watch = () => s.emit('teacher:watch', id);
    watch();
    s.on('connect', watch);
    const scheduleReload = () => { clearTimeout(reloadTimer.current); reloadTimer.current = setTimeout(loadRows, 800); };
    const onUpdate = (u: Partial<Row> & { attemptId: string; heartbeat?: boolean; joined?: boolean }) => {
      setRows((rs) => {
        if (!rs.some((r) => r._id === u.attemptId)) { scheduleReload(); return rs; }
        return rs.map((r) => (r._id === u.attemptId ? { ...r, ...(u.heartbeat ? { online: true } : u), _id: r._id } : r));
      });
      if (!u.heartbeat) scheduleReload();
    };
    const onAlert = (a: Alert) => { setAlerts((x) => [a, ...x].slice(0, 50)); if (a.kind === 'ai_flag') scheduleReload(); };
    s.on('student:update', onUpdate);
    s.on('alert', onAlert);
    const poll = setInterval(loadRows, 30000);
    return () => { s.off('connect', watch); s.off('student:update', onUpdate); s.off('alert', onAlert); clearInterval(poll); };
  }, [id, loadRows]);

  if (!exam) return <Spinner />;
  const nameOf = (attemptId: string) => rows.find((r) => r._id === attemptId)?.student.name;
  const live = rows.filter((r) => r.status === 'in_progress');
  const setStatus = async (status: string) => {
    try { setExam(await api(`/exams/${id}/status`, { body: { status } })); toast(status === 'published' ? 'Exam is live' : status === 'closed' ? 'Exam closed' : 'Moved to draft'); }
    catch (e) { toast((e as Error).message, 'error'); }
  };
  const remove = async () => {
    if (!confirm('Delete this exam and all attempts, logs and flags?')) return;
    await api(`/exams/${id}`, { method: 'DELETE' }); router.push('/teacher/exams');
  };

  return (
    <>
      <PageHeader title={exam.title} sub={`${exam.subject || 'General'} · ${exam.questions.length} questions · ${exam.totalMarks} marks · ${exam.durationMin} min`}
        actions={<>
          <StatusBadge status={exam.status} />
          <Link href={`/teacher/exams/${id}/edit`}><Button variant="secondary" size="sm"><Edit className="h-4 w-4" />Edit</Button></Link>
          {exam.status === 'draft' && <Button size="sm" onClick={() => setStatus('published')}>Publish</Button>}
          {exam.status === 'published' && <Button size="sm" variant="secondary" onClick={() => setStatus('closed')}>Close exam</Button>}
          {exam.status === 'closed' && <Button size="sm" variant="secondary" onClick={() => setStatus('published')}>Reopen</Button>}
          <Button size="sm" variant="secondary" onClick={() => download(`/exams/${id}/export`, `${exam.title}.csv`)}><Download className="h-4 w-4" />Export CSV</Button>
          <Button size="sm" variant="ghost" onClick={remove}><Trash2 className="h-4 w-4" /></Button>
        </>} />
      {exam.settings.aiProctoring && aiOn === false && (
        <p className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800"><b>AI monitoring: Not configured.</b> Webcam snapshots are still captured and stored, but they are not analysed. Add <code>GEMINI_API_KEY</code> to <code>backend/.env</code> and restart the API.</p>
      )}
      <Tabs value={tab} onChange={setTab} tabs={[{ id: 'live', label: <span className="flex items-center gap-2"><Radio className="h-4 w-4" />Live monitor {live.length > 0 && <Badge color="violet">{live.length}</Badge>}</span> }, { id: 'results', label: 'Results & analytics' }, { id: 'flags', label: 'AI flags' }]} />

      {tab === 'live' && (
        <div className="grid gap-6 xl:grid-cols-3">
          <div className="xl:col-span-2">
            {rows.length === 0 ? <Empty title="No students have started yet" body={exam.status === 'published' ? 'This page updates in real time as students join.' : 'Publish the exam so students can start.'} /> : (
              <div className="grid gap-3 sm:grid-cols-2">
                {rows.map((r) => (
                  <Link key={r._id} href={`/teacher/attempts/${r._id}`}>
                    <Card className={clsx('p-4 transition hover:shadow-lg', r.flags.pending > 0 && 'ring-2 ring-red-200', r.status === 'locked' && 'ring-2 ring-amber-200')}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={clsx('h-2.5 w-2.5 rounded-full', r.status !== 'in_progress' ? 'bg-slate-300' : r.online ? 'bg-emerald-500' : 'bg-amber-500')} title={r.online ? 'Online' : 'Offline'} />
                          <div><p className="text-sm font-medium">{r.student.name}</p><p className="text-xs text-muted">{r.student.rollNo || r.student.email}</p></div>
                        </div>
                        <StatusBadge status={r.status} />
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
                        {r.status === 'submitted' ? <Badge color="green">{r.score}/{r.totalMarks}</Badge> : <Badge>{r.answered}/{exam.questions.length} answered</Badge>}
                        {r.counters.tabSwitches > 0 && <Badge color="amber">{r.counters.tabSwitches} tab switch</Badge>}
                        {r.counters.fullscreenExits > 0 && <Badge color="amber">{r.counters.fullscreenExits} fullscreen exit</Badge>}
                        {r.counters.copyPaste > 0 && <Badge color="amber">{r.counters.copyPaste} copy/paste</Badge>}
                        {r.resumeCount > 0 && <Badge color="blue"><RefreshCcw className="h-3 w-3" />{r.resumeCount} resume</Badge>}
                        {r.deviceChangedEver && <Badge color="red"><MonitorSmartphone className="h-3 w-3" />Device changed</Badge>}
                        {r.flags.total > 0 && <Badge color="red"><Camera className="h-3 w-3" />{r.flags.total} AI flag</Badge>}
                      </div>
                      {r.lockedReason && <p className="mt-2 text-xs text-amber-700">{r.lockedReason}</p>}
                      {r.status === 'in_progress' && r.lastFrameAt && <p className="mt-2 text-[11px] text-muted">Last camera frame {fmtDate(r.lastFrameAt)}</p>}
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
          <Card className="h-fit p-5">
            <p className="flex items-center gap-2 font-semibold"><AlertTriangle className="h-4 w-4 text-amber-500" />Live alerts</p>
            <p className="text-xs text-muted">Appear here the moment they happen</p>
            <div className="mt-4 max-h-[60vh] space-y-2 overflow-auto">
              {alerts.length === 0 && <p className="py-6 text-center text-sm text-muted">No alerts yet</p>}
              {alerts.map((a, i) => (
                <Link key={i} href={`/teacher/attempts/${a.attemptId}`} className={clsx('block rounded-xl p-3 text-sm', a.kind === 'ai_flag' || a.kind === 'device_changed' ? 'bg-red-50' : 'bg-canvas')}>
                  <p className="font-medium">{ALERT_LABEL[a.kind] || a.kind} · {a.student || nameOf(a.attemptId) || 'Student'}</p>
                  <p className="text-xs text-muted">{a.reason || a.types?.map(niceType).join(', ')}</p>
                  <p className="text-[11px] text-slate-400">{new Date(a.at).toLocaleTimeString()}</p>
                </Link>
              ))}
            </div>
          </Card>
        </div>
      )}

      {tab === 'results' && (!analytics ? <Spinner /> : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Stat label="Submitted" value={analytics.submitted} /><Stat label="Average" value={`${analytics.average}%`} tint="blue" />
            <Stat label="Pass rate (≥40%)" value={`${analytics.passRate}%`} tint="green" /><Stat label="Highest" value={`${analytics.highest}%`} tint="amber" />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-6">
              <p className="font-semibold">Question accuracy</p><p className="text-sm text-muted">Low bars = topics the class struggled with</p>
              <div className="mt-4 h-64"><ResponsiveContainer><BarChart data={analytics.perQuestion}><CartesianGrid vertical={false} stroke="#eef0f6" /><XAxis dataKey="index" tickFormatter={(v) => `Q${v}`} tickLine={false} axisLine={false} fontSize={12} /><YAxis domain={[0, 100]} unit="%" tickLine={false} axisLine={false} fontSize={12} /><Tooltip content={<ChartTooltip unit="%" labelPrefix="Q" />} cursor={{ fill: '#eef0ff', radius: 8 }} /><Bar dataKey="accuracy" name="Accuracy" fill="#5b5cf0" radius={[8, 8, 0, 0]} maxBarSize={40} /></BarChart></ResponsiveContainer></div>
            </Card>
            <Card className="p-6">
              <p className="font-semibold">Topic performance</p>
              <div className="mt-4 space-y-3">
                {analytics.topics.map((t) => (
                  <div key={t.topic}><div className="flex justify-between text-sm"><span>{t.topic}</span><span className="font-medium">{t.accuracy}%</span></div>
                    <div className="mt-1 h-2 rounded-full bg-canvas"><div className={clsx('h-2 rounded-full', t.accuracy >= 70 ? 'bg-emerald-500' : t.accuracy >= 45 ? 'bg-amber-500' : 'bg-red-500')} style={{ width: `${t.accuracy}%` }} /></div></div>
                ))}
              </div>
            </Card>
          </div>
          <Card className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-line text-left text-muted"><tr>{['Student', 'Status', 'Score', 'Submitted', 'Violations', 'Resumes', 'Device changed', 'AI flags'].map((h) => <th key={h} className="p-4 font-medium">{h}</th>)}</tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r._id} className="cursor-pointer border-b border-line last:border-0 hover:bg-canvas" onClick={() => router.push(`/teacher/attempts/${r._id}`)}>
                    <td className="p-4"><p className="font-medium">{r.student.name}</p><p className="text-xs text-muted">{r.student.rollNo}</p></td>
                    <td className="p-4"><StatusBadge status={r.status} />{r.submitReason && r.submitReason !== 'manual' && <p className="mt-1 text-xs text-muted">{r.submitReason}</p>}</td>
                    <td className="p-4 font-medium">{r.score != null ? `${r.score}/${r.totalMarks} (${pct(r.score, r.totalMarks)}%)` : '—'}</td>
                    <td className="p-4 text-muted">{fmtDate(r.submittedAt)}</td>
                    <td className="p-4">{r.counters.tabSwitches + r.counters.fullscreenExits + r.counters.copyPaste}</td>
                    <td className="p-4">{r.resumeCount}</td>
                    <td className="p-4">{r.deviceChangedEver ? <Badge color="red">Yes</Badge> : <span className="text-muted">No</span>}</td>
                    <td className="p-4">{r.flags.total ? <Badge color={r.flags.confirmed ? 'red' : 'amber'}>{r.flags.total}{r.flags.confirmed ? ' · confirmed' : ''}</Badge> : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      ))}

      {tab === 'flags' && (!flags ? <Spinner /> : flags.length === 0 ? <Empty title="No AI flags for this exam" body="Suspicious webcam frames will show up here with the evidence image." /> : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{flags.map((f) => <FlagCard key={f._id} flag={f} onChange={(nf) => setFlags(flags.map((x) => (x._id === nf._id ? nf : x)))} />)}</div>
      ))}
    </>
  );
}
