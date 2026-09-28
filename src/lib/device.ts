// Stable per-browser device id (survives reloads), and a per-tab session id (a new tab = a new session).
const rid = () => (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now().toString(36));

export function getDeviceId() {
  let id = localStorage.getItem('evalix_device');
  if (!id) { id = rid(); localStorage.setItem('evalix_device', id); }
  return id;
}

export function getSessionId(attemptKey: string) {
  const k = `evalix_session_${attemptKey}`;
  let id = sessionStorage.getItem(k);
  if (!id) { id = rid(); sessionStorage.setItem(k, id); }
  return id;
}

async function sha(text: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 32);
}

export async function getFingerprint() {
  let canvasHash = '';
  try {
    const c = document.createElement('canvas');
    const ctx = c.getContext('2d')!;
    ctx.textBaseline = 'top'; ctx.font = '14px Arial'; ctx.fillStyle = '#f60'; ctx.fillRect(0, 0, 60, 20);
    ctx.fillStyle = '#069'; ctx.fillText('Evalix-fp', 2, 2);
    canvasHash = c.toDataURL().slice(-64);
  } catch {}
  const parts = [navigator.userAgent, navigator.language, navigator.platform, screen.width + 'x' + screen.height, screen.colorDepth,
    Intl.DateTimeFormat().resolvedOptions().timeZone, navigator.hardwareConcurrency, canvasHash].join('|');
  return {
    fingerprint: await sha(parts),
    screen: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}
