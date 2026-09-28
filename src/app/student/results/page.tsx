'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Badge, Card, Empty, PageHeader, Spinner, fmtDate } from '@/components/ui';

type Res = { _id: string; title: string; subject?: string; submittedAt: string; score: number | null; totalMarks: number; pct: number | null; published: boolean };

export default function Results() {
  const [rows, setRows] = useState<Res[] | null>(null);
  useEffect(() => { api('/student/results').then((r: Res[]) => setRows(r.reverse())); }, []);
  return (
    <>
      <PageHeader title="Results" sub="Detailed, question-wise results for every exam" />
      {!rows ? <Spinner /> : rows.length === 0 ? <Empty title="No results yet" /> : (
        <Card className="divide-y divide-line">
          {rows.map((r) => (
            <Link key={r._id} href={`/student/results/${r._id}`} className="flex items-center justify-between gap-4 p-4 hover:bg-canvas">
              <div><p className="font-medium">{r.title}</p><p className="text-xs text-muted">{r.subject} · submitted {fmtDate(r.submittedAt)}</p></div>
              {r.published ? <div className="text-right"><p className="font-semibold">{r.score}/{r.totalMarks}</p><Badge color={(r.pct || 0) >= 60 ? 'green' : (r.pct || 0) >= 40 ? 'amber' : 'red'}>{r.pct}%</Badge></div> : <Badge>Results pending</Badge>}
            </Link>
          ))}
        </Card>
      )}
    </>
  );
}
