'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, Bookmark, Camera, CheckCircle2, ChevronLeft, ChevronRight, Clock, CloudOff, Lock, Maximize, MonitorX, RefreshCcw, ShieldCheck, Wifi } from 'lucide-react';
import { api, ApiError, getUser } from '@/lib/api';
import { getSocket } from '@/lib/socket';
import { getDeviceId, getFingerprint, getSessionId } from '@/lib/device';
import { Badge, Button, Card, Logo, Modal, Spinner, clsx } from '@/components/ui';

type Settings = { fullscreenRequired: boolean; maxTabSwitches: number; autoSubmitOnLimit: boolean; blockCopyPaste: boolean; aiProctoring: boolean; captureIntervalSec: number; resumePolicy: 'allowed' | 'not_allowed'; maxResumes: number; blockNewDeviceResume: boolean };
type Info = { _id: string; title: string; subject?: string; description?: string; durationMin: number; teacher?: string; questionCount: number; totalMarks: number; settings: Settings; open: boolean; aiEnabled: boolean; attempt: { _id: string; status: string; resumeCount: number; lockedReason?: string } | null };
type Q = { index: number; text: string; code?: string; options: string[]; marks: number; topic: string };
type SessionInfo = { isResume: boolean; reconnected?: boolean; deviceChanged?: boolean; browserChanged?: boolean; ipChanged?: boolean; awaySeconds?: number; resumeNo?: number };
type Phase = 'loading' | 'intro' | 'camera' | 'starting' | 'exam' | 'done' | 'locked' | 'replaced' | 'error';
type ClientEvent = { type: string; meta?: Record<string, unknown>; questionIndex?: number; at: string };

const Center = ({ children }: { children: React.ReactNode }) => (
  <div className="grid min-h-screen place-items-center bg-canvas p-4"><Card className="w-full max-w-lg p-8 text-center">{children}</Card></div>
);

const fmtTime = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return `${h ? `${h}:` : ''}${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
};

export default function ExamRunner() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>('loading');
  const [info, setInfo] = useState<Info | null>(null);
  const [error, setError] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [camError, setCamError] = useState('');
  const [refPhoto, setRefPhoto] = useState<string | null>(null);

  // exam state
  const [questions, setQuestions] = useState<Q[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [marked, setMarked] = useState<number[]>([]);
  const [pos, setPos] = useState(0);
  const [endsAt, setEndsAt] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const [session, setSession] = useState<SessionInfo | null>(null);
  const [save, setSave] = useState<'saved' | 'saving' | 'offline'>('saved');
  const [fsOut, setFsOut] = useState(false);
  const [warning, setWarning] = useState('');
  const [camLost, setCamLost] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [doneInfo, setDoneInfo] = useState<{ attemptId?: string; reason?: string }>({});

  const attemptId = useRef('');
  const sessionId = useRef('');
  const [clockOffset, setClockOffset] = useState(0);
  const endsAtRef = useRef(0);
  const autoSubmitted = useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const eventQueue = useRef<ClientEvent[]>([]);
  const pendingAnswers = useRef<Record<string, number | null>>({});
  const hiddenAt = useRef<number | null>(null);
  const blurAt = useRef<number | null>(null);
  const phaseRef = useRef<Phase>('loading');
  const posRef = useRef(0);
  const settingsRef = useRef<Settings | null>(null);
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { posRef.current = pos; }, [pos]);

  // ---------- load exam info ----------
  useEffect(() => {
    if (!getUser()) { router.replace('/login'); return; }
    api<Info>(`/student/exams/${id}`).then((i) => {
      setInfo(i); settingsRef.current = i.settings;
      if (i.attempt?.status === 'submitted') { setDoneInfo({ attemptId: i.attempt._id }); setPhase('done'); }
      else if (i.attempt?.status === 'locked') { setError(i.attempt.lockedReason || 'Your attempt is locked.'); setPhase('locked'); }
      else setPhase('intro');
    }).catch((e) => { setError(e.message); setPhase('error'); });
  }, [id, router]);

  // ---------- helpers ----------
  const handleApiError = useCallback((e: unknown) => {
    if (e instanceof ApiError) {
      if (e.code === 'SESSION_REPLACED') { setPhase('replaced'); return true; }
      if (e.code === 'SUBMITTED') { setDoneInfo({ attemptId: attemptId.current, reason: e.message }); setPhase('done'); return true; }
      if (e.code === 'LOCKED') { setError(e.message); setPhase('locked'); return true; }
    }
    return false;
  }, []);

  const flushEvents = useCallback(async () => {
    if (!attemptId.current || !eventQueue.current.length || phaseRef.current !== 'exam') return;
    const events = eventQueue.current.splice(0, 50);
    try {
      const r = await api(`/student/attempts/${attemptId.current}/events`, { body: { sessionId: sessionId.current, events } });
      if (r.autoSubmitted) { setDoneInfo({ attemptId: attemptId.current, reason: 'Auto-submitted: tab-switch limit exceeded' }); setPhase('done'); }
      else if (events.some((e) => e.type === 'tab_hidden' || e.type === 'window_blur') && r.remainingTabSwitches != null) {
        setWarning(r.remainingTabSwitches > 0 ? `Leaving the exam window is recorded. ${r.remainingTabSwitches} warning${r.remainingTabSwitches === 1 ? '' : 's'} left.` : 'You have used all your warnings. Further switches are reported to your teacher.');
      }
    } catch (e) {
      if (!handleApiError(e)) eventQueue.current.unshift(...events);
    }
  }, [handleApiError]);

  const logEv = useCallback((type: string, meta?: Record<string, unknown>, immediate = false) => {
    eventQueue.current.push({ type, meta, at: new Date().toISOString(), questionIndex: undefined });
    if (immediate) flushEvents();
  }, [flushEvents]);

  const captureFrame = useCallback((): string | null => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return null;
    const c = document.createElement('canvas');
    const scale = Math.min(1, 640 / v.videoWidth);
    c.width = v.videoWidth * scale; c.height = v.videoHeight * scale;
    c.getContext('2d')!.drawImage(v, 0, 0, c.width, c.height);
    return c.toDataURL('image/jpeg', 0.7);
  }, []);

  const sendFrame = useCallback(async (trigger: string) => {
    if (!settingsRef.current?.aiProctoring || !attemptId.current || phaseRef.current !== 'exam') return;
    const image = captureFrame();
    if (!image) return;
    try { await api(`/student/attempts/${attemptId.current}/frame`, { body: { sessionId: sessionId.current, image, trigger } }); }
    catch (e) { handleApiError(e); }
  }, [captureFrame, handleApiError]);

  const startCamera = useCallback(async () => {
    setCamError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; await videoRef.current.play().catch(() => {}); }
      stream.getVideoTracks()[0].onended = () => { setCamLost(true); logEv('camera_lost', {}, true); };
      setCamLost(false);
      return true;
    } catch {
      setCamError('Camera access was blocked. Allow camera access in your browser (address bar → site settings) and try again.');
      return false;
    }
  }, [logEv]);

  // Keep the <video> element wired to the stream when it re-mounts between phases.
  useEffect(() => {
    if (videoRef.current && streamRef.current && videoRef.current.srcObject !== streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(() => {});
    }
  });

  const enterFullscreen = () => { if (settingsRef.current?.fullscreenRequired && !document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {}); };

  // ---------- start / resume ----------
  const begin = async () => {
    if (!info) return;
    enterFullscreen(); // must run inside the click handler
    setPhase('starting');
    try {
      sessionId.current = getSessionId(`${id}`);
      const fp = await getFingerprint();
      const r = await api(`/student/exams/${id}/start`, { body: { sessionId: sessionId.current, deviceId: getDeviceId(), ...fp, referencePhoto: refPhoto || undefined } });
      attemptId.current = r.attempt._id;
      const off = new Date(r.serverNow).getTime() - Date.now();
      setClockOffset(off);
      endsAtRef.current = new Date(r.attempt.endsAt).getTime() - off;
      setQuestions(r.questions);
      setAnswers(r.attempt.answers || {});
      setMarked(r.attempt.marked || []);
      setPos(Math.min(r.attempt.currentIndex || 0, r.questions.length - 1));
      setEndsAt(new Date(r.attempt.endsAt).getTime());
      setSession(r.session);
      setPhase('exam');
      phaseRef.current = 'exam';
      if (!r.session.isResume && !r.session.reconnected) logEv('instructions_accepted', {}, true);
      if (info.settings.aiProctoring) setTimeout(() => sendFrame(r.session.isResume ? 'resume' : r.session.reconnected ? 'reconnect' : 'start'), 1500);
    } catch (e) {
      const err = e as ApiError;
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      if (err.code === 'LOCKED') { setError(err.message); setPhase('locked'); }
      else if (err.code === 'SUBMITTED') { setDoneInfo({ attemptId: info.attempt?._id, reason: err.message }); setPhase('done'); }
      else { setError(err.message); setPhase('error'); }
    }
  };

  // ---------- answers (autosave with offline retry) ----------
  const persist = useCallback(async (extra: Record<string, unknown> = {}) => {
    const entries = Object.entries(pendingAnswers.current);
    setSave('saving');
    try {
      for (const [qi, choice] of entries) {
        await api(`/student/attempts/${attemptId.current}/answer`, { body: { sessionId: sessionId.current, questionIndex: Number(qi), choice, currentIndex: posRef.current } });
        delete pendingAnswers.current[qi];
      }
      if (!entries.length || Object.keys(extra).length) await api(`/student/attempts/${attemptId.current}/answer`, { body: { sessionId: sessionId.current, currentIndex: posRef.current, ...extra } });
      setSave('saved');
    } catch (e) {
      if (!handleApiError(e)) setSave('offline');
    }
  }, [handleApiError]);

  const choose = (q: Q, oi: number) => {
    const key = String(q.index);
    const next = answers[key] === oi ? null : oi;
    setAnswers((a) => { const c = { ...a }; if (next === null) delete c[key]; else c[key] = next; return c; });
    pendingAnswers.current[key] = next;
    persist();
  };
  const toggleMark = () => {
    const qi = questions[pos].index;
    const m = marked.includes(qi) ? marked.filter((x) => x !== qi) : [...marked, qi];
    setMarked(m);
    persist({ marked: m });
  };
  const go = (p: number) => { setPos(p); posRef.current = p; eventQueue.current.push({ type: 'question_visited', questionIndex: questions[p].index, at: new Date().toISOString() }); };

  const submit = useCallback(async (auto = false) => {
    setSubmitting(true);
    try {
      if (Object.keys(pendingAnswers.current).length) await persist();
      await flushEvents();
      await api(`/student/attempts/${attemptId.current}/submit`, { body: { sessionId: sessionId.current } });
      setDoneInfo({ attemptId: attemptId.current, reason: auto ? 'Time is up — your answers were submitted automatically.' : undefined });
      setPhase('done');
    } catch (e) {
      if (!handleApiError(e)) setWarning(`Could not submit: ${(e as Error).message}. Check your connection — we will keep trying.`);
    } finally { setSubmitting(false); setConfirmSubmit(false); }
  }, [flushEvents, handleApiError, persist]);
  const submitRef = useRef(submit);
  useEffect(() => { submitRef.current = submit; }, [submit]);

  // ---------- timers: clock, autosave retry, event flush, heartbeat, camera ----------
  useEffect(() => {
    if (phase !== 'exam') return;
    const clock = setInterval(() => {
      setNow(Date.now());
      // auto-submit when time runs out (the server also auto-submits expired attempts)
      if (endsAtRef.current && Date.now() >= endsAtRef.current && !autoSubmitted.current) { autoSubmitted.current = true; submitRef.current(true); }
    }, 1000);
    const flush = setInterval(() => { flushEvents(); if (Object.keys(pendingAnswers.current).length) persist(); }, 4000);
    const s = getSocket();
    const join = () => s.emit('student:join', { attemptId: attemptId.current, sessionId: sessionId.current });
    join();
    s.on('connect', join);
    const hb = setInterval(() => s.emit('heartbeat'), 10000);
    s.emit('heartbeat');
    const onEnded = (d: { sessionId: string }) => { if (d.sessionId === sessionId.current) setPhase('replaced'); };
    const onSubmitted = (d: { reason: string }) => { setDoneInfo({ attemptId: attemptId.current, reason: d.reason === 'teacher' ? 'Your teacher submitted this exam.' : undefined }); setPhase('done'); };
    const onTime = (d: { endsAt: string }) => { setEndsAt(new Date(d.endsAt).getTime()); endsAtRef.current = new Date(d.endsAt).getTime() - clockOffset; autoSubmitted.current = false; setWarning('Your teacher gave you extra time.'); };
    s.on('session:ended', onEnded); s.on('attempt:submitted', onSubmitted); s.on('attempt:time', onTime);

    let camTimer: ReturnType<typeof setTimeout>;
    const scheduleFrame = () => {
      const base = (settingsRef.current?.captureIntervalSec || 30) * 1000;
      camTimer = setTimeout(() => { sendFrame('interval'); scheduleFrame(); }, base * (0.7 + Math.random() * 0.6));
    };
    if (settingsRef.current?.aiProctoring) scheduleFrame();
    return () => {
      clearInterval(clock); clearInterval(flush); clearInterval(hb); clearTimeout(camTimer);
      s.off('connect', join); s.off('session:ended', onEnded); s.off('attempt:submitted', onSubmitted); s.off('attempt:time', onTime);
    };
  }, [phase, flushEvents, persist, sendFrame, clockOffset]);

  const remaining = endsAt - (now + clockOffset);

  // ---------- lockdown listeners ----------
  useEffect(() => {
    if (phase !== 'exam') return;
    const st = settingsRef.current!;
    const onVis = () => {
      if (document.hidden) { hiddenAt.current = Date.now(); logEv('tab_hidden', {}, true); }
      else {
        const away = hiddenAt.current ? Math.round((Date.now() - hiddenAt.current) / 1000) : 0;
        hiddenAt.current = null;
        logEv('tab_visible', { awaySeconds: away }, true);
        setTimeout(() => sendFrame('tab_return'), 800);
      }
    };
    const onBlur = () => { if (!document.hidden) { blurAt.current = Date.now(); logEv('window_blur', {}, true); } };
    const onFocus = () => {
      if (blurAt.current) { logEv('window_focus', { awaySeconds: Math.round((Date.now() - blurAt.current) / 1000) }); blurAt.current = null; setTimeout(() => sendFrame('focus_return'), 800); }
    };
    const onFs = () => {
      if (!st.fullscreenRequired) return;
      if (!document.fullscreenElement) { setFsOut(true); logEv('fullscreen_exit', {}, true); }
      else { setFsOut(false); logEv('fullscreen_enter'); }
    };
    const block = (type: string) => (e: Event) => { if (st.blockCopyPaste) { e.preventDefault(); logEv(type, {}, true); setWarning('Copy, cut and paste are disabled during this exam.'); } };
    const onCopy = block('copy_attempt'), onCut = block('cut_attempt'), onPaste = block('paste_attempt');
    const onCtx = (e: Event) => { if (st.blockCopyPaste) { e.preventDefault(); logEv('right_click'); } };
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      const dev = e.key === 'F12' || ((e.ctrlKey || e.metaKey) && e.shiftKey && ['i', 'j', 'c'].includes(k)) || ((e.ctrlKey || e.metaKey) && k === 'u');
      const print = (e.ctrlKey || e.metaKey) && k === 'p';
      if (dev || print) { e.preventDefault(); logEv(dev ? 'devtools_attempt' : 'print_attempt', { key: e.key }, true); }
      if (e.key === 'PrintScreen') logEv('print_attempt', { key: 'PrintScreen' }, true);
    };
    const onOffline = () => { setSave('offline'); logEv('offline'); };
    const onOnline = () => { logEv('online', {}, true); persist(); };
    let resizeT: ReturnType<typeof setTimeout>;
    const onResize = () => { clearTimeout(resizeT); resizeT = setTimeout(() => logEv('window_resize', { w: innerWidth, h: innerHeight }), 1000); };
    const onBeforeUnload = (e: BeforeUnloadEvent) => { e.preventDefault(); };
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('blur', onBlur); window.addEventListener('focus', onFocus);
    document.addEventListener('fullscreenchange', onFs);
    document.addEventListener('copy', onCopy); document.addEventListener('cut', onCut); document.addEventListener('paste', onPaste);
    document.addEventListener('contextmenu', onCtx); document.addEventListener('keydown', onKey);
    window.addEventListener('offline', onOffline); window.addEventListener('online', onOnline);
    window.addEventListener('resize', onResize); window.addEventListener('beforeunload', onBeforeUnload);
    const scr = screen as Screen & { isExtended?: boolean };
    if (scr.isExtended) logEv('multi_monitor', {}, true);
    if (st.fullscreenRequired && !document.fullscreenElement) setFsOut(true);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('blur', onBlur); window.removeEventListener('focus', onFocus);
      document.removeEventListener('fullscreenchange', onFs);
      document.removeEventListener('copy', onCopy); document.removeEventListener('cut', onCut); document.removeEventListener('paste', onPaste);
      document.removeEventListener('contextmenu', onCtx); document.removeEventListener('keydown', onKey);
      window.removeEventListener('offline', onOffline); window.removeEventListener('online', onOnline);
      window.removeEventListener('resize', onResize); window.removeEventListener('beforeunload', onBeforeUnload);
    };
  }, [phase, logEv, persist, sendFrame]);

  // stop camera + exit fullscreen when leaving the exam
  useEffect(() => {
    if (phase === 'done' || phase === 'replaced' || phase === 'locked') {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    }
  }, [phase]);
  useEffect(() => () => streamRef.current?.getTracks().forEach((t) => t.stop()), []);

  useEffect(() => { if (!warning) return; const t = setTimeout(() => setWarning(''), 6000); return () => clearTimeout(t); }, [warning]);

  // ---------- render ----------
  if (phase === 'loading' || phase === 'starting') return <div className="grid min-h-screen place-items-center"><Spinner label={phase === 'starting' ? 'Preparing your exam…' : undefined} /></div>;

  if (phase === 'error') return <Center><AlertTriangle className="mx-auto h-10 w-10 text-amber-500" /><p className="mt-4 font-semibold">Can&apos;t open this exam</p><p className="mt-2 text-sm text-muted">{error}</p><Link href="/student"><Button className="mt-6">Back to dashboard</Button></Link></Center>;
  if (phase === 'locked') return <Center><Lock className="mx-auto h-10 w-10 text-red-500" /><p className="mt-4 font-semibold">Attempt locked</p><p className="mt-2 text-sm text-muted">{error}</p><p className="mt-2 text-sm text-muted">Your teacher has been notified and can unlock it.</p><Link href="/student"><Button className="mt-6">Back to dashboard</Button></Link></Center>;
  if (phase === 'replaced') return <Center><MonitorX className="mx-auto h-10 w-10 text-red-500" /><p className="mt-4 font-semibold">Exam opened somewhere else</p><p className="mt-2 text-sm text-muted">This exam was resumed in another tab, browser or device, so this window was closed. This has been recorded and your teacher can see it.</p><Link href="/student"><Button className="mt-6">Back to dashboard</Button></Link></Center>;
  if (phase === 'done') return <Center><CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" /><p className="mt-4 text-xl font-semibold">Exam submitted</p><p className="mt-2 text-sm text-muted">{doneInfo.reason || 'Your answers have been saved and submitted successfully.'}</p><div className="mt-6 flex justify-center gap-3">{doneInfo.attemptId && <Link href={`/student/results/${doneInfo.attemptId}`}><Button>View result</Button></Link>}<Link href="/student"><Button variant="secondary">Dashboard</Button></Link></div></Center>;

  if (!info) return null;
  const s = info.settings;
  const resuming = info.attempt?.status === 'in_progress';

  if (phase === 'intro') {
    const rules = [
      s.fullscreenRequired && 'The exam runs in fullscreen. Leaving fullscreen is recorded.',
      'Do not switch tabs or minimize the window — every switch is logged' + (s.maxTabSwitches ? ` (${s.maxTabSwitches} warnings${s.autoSubmitOnLimit ? ', then auto-submit' : ''}).` : '.'),
      s.blockCopyPaste && 'Copy, paste and right-click are disabled.',
      s.aiProctoring && 'Your camera must stay on. Snapshots are checked by AI for phones, other people or a missing face, and suspicious images are sent to your teacher.',
      'Do not use a mobile phone or any other device.',
      s.resumePolicy === 'not_allowed' ? 'You cannot leave and come back — closing the exam locks your attempt.' : `If you get disconnected you can resume (max ${s.maxResumes} times). The timer keeps running, and device/browser/IP changes are recorded.`,
      'Answers are saved automatically. The exam submits itself when time runs out.',
    ].filter(Boolean) as string[];
    return (
      <div className="min-h-screen bg-canvas p-4 md:p-8">
        <div className="mx-auto max-w-3xl">
          <Logo size={26} className="mb-6" />
          <Card className="p-6 md:p-8">
            <p className="text-sm font-medium text-brand-600">Exam instructions</p>
            <h1 className="mt-1 text-2xl font-semibold">{info.title}</h1>
            <p className="text-sm text-muted">{info.subject} · {info.teacher}</p>
            <div className="mt-6 grid grid-cols-3 gap-3">
              {[['Duration', `${info.durationMin} min`], ['Questions', info.questionCount], ['Total marks', info.totalMarks]].map(([l, v]) => (
                <div key={l as string} className="rounded-xl bg-canvas p-3"><p className="text-xs text-muted">{l}</p><p className="text-lg font-semibold">{v}</p></div>
              ))}
            </div>
            {info.description && <p className="mt-4 text-sm text-muted">{info.description}</p>}
            {resuming && (
              <div className="mt-6 flex gap-3 rounded-xl bg-blue-50 p-4 text-sm text-blue-800">
                <RefreshCcw className="h-5 w-5 shrink-0" />
                <p>You already started this exam. Your answers are saved and the timer has kept running. Resuming is recorded (resume {info.attempt!.resumeCount + 1} of max {s.maxResumes}), including whether your device, browser or network changed.</p>
              </div>
            )}
            <ul className="mt-6 space-y-2.5">{rules.map((r) => <li key={r} className="flex gap-2 text-sm"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />{r}</li>)}</ul>
            <label className="mt-6 flex cursor-pointer items-center gap-2 text-sm font-medium"><input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="h-4 w-4 accent-indigo-600" />I understand the instructions{s.aiProctoring && ' and agree to camera monitoring'}</label>
            <Button size="lg" className="mt-6 w-full" disabled={!agreed || (!info.open && !resuming)}
              onClick={async () => { if (s.aiProctoring) { setPhase('camera'); await startCamera(); } else begin(); }}>
              {s.aiProctoring ? <><Camera className="h-5 w-5" />Continue to camera check</> : resuming ? 'Resume exam' : 'Start exam'}
            </Button>
            {!info.open && !resuming && <p className="mt-2 text-center text-sm text-muted">This exam is not open right now.</p>}
          </Card>
        </div>
      </div>
    );
  }

  if (phase === 'camera') {
    return (
      <div className="grid min-h-screen place-items-center bg-canvas p-4">
        <Card className="w-full max-w-xl p-6 md:p-8">
          <p className="text-sm font-medium text-brand-600">Camera check</p>
          <h1 className="mt-1 text-xl font-semibold">{resuming ? 'Verify it’s you to resume' : 'Take your reference photo'}</h1>
          <p className="mt-1 text-sm text-muted">Sit facing the camera in good light with only you in the frame. {resuming ? 'A fresh photo is compared with your original one.' : 'This photo is used to check it’s you throughout the exam.'}</p>
          <div className="relative mt-5 aspect-[4/3] overflow-hidden rounded-2xl bg-slate-900">
            <video ref={videoRef} muted playsInline className={clsx('h-full w-full -scale-x-100 object-cover', refPhoto && 'hidden')} />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {refPhoto && <img src={refPhoto} alt="Reference" className="h-full w-full -scale-x-100 object-cover" />}
            <div className="pointer-events-none absolute inset-[18%] rounded-[40%] border-2 border-dashed border-white/50" />
          </div>
          {camError && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{camError}</p>}
          {!info.aiEnabled && <p className="mt-3 text-xs text-muted">Note: AI analysis isn’t configured on this server — snapshots are still recorded for your teacher.</p>}
          <div className="mt-5 flex gap-3">
            {camError ? <Button className="flex-1" onClick={startCamera}>Try again</Button>
              : !refPhoto ? <Button className="flex-1" onClick={() => setRefPhoto(captureFrame())}><Camera className="h-4 w-4" />Capture photo</Button>
              : <><Button variant="secondary" onClick={() => setRefPhoto(null)}>Retake</Button><Button className="flex-1" onClick={begin}><Maximize className="h-4 w-4" />{resuming ? 'Resume exam' : 'Start exam'} (fullscreen)</Button></>}
          </div>
        </Card>
      </div>
    );
  }

  // ---------- exam ----------
  const q = questions[pos];
  const answeredCount = Object.keys(answers).length;
  const low = remaining < 5 * 60000;

  return (
    <div className="no-select min-h-screen bg-canvas">
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-line bg-white px-4 md:px-6">
        <div className="flex min-w-0 items-center gap-3"><Logo size={22} text={false} /><p className="truncate font-semibold">{info.title}</p></div>
        <div className="flex items-center gap-2 md:gap-4">
          <span className={clsx('hidden items-center gap-1 text-xs sm:flex', save === 'offline' ? 'text-red-600' : 'text-muted')}>
            {save === 'offline' ? <><CloudOff className="h-4 w-4" />Offline — will retry</> : save === 'saving' ? 'Saving…' : <><Wifi className="h-4 w-4" />Saved</>}
          </span>
          {s.aiProctoring && <span className={clsx('flex items-center gap-1 rounded-full px-2 py-1 text-xs', camLost ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700')}><Camera className="h-3.5 w-3.5" />{camLost ? 'Camera off' : 'Monitored'}</span>}
          <span className={clsx('flex items-center gap-1.5 rounded-xl px-3 py-1.5 font-mono text-sm font-semibold', low ? 'bg-red-50 text-red-600' : 'bg-brand-50 text-brand-700')}><Clock className="h-4 w-4" />{fmtTime(remaining)}</span>
          <Button size="sm" onClick={() => setConfirmSubmit(true)}>Submit</Button>
        </div>
      </header>

      {session?.isResume && (
        <div className="border-b border-blue-100 bg-blue-50 px-4 py-2 text-center text-sm text-blue-800">
          Resumed (#{session.resumeNo}) — your answers were restored. {session.deviceChanged ? 'A device change was recorded and reported to your teacher.' : 'Same device detected.'}
        </div>
      )}
      {warning && <div className="fixed left-1/2 top-20 z-40 w-[min(560px,calc(100%-2rem))] -translate-x-1/2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-medium text-white shadow-lg">{warning}</div>}

      <div className="mx-auto grid max-w-6xl gap-6 p-4 md:p-6 lg:grid-cols-[1fr_280px]">
        <Card className="p-5 md:p-8">
          <div className="flex items-center justify-between text-sm text-muted">
            <span>Question {pos + 1} of {questions.length}</span>
            <span className="flex items-center gap-2"><Badge>{q.topic}</Badge>{q.marks} mark{q.marks !== 1 ? 's' : ''}</span>
          </div>
          <p className="mt-4 text-lg font-medium">{q.text}</p>
          {q.code && <pre className="mt-4 overflow-x-auto rounded-xl bg-ink p-4 font-mono text-sm text-slate-100">{q.code}</pre>}
          <div className="mt-6 space-y-3">
            {q.options.map((o, oi) => {
              const sel = answers[String(q.index)] === oi;
              return (
                <button key={oi} onClick={() => choose(q, oi)}
                  className={clsx('flex w-full cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition', sel ? 'border-brand-500 bg-brand-50 ring-2 ring-brand-100' : 'border-line hover:border-brand-100 hover:bg-canvas')}>
                  <span className={clsx('grid h-7 w-7 shrink-0 place-items-center rounded-full border text-xs font-semibold', sel ? 'border-brand-600 bg-brand-600 text-white' : 'border-line')}>{String.fromCharCode(65 + oi)}</span>{o}
                </button>
              );
            })}
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <Button variant="secondary" disabled={pos === 0} onClick={() => go(pos - 1)}><ChevronLeft className="h-4 w-4" />Previous</Button>
            <Button variant="ghost" onClick={toggleMark}><Bookmark className={clsx('h-4 w-4', marked.includes(q.index) && 'fill-amber-400 text-amber-500')} />{marked.includes(q.index) ? 'Marked' : 'Mark for review'}</Button>
            {pos < questions.length - 1 ? <Button onClick={() => go(pos + 1)}>Save & Next<ChevronRight className="h-4 w-4" /></Button> : <Button onClick={() => setConfirmSubmit(true)}>Finish</Button>}
          </div>
        </Card>

        <div className="space-y-4">
          {s.aiProctoring && (
            <Card className="overflow-hidden">
              <video ref={videoRef} muted playsInline className="aspect-[4/3] w-full -scale-x-100 bg-slate-900 object-cover" />
              <p className="flex items-center gap-1.5 p-3 text-xs text-muted"><ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />Camera monitoring active</p>
            </Card>
          )}
          <Card className="p-4">
            <p className="text-sm font-semibold">Questions</p>
            <p className="text-xs text-muted">{answeredCount} of {questions.length} answered</p>
            <div className="mt-3 grid grid-cols-6 gap-2">
              {questions.map((qq, i) => {
                const a = answers[String(qq.index)] !== undefined;
                const m = marked.includes(qq.index);
                return (
                  <button key={qq.index} onClick={() => go(i)}
                    className={clsx('relative grid aspect-square cursor-pointer place-items-center rounded-lg text-xs font-semibold transition', i === pos && 'ring-2 ring-brand-500 ring-offset-1', a ? 'bg-brand-600 text-white' : 'bg-canvas text-muted hover:bg-brand-50')}>
                    {i + 1}{m && <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-amber-400 ring-2 ring-white" />}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-muted">
              <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-brand-600" />Answered</span>
              <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-canvas ring-1 ring-line" />Not answered</span>
              <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-amber-400" />Marked</span>
            </div>
          </Card>
        </div>
      </div>

      {fsOut && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/80 p-4 backdrop-blur">
          <Card className="max-w-md p-8 text-center">
            <Maximize className="mx-auto h-10 w-10 text-brand-600" />
            <p className="mt-4 text-lg font-semibold">Return to fullscreen</p>
            <p className="mt-2 text-sm text-muted">This exam must be taken in fullscreen. Leaving fullscreen has been recorded. Your timer is still running.</p>
            <Button className="mt-6 w-full" onClick={() => document.documentElement.requestFullscreen?.().then(() => setTimeout(() => sendFrame('fullscreen_return'), 800)).catch(() => {})}>Enter fullscreen</Button>
          </Card>
        </div>
      )}
      {camLost && !fsOut && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/80 p-4 backdrop-blur">
          <Card className="max-w-md p-8 text-center">
            <Camera className="mx-auto h-10 w-10 text-red-500" />
            <p className="mt-4 text-lg font-semibold">Camera turned off</p>
            <p className="mt-2 text-sm text-muted">Camera monitoring is required for this exam. This has been recorded.</p>
            {camError && <p className="mt-2 text-sm text-red-600">{camError}</p>}
            <Button className="mt-6 w-full" onClick={async () => { if (await startCamera()) { logEv('camera_restored', {}, true); setTimeout(() => sendFrame('camera_restored'), 1000); } }}>Turn camera back on</Button>
          </Card>
        </div>
      )}
      <Modal open={confirmSubmit} onClose={() => setConfirmSubmit(false)} title="Submit exam?">
        <p className="text-sm text-muted">You answered <b className="text-ink">{answeredCount}</b> of {questions.length} questions.{questions.length - answeredCount > 0 && ` ${questions.length - answeredCount} unanswered.`}{marked.length > 0 && ` ${marked.length} marked for review.`} You can’t change answers after submitting.</p>
        <div className="mt-6 flex justify-end gap-2"><Button variant="secondary" onClick={() => setConfirmSubmit(false)}>Keep working</Button><Button loading={submitting} onClick={() => submit(false)}>Submit exam</Button></div>
      </Modal>
    </div>
  );
}
