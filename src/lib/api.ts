// Backend base URL, e.g. https://evalix-b.onrender.com (trailing slash is stripped)
export const API_URL = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5080').replace(/\/+$/, '');

export type Role = 'admin' | 'teacher' | 'student';
export interface User { _id: string; name: string; email: string; role: Role; rollNo?: string; department?: string }

export class ApiError extends Error {
  constructor(message: string, public status: number, public code?: string) { super(message); }
}

export const getToken = () => (typeof window === 'undefined' ? null : localStorage.getItem('evalix_token'));
export const getUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem('evalix_user') || 'null'); } catch { return null; }
};
export const setAuth = (token: string, user: User) => {
  localStorage.setItem('evalix_token', token);
  localStorage.setItem('evalix_user', JSON.stringify(user));
};
export const logout = () => {
  localStorage.removeItem('evalix_token');
  localStorage.removeItem('evalix_user');
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- full reload clears in-memory socket/auth state
  window.location.href = "/login";
};
export const homeFor = (role?: Role) => (role === 'admin' ? '/admin' : role === 'teacher' ? '/teacher' : '/student');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function api<T = any>(path: string, opts: { method?: string; body?: unknown } = {}): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_URL}/api${path}`, {
    method: opts.method || (opts.body ? 'POST' : 'GET'),
    headers: { ...(opts.body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && token && !path.startsWith('/auth/login')) { logout(); }
  if (!res.ok) throw new ApiError(data.error || `Request failed (${res.status})`, res.status, data.code);
  return data as T;
}

// Protected image URL (token passed as query so it works in <img>)
export const imgUrl = (path: string) => `${API_URL}/api${path}?token=${encodeURIComponent(getToken() || '')}`;

export async function download(path: string, filename: string) {
  const res = await fetch(`${API_URL}/api${path}`, { headers: { Authorization: `Bearer ${getToken()}` } });
  if (!res.ok) throw new Error('Download failed');
  const blob = await res.blob();
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
