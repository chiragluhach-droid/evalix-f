'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, Target, Trophy, Users, XCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, Empty, Spinner, Stat, clsx, pct } from '@/components/ui';

type R = {
  published: boolean; title: string; score: number; totalMarks: number; correctCount: number; answered: number; questionCount: number; classAverage: number | null; rank: number; participants: number;
  topics: { topic: string; accuracy: number; correct: number; total: number }[];
  questions: { index: number; text: string; code?: string; options: string[]; marks: number; topic: string; explanation?: string; correctIndex: number; yourAnswer: number | null; correct: boolean }[];
};

export default function ResultDetail() {
  const { id } = useParams<{ id: string }>();
  const [r, setR] = useState<R | null>(null);
  useEffect(() => { api(`/student/results/${id}`).then(setR); }, [id]);
  if (!r) return <Spinner />;
  if (!r.published) return <Empty title={`${r.title}: results not published yet`} body="Your teacher will release results soon." />;
  const strong = r.topics.filter((t) => t.accuracy >= 70);
  const weak = r.topics.filter((t) => t.accuracy < 50);

  return (
    <>
      <Link href="/student/results" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-ink"><ArrowLeft className="h-4 w-4" />Results</Link>
      <h1 className="mb-6 text-2xl font-semibold">{r.title}</h1>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Your score" value={`${r.score}/${r.totalMarks}`} sub={`${pct(r.score, r.totalMarks)}%`} icon={<Target className="h-5 w-5" />} />
        <Stat label="Correct" value={`${r.correctCount}/${r.questionCount}`} sub={`${r.answered} answered`} icon={<CheckCircle2 className="h-5 w-5" />} tint="green" />
        <Stat label="Class average" value={r.classAverage ?? '—'} sub="marks" icon={<Users className="h-5 w-5" />} tint="blue" />
        <Stat label="Rank" value={`#${r.rank}`} sub={`of ${r.participants}`} icon={<Trophy className="h-5 w-5" />} tint="amber" />
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <p className="font-semibold">Topic breakdown</p>
          <div className="mt-4 space-y-3">
            {r.topics.map((t) => (
              <div key={t.topic}><div className="flex justify-between text-sm"><span>{t.topic}</span><span className="text-muted">{t.correct}/{t.total} · {t.accuracy}%</span></div>
                <div className="mt-1 h-2 rounded-full bg-canvas"><div className={clsx('h-2 rounded-full', t.accuracy >= 70 ? 'bg-emerald-500' : t.accuracy >= 50 ? 'bg-amber-500' : 'bg-red-500')} style={{ width: `${Math.max(t.accuracy, 3)}%` }} /></div></div>
            ))}
          </div>
        </Card>
        <Card className="p-6">
          <p className="font-semibold">Strengths & weaknesses</p>
          <p className="mt-4 text-sm font-medium text-emerald-700">Strong</p>
          <p className="text-sm text-muted">{strong.map((t) => t.topic).join(', ') || '—'}</p>
          <p className="mt-4 text-sm font-medium text-red-600">Focus on</p>
          <p className="text-sm text-muted">{weak.map((t) => t.topic).join(', ') || 'Nothing major — nice work!'}</p>
        </Card>
      </div>
      <h2 className="mb-3 mt-8 font-semibold">Question-wise review</h2>
      <div className="space-y-4">
        {r.questions.map((q, i) => (
          <Card key={q.index} className="p-5">
            <div className="flex items-start justify-between gap-3">
              <p className="font-medium">Q{i + 1}. {q.text}</p>
              <span className="shrink-0 text-sm">{q.yourAnswer == null ? <span className="text-muted">Skipped</span> : q.correct ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <XCircle className="h-5 w-5 text-red-500" />}</span>
            </div>
            {q.code && <pre className="mt-3 overflow-x-auto rounded-xl bg-ink p-4 font-mono text-xs text-slate-100">{q.code}</pre>}
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {q.options.map((o, oi) => (
                <div key={oi} className={clsx('rounded-lg border px-3 py-2 text-sm', oi === q.correctIndex ? 'border-emerald-300 bg-emerald-50' : oi === q.yourAnswer ? 'border-red-300 bg-red-50' : 'border-line')}>
                  <span className="mr-2 font-medium">{String.fromCharCode(65 + oi)}.</span>{o}
                </div>
              ))}
            </div>
            {q.explanation && <p className="mt-3 text-sm text-muted"><b className="text-ink">Explanation:</b> {q.explanation}</p>}
            <p className="mt-2 text-xs text-slate-400">{q.topic} · {q.marks} mark{q.marks !== 1 ? 's' : ''}</p>
          </Card>
        ))}
      </div>
    </>
  );
}
