'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useScroll, useSpring } from 'motion/react';
import { ArrowRight, Menu, ScanFace, X } from 'lucide-react';
import { Logo, clsx } from '@/components/ui';
import { Reveal } from '@/components/fx';
import Hero from '@/components/landing/Hero';
import AIDemo from '@/components/landing/AIDemo';
import { Features, HowItWorks, Marquee, Market, Problem, ResumeTracking, SectionTitle } from '@/components/landing/Sections';

const LINKS = [['#problem', 'Problem'], ['#features', 'Features'], ['#ai-demo', 'AI demo'], ['#how', 'How it works'], ['#security', 'Security'], ['#roadmap', 'Roadmap']];

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 200, damping: 30 });
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on();
    window.addEventListener('scroll', on, { passive: true });
    return () => window.removeEventListener('scroll', on);
  }, []);
  return (
    <header className="sticky top-0 z-40 px-3 pt-3">
      <div className={clsx('mx-auto flex max-w-7xl items-center justify-between rounded-2xl px-4 transition-all duration-300 md:px-5', scrolled ? 'glass h-14 shadow-lg shadow-indigo-500/5' : 'h-16')}>
        <Link href="/" aria-label="Evalix home"><Logo size={28} /></Link>
        <nav className="hidden items-center gap-1 text-sm font-medium text-muted lg:flex">
          {LINKS.map(([h, l]) => <a key={h} href={h} className="rounded-lg px-3 py-2 transition hover:bg-brand-50 hover:text-ink">{l}</a>)}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/login" className="brand-gradient hidden h-10 items-center gap-2 rounded-xl px-5 text-sm font-semibold text-white shadow-md shadow-indigo-500/25 transition hover:shadow-lg sm:inline-flex">Login <ArrowRight className="h-4 w-4" /></Link>
          <button className="grid h-10 w-10 cursor-pointer place-items-center rounded-xl hover:bg-brand-50 lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu" aria-expanded={open}>{open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
        </div>
      </div>
      <motion.div className="brand-gradient absolute bottom-0 left-0 right-0 h-0.5 origin-left" style={{ scaleX: progress }} />
      <AnimatePresence>
        {open && (
          <motion.nav initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="glass mx-auto mt-2 max-w-7xl rounded-2xl p-2 shadow-xl lg:hidden">
            {LINKS.map(([h, l]) => <a key={h} href={h} onClick={() => setOpen(false)} className="block rounded-xl px-4 py-3 font-medium hover:bg-brand-50">{l}</a>)}
            <Link href="/login" className="brand-gradient mt-1 block rounded-xl px-4 py-3 text-center font-semibold text-white">Login</Link>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

export default function Landing() {
  return (
    <div className="overflow-x-clip bg-canvas">
      <Nav />
      <Hero />
      <Marquee />
      <Problem />
      <Features />

      <section id="ai-demo" className="relative overflow-hidden py-24">
        <div className="blob -left-24 top-20 h-80 w-80 bg-indigo-200" />
        <div className="relative mx-auto max-w-7xl px-4 md:px-8">
          <SectionTitle eyebrow="Interactive demo" title="Watch the AI" accent="catch cheating" sub="Pick a situation and see what the AI sees, what it decides, and what happens next. Real exams work the same way with the student’s webcam." />
          <Reveal className="mt-12"><AIDemo /></Reveal>
        </div>
      </section>

      <HowItWorks />
      <ResumeTracking />
      <Market />

      <section className="px-4 pb-24 md:px-8">
        <Reveal>
          <div className="brand-gradient relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] px-6 py-16 text-center text-white shadow-2xl shadow-indigo-500/30 md:px-16">
            <div className="grid-lines absolute inset-0 opacity-20" />
            <div className="float-slow absolute -left-10 -top-10 h-48 w-48 rounded-full bg-white/10" />
            <div className="float-slower absolute -bottom-16 right-10 h-64 w-64 rounded-full bg-white/10" />
            <div className="relative">
              <ScanFace className="mx-auto h-12 w-12 opacity-90" />
              <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-extrabold md:text-5xl">Building a fair academic future, one secure exam at a time.</h2>
              <p className="mx-auto mt-4 max-w-xl text-white/80">To become the most trusted and intelligent examination platform — fairness, security and excellence in every evaluation.</p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Link href="/login" className="group inline-flex h-12 items-center gap-2 rounded-2xl bg-white px-6 font-semibold text-brand-700 shadow-lg transition hover:shadow-xl">Try the live demo <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></Link>
                <a href="#ai-demo" className="glass-dark inline-flex h-12 items-center rounded-2xl px-6 font-semibold transition hover:bg-white/20">Replay the AI demo</a>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-line bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-[1.5fr_1fr_1fr] md:px-8">
          <div>
            <Logo size={26} />
            <p className="mt-3 max-w-sm text-sm text-muted">Smart AI-powered evaluation platform. Secure. Intelligent. Fair.</p>
          </div>
          <div className="text-sm">
            <p className="font-semibold">Product</p>
            {LINKS.slice(0, 4).map(([h, l]) => <a key={h} href={h} className="mt-2 block text-muted hover:text-ink">{l}</a>)}
          </div>
          <div className="text-sm">
            <p className="font-semibold">Built by</p>
            <p className="mt-2 font-medium">Chirag Luhach</p>
            <p className="text-muted">B.Tech CSE (Full Stack)</p>
            <p className="text-muted">Manav Rachna University</p>
          </div>
        </div>
        <p className="border-t border-line py-5 text-center text-xs text-muted">© {new Date().getFullYear()} Evalix. All rights reserved.</p>
      </footer>
    </div>
  );
}
