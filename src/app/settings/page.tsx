'use client';

import { useState } from 'react';
import { api, getUser } from '@/lib/api';
import { Button, Card, Input, PageHeader, useToast } from '@/components/ui';

export default function Settings() {
  const user = getUser();
  const toast = useToast();
  const [f, setF] = useState({ current: '', next: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (f.next !== f.confirm) return toast('Passwords do not match', 'error');
    setLoading(true);
    try { await api('/auth/password', { method: 'PUT', body: { current: f.current, next: f.next } }); toast('Password updated'); setF({ current: '', next: '', confirm: '' }); }
    catch (err) { toast((err as Error).message, 'error'); } finally { setLoading(false); }
  };
  return (
    <>
      <PageHeader title="Settings" sub="Your profile and security" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <p className="font-semibold">Profile</p>
          <dl className="mt-4 space-y-3 text-sm">
            {[['Name', user?.name], ['Email', user?.email], ['Role', user?.role], ['Roll number', user?.rollNo || '—']].map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-line pb-2"><dt className="text-muted">{k}</dt><dd className="font-medium capitalize">{v}</dd></div>
            ))}
          </dl>
        </Card>
        <Card className="p-6">
          <p className="font-semibold">Change password</p>
          <form onSubmit={save} className="mt-4 space-y-3">
            <Input label="Current password" type="password" value={f.current} onChange={(e) => setF({ ...f, current: e.target.value })} required />
            <Input label="New password" type="password" value={f.next} onChange={(e) => setF({ ...f, next: e.target.value })} minLength={6} required />
            <Input label="Confirm new password" type="password" value={f.confirm} onChange={(e) => setF({ ...f, confirm: e.target.value })} required />
            <Button loading={loading}>Update password</Button>
          </form>
        </Card>
      </div>
    </>
  );
}
