'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Empty, PageHeader, Spinner, Tabs } from '@/components/ui';
import FlagCard, { Flag } from '@/components/FlagCard';

export default function Flags() {
  const [status, setStatus] = useState<'pending' | 'confirmed' | 'dismissed'>('pending');
  const [flags, setFlags] = useState<Flag[] | null>(null);
  useEffect(() => { api(`/flags?status=${status}`).then(setFlags); }, [status]);
  return (
    <>
      <PageHeader title="AI flags" sub="Webcam frames the AI found suspicious. You make the final call." />
      <Tabs value={status} onChange={(s) => { setFlags(null); setStatus(s); }} tabs={[{ id: 'pending', label: 'Needs review' }, { id: 'confirmed', label: 'Confirmed cheating' }, { id: 'dismissed', label: 'Dismissed' }]} />
      {!flags ? <Spinner /> : flags.length === 0 ? <Empty title="Nothing here" body={status === 'pending' ? 'All flags have been reviewed.' : undefined} /> : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {flags.map((f) => <FlagCard key={f._id} flag={f} onChange={(nf) => setFlags(flags.filter((x) => x._id !== nf._id || nf.status === status))} />)}
        </div>
      )}
    </>
  );
}
