'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Camera, Clock, FileQuestion, Plus, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { Badge, Button, Card, Empty, PageHeader, Spinner, StatusBadge, fmtDay } from '@/components/ui';

type ExamRow = { _id: string; title: string; subject?: string; status: string; durationMin: number; questionCount: number; totalMarks: number; attempts: number; submitted: number; live: number; avgScore: number | null; createdAt: string; settings: { aiProctoring: boolean } };

export default function Exams() {
  const [exams, setExams] = useState<ExamRow[] | null>(null);
  useEffect(() => { api('/exams').then(setExams); }, []);
  return (
    <>
      <PageHeader title="Exams" sub="Create, publish and monitor your exams" actions={<Link href="/teacher/exams/new"><Button><Plus className="h-4 w-4" />New exam</Button></Link>} />
      {!exams ? <Spinner /> : exams.length === 0 ? <Empty title="No exams yet" body="Create your first exam to get started." action={<Link href="/teacher/exams/new"><Button>Create exam</Button></Link>} /> : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {exams.map((e) => (
            <Link key={e._id} href={`/teacher/exams/${e._id}`}>
              <Card className="card-hover h-full p-5">
                <div className="flex items-start justify-between gap-2">
                  <div><p className="font-semibold">{e.title}</p><p className="text-xs text-muted">{e.subject || 'General'} · {fmtDay(e.createdAt)}</p></div>
                  <StatusBadge status={e.status} />
                </div>
                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
                  <span className="flex items-center gap-1"><FileQuestion className="h-3.5 w-3.5" />{e.questionCount} questions · {e.totalMarks} marks</span>
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{e.durationMin} min</span>
                  <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{e.submitted}/{e.attempts} submitted</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {e.live > 0 && <Badge color="violet">● {e.live} live</Badge>}
                  {e.settings?.aiProctoring && <Badge color="blue"><Camera className="h-3 w-3" />AI camera</Badge>}
                  {e.avgScore != null && e.totalMarks > 0 && <Badge color="green">Avg {Math.round((e.avgScore / e.totalMarks) * 100)}%</Badge>}
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
