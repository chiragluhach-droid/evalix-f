'use client';

import { useCallback, useEffect, useState } from 'react';
import { Plus, Trash2, Upload } from 'lucide-react';
import { api, Role, User } from '@/lib/api';
import { Badge, Button, Card, Empty, Input, Modal, PageHeader, Select, Spinner, Tabs, Textarea, fmtDay, useToast } from '@/components/ui';

export default function Users() {
  const toast = useToast();
  const [role, setRole] = useState<Role>('student');
  const [search, setSearch] = useState('');
  const [users, setUsers] = useState<(User & { createdAt: string })[] | null>(null);
  const [adding, setAdding] = useState(false);
  const [bulk, setBulk] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', rollNo: '', department: '', role: 'student' as Role });
  const [csv, setCsv] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api(`/admin/users?role=${role}&search=${encodeURIComponent(search)}`).then(setUsers);
  }, [role, search]);
  useEffect(() => { const t = setTimeout(load, 250); return () => clearTimeout(t); }, [load]);

  const create = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true);
    try { await api('/admin/users', { body: form }); toast('User created'); setAdding(false); setForm({ ...form, name: '', email: '', password: '', rollNo: '' }); load(); }
    catch (err) { toast((err as Error).message, 'error'); } finally { setBusy(false); }
  };
  const importCsv = async () => {
    setBusy(true);
    try {
      const r = await api<{ created: number; errors: string[] }>('/admin/users/bulk', { body: { csv, role } });
      toast(`${r.created} users imported${r.errors.length ? `, ${r.errors.length} errors` : ''}`, r.errors.length ? 'info' : 'success');
      if (r.errors.length) console.warn(r.errors);
      setBulk(false); setCsv(''); load();
    } catch (err) { toast((err as Error).message, 'error'); } finally { setBusy(false); }
  };
  const remove = async (u: User) => {
    if (!confirm(`Delete ${u.name}? This also deletes their exam attempts.`)) return;
    await api(`/admin/users/${u._id}`, { method: 'DELETE' }); toast('User deleted'); load();
  };

  return (
    <>
      <PageHeader title="Users" sub="Admins provision every account — there is no public sign-up."
        actions={<><Button variant="secondary" onClick={() => setBulk(true)}><Upload className="h-4 w-4" />Bulk import</Button><Button onClick={() => { setForm({ ...form, role }); setAdding(true); }}><Plus className="h-4 w-4" />Add user</Button></>} />
      <Tabs value={role} onChange={setRole} tabs={[{ id: 'student', label: 'Students' }, { id: 'teacher', label: 'Teachers' }, { id: 'admin', label: 'Admins' }]} />
      <div className="mb-4 max-w-sm"><Input placeholder="Search name, email or roll no…" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
      {!users ? <Spinner /> : users.length === 0 ? <Empty title="No users found" /> : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-line text-left text-muted"><tr><th className="p-4 font-medium">Name</th><th className="p-4 font-medium">Email</th><th className="p-4 font-medium">Roll no / Dept</th><th className="p-4 font-medium">Added</th><th /></tr></thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className="border-b border-line last:border-0">
                  <td className="p-4 font-medium">{u.name}</td><td className="p-4 text-muted">{u.email}</td>
                  <td className="p-4">{u.rollNo || '—'} {u.department && <Badge className="ml-1">{u.department}</Badge>}</td>
                  <td className="p-4 text-muted">{fmtDay(u.createdAt)}</td>
                  <td className="p-4 text-right"><button onClick={() => remove(u)} className="cursor-pointer rounded-lg p-2 text-muted hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      <Modal open={adding} onClose={() => setAdding(false)} title="Add user">
        <form onSubmit={create} className="space-y-3">
          <Select label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Role })}><option value="student">Student</option><option value="teacher">Teacher</option><option value="admin">Admin</option></Select>
          <Input label="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <Input label="Temporary password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} minLength={6} required />
          {form.role === 'student' && <Input label="Roll number" value={form.rollNo} onChange={(e) => setForm({ ...form, rollNo: e.target.value })} />}
          <Input label="Department" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
          <Button loading={busy} className="w-full">Create user</Button>
        </form>
      </Modal>
      <Modal open={bulk} onClose={() => setBulk(false)} title={`Bulk import ${role}s`}>
        <p className="mb-2 text-sm text-muted">One per line: <code className="rounded bg-slate-100 px-1">name,email,password[,rollNo]</code></p>
        <Textarea rows={8} value={csv} onChange={(e) => setCsv(e.target.value)} placeholder={'Riya Sharma,riya@college.edu,Welcome@123,CSE2025101'} className="font-mono" />
        <input type="file" accept=".csv,text/csv" className="mt-3 text-sm" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setCsv(await f.text()); }} />
        <Button onClick={importCsv} loading={busy} className="mt-4 w-full" disabled={!csv.trim()}>Import</Button>
      </Modal>
    </>
  );
}
