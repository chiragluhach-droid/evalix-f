'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, Camera, CheckCircle2, Clock, Lock, Unlock, Send } from 'lucide-react';
import { api, imgUrl } from '@/lib/api';
import { Badge, Button, Card, Empty, Spinner, Stat, StatusBadge, Tabs, clsx, fmtDate, pct, useToast } from '@/components/ui';
import FlagCard, { Flag } from '@/components/FlagCard';

type Session = { sessionId: string; browser: string; os: string; ip: string; screen?: string; startedAt: string; endedAt?: string; endReason?: string; isResume: boolean; deviceChanged: boolean; browserChanged: boolean; ipChanged: boolean; awaySeconds?: number };
type Ev = { _id: string; type: string; at: string; meta?: Record<string, unknown>; questionIndex?: number; sessionId?: string };
type Frame = { _id: string; status: string; trigger: string; at: string; analysis?: { reason?: string; severity?: string }; error?: string };
type Report = {
  attempt: { _id: string; status: string; score?: number; totalMarks: number; startedAt: string; endsAt: string; submittedAt?: string; submitReason?: string; lockedReason?: string; resumeCount: number; deviceChangedEver: boolean; referencePhoto?: string; answers: Record<string, number>; counters: Record<string, number>; sessions: Session[]; student: { name: string; email: string; rollNo?: string } };
  exam: { _id: string; title: string; questions: { text: string; correctIndex: number; options: string[]; marks: number }[]; settings: { aiProctoring: boolean } };
  events: Ev[]; flags: Flag[]; frames: Frame[]; frameStats: Record<string, number>; integrity: string; aiEnabled: boolean;
};

const EVENT_STYLE: Record<string, string> = {
  tab_hidden: 'amber', window_blur: 'amber', fullscreen_exit: 'amber', copy_attempt: 'amber', paste_attempt: 'amber', cut_attempt: 'amber', right_click: 'gray', devtools_attempt: 'amber', print_attempt: 'amber',
  multi_monitor: 'red', ai_flag: 'red', device_changed: 'red', concurrent_login: 'red', resume_blocked: 'red', locked: 'red', camera_denied: 'red', camera_lost: 'red',
  resumed: 'blue', reconnected: 'blue', disconnected: 'amber', offline: 'amber', submitted: 'green', exam_started: 'green', teacher_action: 'violet',
};
const HIDDEN_BY_DEFAULT = new Set(['answer_saved', 'answer_changed', 'question_visited', 'tab_visible', 'window_focus', 'fullscreen_enter', 'online', 'camera_restored']);
const label = (t: string) => t.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());
const YesNo = ({ v }: { v: boolean }) => (v ? <Badge color="red">Yes</Badge> : <span className="text-muted">No</span>);

function describe(e: Ev) {
  const m = e.meta || {};
  switch (e.type) {
    case 'tab_visible': case 'window_focus': return m.awaySeconds != null ? `away ${m.awaySeconds}s` : '';
    case 'resumed': return `#${m.resumeNo} after ${m.awaySeconds}s · ${m.browser || ''} ${m.os || ''} · device changed: ${m.deviceChanged ? 'YES' : 'no'}, browser: ${m.browserChanged ? 'yes' : 'no'}, IP: ${m.ipChanged ? 'yes' : 'no'}`;
    case 'ai_flag': return `${(m.types as string[] | undefined)?.join(', ')} — ${m.reason || ''}`;
    case 'submitted': return `${m.reason}${m.score != null ? ` · score ${m.score}` : ''}`;
    case 'exam_started': return [m.browser, m.os, m.ip].filter(Boolean).join(' · ');
    case 'teacher_action': return `${m.action}${m.minutes ? ` (+${m.minutes} min)` : ''} by ${m.by}`;
    case 'locked': case 'resume_blocked': return String(m.reason || '');
    case 'disconnected': return 'no heartbeat — tab closed or network lost';
    default: return e.questionIndex != null ? `question ${e.questionIndex + 1}` : '';
  }
}

export default function AttemptReport() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const [r, setR] = useState<Report | null>(null);
  const [tab, setTab] = useState<'timeline' | 'sessions' | 'camera' | 'answers'>('timeline');
  const [showAll, setShowAll] = useState(false);
  const load = useCallback(() => api(`/attempts/${id}/report`).then(setR), [id]);
  useEffect(() => { load(); }, [load]);
  if (!r) return <Spinner />;
  const a = r.attempt;
  const act = async (action: string, minutes?: number) => {
    try { await api(`/attempts/${id}/action`, { body: { action, minutes } }); toast('Done'); load(); } catch (e) { toast((e as Error).message, 'error'); }
  };
  const events = r.events.filter((e) => showAll || !HIDDEN_BY_DEFAULT.has(e.type));
  const integrityColor = r.integrity === 'Clean' ? 'green' : r.integrity === 'Review' ? 'amber' : 'red';

  return (
    <>
      <Link href={`/teacher/exams/${r.exam._id}`} className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-ink"><ArrowLeft className="h-4 w-4" />{r.exam.title}</Link>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          {a.referencePhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imgUrl(`/attempts/${id}/reference`)} alt="Reference" className="h-16 w-16 rounded-2xl object-cover ring-2 ring-brand-100" />
          ) : <span className="grid h-16 w-16 place-items-center rounded-2xl bg-ink text-xl font-semibold text-white">{a.student.name[0]}</span>}
          <div>
            <h1 className="text-2xl font-semibold">{a.student.name}</h1>
            <p className="text-sm text-muted">{a.student.rollNo} · {a.student.email}</p>
            <div className="mt-1.5 flex flex-wrap gap-2"><StatusBadge status={a.status} /><Badge color={integrityColor}>Integrity: {r.integrity}</Badge></div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {a.status === 'locked' && <Button size="sm" onClick={() => act('unlock')}><Unlock className="h-4 w-4" />Unlock attempt</Button>}
          {a.status !== 'submitted' && <><Button size="sm" variant="secondary" onClick={() => act('extra_time', 5)}><Clock className="h-4 w-4" />+5 min</Button><Button size="sm" variant="danger" onClick={() => confirm('Force submit this attempt now?') && act('force_submit')}><Send className="h-4 w-4" />Force submit</Button></>}
        </div>
      </div>
      {a.lockedReason && a.status === 'locked' && <p className="mb-4 flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800"><Lock className="h-4 w-4" />Locked: {a.lockedReason}</p>}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-6">
        <Stat label="Score" value={a.score != null ? `${a.score}/${a.totalMarks}` : '—'} sub={a.score != null ? `${pct(a.score, a.totalMarks)}%` : a.status} />
        <Stat label="Tab switches" value={a.counters.tabSwitches} tint="amber" />
        <Stat label="Fullscreen exits" value={a.counters.fullscreenExits} tint="amber" />
        <Stat label="Copy / paste" value={a.counters.copyPaste} tint="amber" />
        <Stat label="Resumes" value={a.resumeCount} sub={`Device changed: ${a.deviceChangedEver ? 'YES' : 'No'}`} tint={a.deviceChangedEver ? 'red' : 'blue'} />
        <Stat label="AI flags" value={r.flags.length} sub={`${r.flags.filter((f) => f.status === 'confirmed').length} confirmed`} tint="red" />
      </div>

      {r.flags.length > 0 && (
        <div className="mt-6">
          <p className="mb-3 font-semibold">AI flags — evidence</p>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{r.flags.map((f) => <FlagCard key={f._id} flag={f} showStudent={false} onChange={() => load()} />)}</div>
        </div>
      )}

      <div className="mt-6">
        <Tabs value={tab} onChange={setTab} tabs={[{ id: 'timeline', label: `Activity timeline (${r.events.length})` }, { id: 'sessions', label: `Sessions & devices (${a.sessions.length})` }, { id: 'camera', label: 'Camera frames' }, { id: 'answers', label: 'Answers' }]} />

        {tab === 'timeline' && (
          <Card className="p-6">
            <label className="mb-4 flex items-center gap-2 text-sm text-muted"><input type="checkbox" checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />Show everything (answers, navigation, focus returns)</label>
            <ol className="relative space-y-4 border-l border-line pl-6">
              {events.map((e) => (
                <li key={e._id} className="relative">
                  <span className={clsx('absolute -left-[31px] top-1 h-3 w-3 rounded-full ring-4 ring-white', { amber: 'bg-amber-500', red: 'bg-red-500', blue: 'bg-blue-500', green: 'bg-emerald-500', violet: 'bg-brand-500' }[EVENT_STYLE[e.type]] || 'bg-slate-300')} />
                  <div className="flex flex-wrap items-baseline gap-x-3">
                    <span className="text-sm font-medium">{label(e.type)}</span>
                    <span className="text-xs text-slate-400">{new Date(e.at).toLocaleTimeString()} · {new Date(e.at).toLocaleDateString()}</span>
                  </div>
                  {describe(e) && <p className="text-sm text-muted">{describe(e)}</p>}
                </li>
              ))}
            </ol>
          </Card>
        )}

        {tab === 'sessions' && (
          <Card className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-line text-left text-muted"><tr>{['#', 'Type', 'Started', 'Ended', 'Browser / OS', 'IP', 'Device changed', 'Browser changed', 'IP changed', 'Away'].map((h) => <th key={h} className="p-4 font-medium">{h}</th>)}</tr></thead>
              <tbody>
                {a.sessions.map((s, i) => (
                  <tr key={s.sessionId} className="border-b border-line last:border-0">
                    <td className="p-4">{i + 1}</td>
                    <td className="p-4">{s.isResume ? <Badge color="blue">Resume</Badge> : <Badge color="green">Start</Badge>}</td>
                    <td className="p-4 text-muted">{fmtDate(s.startedAt)}</td>
                    <td className="p-4 text-muted">{s.endedAt ? `${fmtDate(s.endedAt)} (${s.endReason?.replace('_', ' ')})` : 'active'}</td>
                    <td className="p-4">{s.browser}<p className="text-xs text-muted">{s.os}{s.screen ? ` · ${s.screen}` : ''}</p></td>
                    <td className="p-4 font-mono text-xs">{s.ip}</td>
                    <td className="p-4">{i === 0 ? '—' : <YesNo v={s.deviceChanged} />}</td>
                    <td className="p-4">{i === 0 ? '—' : <YesNo v={s.browserChanged} />}</td>
                    <td className="p-4">{i === 0 ? '—' : <YesNo v={s.ipChanged} />}</td>
                    <td className="p-4">{s.awaySeconds != null ? `${s.awaySeconds}s` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        )}

        {tab === 'camera' && (!r.exam.settings.aiProctoring ? <Empty title="Camera monitoring was off for this exam" /> : r.frames.length === 0 ? <Empty title="No camera frames" /> : (
          <>
            <div className="mb-4 flex flex-wrap gap-2 text-sm">
              {Object.entries(r.frameStats).map(([k, v]) => <Badge key={k} color={k === 'flagged' ? 'red' : k === 'clean' ? 'green' : 'gray'}>{v} {k}</Badge>)}
              {!r.aiEnabled && <Badge color="amber">AI not configured — frames stored but not analysed</Badge>}
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {r.frames.map((f) => (
                <div key={f._id} className={clsx('card overflow-hidden', f.status === 'flagged' && 'ring-2 ring-red-300')}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imgUrl(`/frames/${f._id}/image`)} alt="" loading="lazy" className="aspect-[4/3] w-full bg-slate-900 object-cover" />
                  <div className="p-2 text-xs">
                    <div className="flex items-center justify-between"><span className="text-muted">{new Date(f.at).toLocaleTimeString()}</span><Badge color={f.status === 'flagged' ? 'red' : f.status === 'clean' ? 'green' : 'gray'}>{f.status}</Badge></div>
                    <p className="mt-1 text-muted">{f.trigger.replace(/_/g, ' ')}</p>
                    {f.analysis?.reason && <p className="mt-1 line-clamp-2">{f.analysis.reason}</p>}
                  </div>
                </div>
              ))}
            </div>
          </>
        ))}

        {tab === 'answers' && (
          <Card className="divide-y divide-line">
            {r.exam.questions.map((q, i) => {
              const ans = a.answers[String(i)];
              const ok = ans === q.correctIndex;
              return (
                <div key={i} className="flex items-start gap-3 p-4">
                  {ans === undefined ? <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full border-2 border-line" /> : ok ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" /> : <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-red-500 text-xs text-white">✕</span>}
                  <div className="text-sm"><p className="font-medium">Q{i + 1}. {q.text}</p>
                    <p className="text-muted">Answer: {ans !== undefined ? q.options[ans] : 'Not answered'} {!ok && <>· Correct: <span className="text-emerald-700">{q.options[q.correctIndex]}</span></>}</p></div>
                </div>
              );
            })}
          </Card>
        )}
      </div>
      {r.exam.settings.aiProctoring && <p className="mt-6 flex items-center gap-2 text-xs text-muted"><Camera className="h-3.5 w-3.5" />Camera images are visible only to the exam creator and admins.</p>}
    </>
  );
}
