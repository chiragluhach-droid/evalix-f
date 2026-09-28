'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowDown, ArrowUp, CheckCircle2, Copy, Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Button, Card, Input, PageHeader, Select, Spinner, Switch, Textarea, clsx, useToast } from './ui';

export type Question = { text: string; code?: string; options: string[]; correctIndex: number; marks: number; topic: string; explanation?: string };
export type Settings = {
  fullscreenRequired: boolean; maxTabSwitches: number; autoSubmitOnLimit: boolean; blockCopyPaste: boolean; shuffleQuestions: boolean; negativeMarking: number;
  aiProctoring: boolean; captureIntervalSec: number; aiMinSeverity: 'low' | 'medium' | 'high'; resumePolicy: 'not_allowed' | 'allowed'; maxResumes: number; blockNewDeviceResume: boolean;
};
type ExamForm = { title: string; subject: string; description: string; durationMin: number; startAt: string; endAt: string; resultsPublished: boolean; questions: Question[]; settings: Settings };

const blankQ = (): Question => ({ text: '', options: ['', '', '', ''], correctIndex: 0, marks: 1, topic: 'General' });
const DEFAULTS: ExamForm = {
  title: '', subject: '', description: '', durationMin: 30, startAt: '', endAt: '', resultsPublished: true, questions: [blankQ()],
  settings: { fullscreenRequired: true, maxTabSwitches: 5, autoSubmitOnLimit: false, blockCopyPaste: true, shuffleQuestions: true, negativeMarking: 0,
    aiProctoring: true, captureIntervalSec: 30, aiMinSeverity: 'medium', resumePolicy: 'allowed', maxResumes: 3, blockNewDeviceResume: false },
};
const toLocal = (d?: string | null) => (d ? new Date(new Date(d).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '');

export default function ExamEditor({ examId }: { examId?: string }) {
  const router = useRouter();
  const toast = useToast();
  const [f, setF] = useState<ExamForm | null>(examId ? null : DEFAULTS);
  const [locked, setLocked] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!examId) return;
    api(`/exams/${examId}`).then((e) => setF({ ...DEFAULTS, ...e, subject: e.subject || '', description: e.description || '', startAt: toLocal(e.startAt), endAt: toLocal(e.endAt), settings: { ...DEFAULTS.settings, ...e.settings } }));
    api(`/exams/${examId}/attempts`).then((a) => setLocked(a.length > 0));
  }, [examId]);

  if (!f) return <Spinner />;
  const set = <K extends keyof ExamForm>(k: K, v: ExamForm[K]) => setF({ ...f, [k]: v });
  const setS = <K extends keyof Settings>(k: K, v: Settings[K]) => setF({ ...f, settings: { ...f.settings, [k]: v } });
  const setQ = (i: number, q: Partial<Question>) => set('questions', f.questions.map((x, j) => (j === i ? { ...x, ...q } : x)));
  const moveQ = (i: number, d: number) => { const qs = [...f.questions]; const [q] = qs.splice(i, 1); qs.splice(i + d, 0, q); set('questions', qs); };

  const validate = () => {
    if (!f.title.trim()) return 'Title is required';
    for (const [i, q] of f.questions.entries()) {
      if (!q.text.trim()) return `Question ${i + 1} has no text`;
      if (q.options.some((o) => !o.trim())) return `Question ${i + 1} has an empty option`;
    }
    return null;
  };

  const save = async (publish = false) => {
    const err = validate();
    if (err) return toast(err, 'error');
    setSaving(true);
    const body = { ...f, startAt: f.startAt ? new Date(f.startAt).toISOString() : null, endAt: f.endAt ? new Date(f.endAt).toISOString() : null };
    try {
      let id = examId;
      if (id) await api(`/exams/${id}`, { method: 'PUT', body });
      else id = (await api('/exams', { body }))._id;
      if (publish) await api(`/exams/${id}/status`, { body: { status: 'published' } });
      toast(publish ? 'Exam published' : 'Exam saved');
      router.push(`/teacher/exams/${id}`);
    } catch (e) { toast((e as Error).message, 'error'); } finally { setSaving(false); }
  };

  const total = f.questions.reduce((s, q) => s + Number(q.marks || 0), 0);

  return (
    <>
      <PageHeader title={examId ? 'Edit exam' : 'Create exam'} sub={`${f.questions.length} questions · ${total} marks`}
        actions={<><Button variant="secondary" onClick={() => save(false)} loading={saving}>Save draft</Button><Button onClick={() => save(true)} loading={saving}>Save & publish</Button></>} />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="space-y-4 p-6">
            <p className="font-semibold">Details</p>
            <Input label="Title" value={f.title} onChange={(e) => set('title', e.target.value)} placeholder="Mid Sem Exam – DS & Algo" />
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Subject" value={f.subject} onChange={(e) => set('subject', e.target.value)} />
              <Input label="Duration (minutes)" type="number" min={1} value={f.durationMin} onChange={(e) => set('durationMin', Number(e.target.value))} />
              <Input label="Opens at (optional)" type="datetime-local" value={f.startAt} onChange={(e) => set('startAt', e.target.value)} />
              <Input label="Closes at (optional)" type="datetime-local" value={f.endAt} onChange={(e) => set('endAt', e.target.value)} />
            </div>
            <Textarea label="Instructions / description" rows={2} value={f.description} onChange={(e) => set('description', e.target.value)} />
          </Card>

          {locked && <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">Students have already started this exam, so questions can no longer be changed. Settings can still be edited.</p>}
          {f.questions.map((q, i) => (
            <Card key={i} className={clsx('p-6', locked && 'pointer-events-none opacity-60')}>
              <div className="mb-3 flex items-center justify-between">
                <p className="font-semibold">Question {i + 1}</p>
                <div className="flex gap-1 text-muted">
                  <button className="cursor-pointer rounded-lg p-1.5 hover:bg-canvas disabled:opacity-30" disabled={i === 0} onClick={() => moveQ(i, -1)}><ArrowUp className="h-4 w-4" /></button>
                  <button className="cursor-pointer rounded-lg p-1.5 hover:bg-canvas disabled:opacity-30" disabled={i === f.questions.length - 1} onClick={() => moveQ(i, 1)}><ArrowDown className="h-4 w-4" /></button>
                  <button className="cursor-pointer rounded-lg p-1.5 hover:bg-canvas" onClick={() => set('questions', [...f.questions.slice(0, i + 1), structuredClone(q), ...f.questions.slice(i + 1)])}><Copy className="h-4 w-4" /></button>
                  <button className="cursor-pointer rounded-lg p-1.5 hover:bg-red-50 hover:text-red-600 disabled:opacity-30" disabled={f.questions.length === 1} onClick={() => set('questions', f.questions.filter((_x, j) => j !== i))}><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              <Textarea rows={2} value={q.text} onChange={(e) => setQ(i, { text: e.target.value })} placeholder="What is the output of the following code?" />
              <details className="mt-2" open={!!q.code}>
                <summary className="cursor-pointer text-xs font-medium text-brand-600">Code snippet (optional)</summary>
                <Textarea rows={4} value={q.code || ''} onChange={(e) => setQ(i, { code: e.target.value })} className="mt-2 font-mono text-xs" placeholder={'let a = 5;\nconsole.log(a * 2);'} />
              </details>
              <div className="mt-4 space-y-2">
                {q.options.map((o, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <button type="button" onClick={() => setQ(i, { correctIndex: oi })} title="Mark as correct"
                      className={clsx('grid h-8 w-8 shrink-0 cursor-pointer place-items-center rounded-lg border text-xs font-semibold', q.correctIndex === oi ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-line text-muted')}>
                      {q.correctIndex === oi ? <CheckCircle2 className="h-4 w-4" /> : String.fromCharCode(65 + oi)}
                    </button>
                    <Input value={o} onChange={(e) => setQ(i, { options: q.options.map((x, j) => (j === oi ? e.target.value : x)) })} placeholder={`Option ${String.fromCharCode(65 + oi)}`} />
                    {q.options.length > 2 && <button className="cursor-pointer p-1 text-muted hover:text-red-600" onClick={() => setQ(i, { options: q.options.filter((_x, j) => j !== oi), correctIndex: q.correctIndex >= oi && q.correctIndex > 0 ? q.correctIndex - 1 : q.correctIndex })}><Trash2 className="h-4 w-4" /></button>}
                  </div>
                ))}
                {q.options.length < 6 && <button className="cursor-pointer text-sm font-medium text-brand-600" onClick={() => setQ(i, { options: [...q.options, ''] })}>+ Add option</button>}
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <Input label="Marks" type="number" min={0} step={0.5} value={q.marks} onChange={(e) => setQ(i, { marks: Number(e.target.value) })} />
                <Input label="Topic" value={q.topic} onChange={(e) => setQ(i, { topic: e.target.value })} />
                <Input label="Explanation" value={q.explanation || ''} onChange={(e) => setQ(i, { explanation: e.target.value })} placeholder="Shown in results" />
              </div>
            </Card>
          ))}
          {!locked && <Button variant="secondary" className="w-full" onClick={() => set('questions', [...f.questions, blankQ()])}><Plus className="h-4 w-4" />Add question</Button>}
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <p className="font-semibold">AI camera monitoring</p>
            <Switch label="Enable AI camera monitoring" hint="Webcam frames are checked for phones, extra people, missing or different face" checked={f.settings.aiProctoring} onChange={(v) => setS('aiProctoring', v)} />
            {f.settings.aiProctoring && (
              <div className="mt-2 space-y-3">
                <Input label="Capture every (seconds)" type="number" min={10} value={f.settings.captureIntervalSec} onChange={(e) => setS('captureIntervalSec', Number(e.target.value))} hint="Random jitter is added. Extra frames are taken after tab switches and on resume." />
                <Select label="Flag and alert me from severity" value={f.settings.aiMinSeverity} onChange={(e) => setS('aiMinSeverity', e.target.value as Settings['aiMinSeverity'])}>
                  <option value="low">Low (most sensitive)</option><option value="medium">Medium (recommended)</option><option value="high">High only</option>
                </Select>
              </div>
            )}
          </Card>
          <Card className="p-6">
            <p className="font-semibold">Resume & sessions</p>
            <Select label="If a student leaves the exam" value={f.settings.resumePolicy} onChange={(e) => setS('resumePolicy', e.target.value as Settings['resumePolicy'])}>
              <option value="allowed">Allow resume (timer keeps running)</option><option value="not_allowed">No exit & no resume (lock attempt)</option>
            </Select>
            {f.settings.resumePolicy === 'allowed' && (
              <div className="mt-3 space-y-1">
                <Input label="Max resumes" type="number" min={0} value={f.settings.maxResumes} onChange={(e) => setS('maxResumes', Number(e.target.value))} />
                <Switch label="Block resume on a different device" hint="Device changes are always recorded and alerted" checked={f.settings.blockNewDeviceResume} onChange={(v) => setS('blockNewDeviceResume', v)} />
              </div>
            )}
          </Card>
          <Card className="p-6">
            <p className="font-semibold">Browser lockdown</p>
            <Switch label="Require fullscreen" checked={f.settings.fullscreenRequired} onChange={(v) => setS('fullscreenRequired', v)} />
            <Switch label="Block copy / paste & right-click" checked={f.settings.blockCopyPaste} onChange={(v) => setS('blockCopyPaste', v)} />
            <Input label="Tab-switch warning limit" type="number" min={0} value={f.settings.maxTabSwitches} onChange={(e) => setS('maxTabSwitches', Number(e.target.value))} hint="0 = no limit" />
            <Switch label="Auto-submit when limit exceeded" checked={f.settings.autoSubmitOnLimit} onChange={(v) => setS('autoSubmitOnLimit', v)} />
          </Card>
          <Card className="p-6">
            <p className="font-semibold">Marking</p>
            <Switch label="Shuffle question order" checked={f.settings.shuffleQuestions} onChange={(v) => setS('shuffleQuestions', v)} />
            <Input label="Negative marks per wrong answer" type="number" min={0} step={0.25} value={f.settings.negativeMarking} onChange={(e) => setS('negativeMarking', Number(e.target.value))} />
            <Switch label="Show results to students after submit" checked={f.resultsPublished} onChange={(v) => set('resultsPublished', v)} />
          </Card>
        </div>
      </div>
    </>
  );
}
