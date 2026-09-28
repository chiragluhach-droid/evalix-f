'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Check, X } from 'lucide-react';
import { api, imgUrl } from '@/lib/api';
import { Badge, Button, StatusBadge, fmtDate, useToast } from './ui';

export type Flag = {
  _id: string; attempt: string; types: string[]; severity: string; confidence?: number; reason: string; status: 'pending' | 'confirmed' | 'dismissed';
  note?: string; createdAt: string; occurrences?: number; demo?: boolean; student?: { name: string; rollNo?: string }; exam?: { _id: string; title: string };
};

export default function FlagCard({ flag, onChange, showStudent = true }: { flag: Flag; onChange?: (f: Flag) => void; showStudent?: boolean }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [zoom, setZoom] = useState(false);
  const set = async (status: Flag['status']) => {
    setBusy(true);
    try { const f = await api(`/flags/${flag._id}`, { method: 'PUT', body: { status } }); onChange?.({ ...flag, status: f.status }); toast(status === 'confirmed' ? 'Marked as cheating' : status === 'dismissed' ? 'Flag dismissed' : 'Reopened'); }
    catch (e) { toast((e as Error).message, 'error'); } finally { setBusy(false); }
  };
  return (
    <div className="card overflow-hidden">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={imgUrl(`/flags/${flag._id}/image`)} alt="Evidence frame" onClick={() => setZoom(true)} className="aspect-[4/3] w-full cursor-zoom-in bg-slate-900 object-cover" />
      <div className="space-y-2 p-4">
        <div className="flex flex-wrap items-center gap-1.5">
          {flag.types.map((t) => <Badge key={t} color={flag.severity === 'high' ? 'red' : 'amber'}>{t}</Badge>)}
          {flag.demo && <Badge>Demo data</Badge>}
          {(flag.occurrences || 1) > 1 && <Badge color="gray">×{flag.occurrences}</Badge>}
        </div>
        {showStudent && flag.student && (
          <Link href={`/teacher/attempts/${flag.attempt}`} className="block text-sm font-medium hover:text-brand-600">{flag.student.name} <span className="text-muted">{flag.student.rollNo}</span></Link>
        )}
        {flag.exam && <p className="text-xs text-muted">{flag.exam.title}</p>}
        <p className="text-sm text-muted">{flag.reason}</p>
        <p className="text-xs text-slate-400">{fmtDate(flag.createdAt)} · severity {flag.severity}{flag.confidence != null && ` · ${Math.round(flag.confidence * 100)}% confident`}</p>
        <div className="flex items-center justify-between gap-2 pt-1">
          <StatusBadge status={flag.status} />
          {flag.status === 'pending' ? (
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => set('dismissed')} loading={busy}><X className="h-3.5 w-3.5" />Dismiss</Button>
              <Button size="sm" variant="danger" onClick={() => set('confirmed')} loading={busy}><Check className="h-3.5 w-3.5" />Cheating</Button>
            </div>
          ) : <Button size="sm" variant="ghost" onClick={() => set('pending')} loading={busy}>Undo</Button>}
        </div>
      </div>
      {zoom && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4" onClick={() => setZoom(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imgUrl(`/flags/${flag._id}/image`)} alt="Evidence frame" className="max-h-[90vh] max-w-full rounded-xl" />
        </div>
      )}
    </div>
  );
}
