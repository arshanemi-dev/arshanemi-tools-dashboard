'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { isLoggedIn, getStoredUser, authFetch, clearAuthTokens } from '@/lib/tokenStore';
import { useCountUp } from '@/hooks/useCountUp';
import DashboardTopbar from '@/components/dashboard/DashboardTopbar';
import BottomMenu from '@/components/dashboard/BottomMenu';
import ToolCard from '@/components/dashboard/ToolCard';

const HEADER_HIDDEN = process.env.NEXT_PUBLIC_IS_Header_Hide === 'true';
const BOTTOM_MENU_SHOWN = process.env.NEXT_PUBLIC_IS_Bottom_Menu === 'true';

function StatTile({ label, value, delay = 0 }) {
  const count = useCountUp(typeof value === 'number' ? value : 0, 1200, typeof value === 'number');
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="rounded-2xl border border-divider bg-card/60 px-5 py-8 text-center"
    >
      <div className="gradient-text text-3xl font-extrabold sm:text-4xl">
        {typeof value === 'number' ? count : value}
      </div>
      <div className="mt-2 text-sm text-muted">{label}</div>
    </motion.div>
  );
}

export default function HomePage() {
  const router = useRouter();
  const [authStatus, setAuthStatus] = useState('checking'); // checking | authed
  const [user, setUser] = useState(null);
  const [tools, setTools] = useState([]);
  const [status, setStatus] = useState('loading'); // loading | ready | empty | error
  const [errorMessage, setErrorMessage] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace('/login');
      return;
    }
    setUser(getStoredUser());
    setAuthStatus('authed');
  }, [router]);

  const loadTools = useCallback(async () => {
    setStatus('loading');
    setErrorMessage('');
    try {
      const res = await authFetch('/api/tools/my');
      if (res.status === 401) {
        clearAuthTokens();
        router.replace('/login');
        return;
      }
      if (!res.ok) {
        setStatus('error');
        setErrorMessage('The server returned an unexpected error. Please try again.');
        return;
      }
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setTools(list);
      setStatus(list.length ? 'ready' : 'empty');
    } catch {
      setStatus('error');
      setErrorMessage('Network error — check your connection and retry.');
    }
  }, [router]);

  useEffect(() => {
    if (authStatus === 'authed') loadTools();
  }, [authStatus, loadTools]);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      clearAuthTokens();
      window.location.href = '/login';
    }
  }

  const categories = useMemo(
    () => new Set(tools.map((t) => t.category).filter(Boolean)),
    [tools]
  );
  const firstName = (user?.name || 'there').split(' ')[0];
  const roleLabel = user?.role ? user.role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Member';

  if (authStatus !== 'authed') {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div id="top" className="min-h-screen bg-background">
      {!HEADER_HIDDEN && <DashboardTopbar user={user} onLogout={handleLogout} loggingOut={loggingOut} />}
      {BOTTOM_MENU_SHOWN && <BottomMenu user={user} />}

      <main className={HEADER_HIDDEN ? '' : 'pt-16'}>
        {/* HERO */}
        <section className="relative mx-auto max-w-7xl overflow-hidden px-5 pb-24 pt-20 text-center sm:px-8 sm:pb-32 sm:pt-28">
          <div className="hero-blob pointer-events-none absolute inset-x-0 top-0 -z-10 h-[32rem]" />

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-divider bg-card/60 px-4 py-1.5 text-xs text-muted sm:text-sm"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
            </span>
            {status === 'ready' ? `${tools.length} tool${tools.length === 1 ? '' : 's'} ready to launch` : 'Loading your tools…'}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl"
          >
            Welcome back,<br />
            <span className="gradient-text">{firstName}</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.16 }}
            className="mx-auto mt-6 max-w-xl text-base text-muted sm:text-lg"
          >
            Open any tool you&apos;ve been granted, in one click.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24 }}
            className="mt-10"
          >
            <a
              href="#tools"
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-accent to-cyan px-7 py-3.5 font-semibold text-background shadow-lg shadow-accent/30 transition-shadow hover:shadow-cyan/30"
            >
              Browse My Tools
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </a>
          </motion.div>
        </section>

        {/* MARQUEE */}
        {status === 'ready' && (
          <section className="ticker-fade overflow-hidden border-y border-divider bg-card/20 py-4">
            <div className="ticker-track flex w-max whitespace-nowrap">
              {[...tools, ...tools].map((t, i) => (
                <span key={`${t.slug}-${i}`} className="mx-8 inline-flex items-center gap-2 text-sm font-medium text-muted">
                  <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-br from-accent to-cyan" />
                  {t.title}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* STATS */}
        <section className="mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-28">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <StatTile label="Tools Available to You" value={tools.length} />
            <StatTile label="Categories" value={categories.size} delay={0.09} />
            <StatTile label="Account Type" value={roleLabel} delay={0.18} />
          </div>
        </section>

        {/* TOOLS */}
        <section id="tools" className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-16">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <span className="text-sm font-semibold uppercase tracking-wide text-accent">Your Toolkit</span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-5xl">Tools granted to your account</h2>
            <p className="mt-4 text-muted">Every card below opens instantly in a new tab.</p>
          </div>

          {status === 'loading' && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-64 animate-pulse rounded-2xl border border-divider bg-card/40" />
              ))}
            </div>
          )}

          {status === 'error' && (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-6 py-16 text-center">
              <p className="font-semibold text-foreground">Couldn&apos;t load your tools</p>
              <p className="mt-2 text-sm text-muted">{errorMessage}</p>
              <button
                type="button"
                onClick={loadTools}
                className="mt-6 inline-flex items-center gap-2 rounded-full border border-divider px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-divider-light"
              >
                <RefreshCw size={14} /> Try Again
              </button>
            </div>
          )}

          {status === 'empty' && (
            <div className="rounded-2xl border border-divider bg-card/40 px-6 py-16 text-center">
              <p className="font-semibold text-foreground">No tools are assigned to your account yet</p>
              <p className="mt-2 text-sm text-muted">Ask an admin to grant you access from Admin → Settings.</p>
            </div>
          )}

          {status === 'ready' && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {tools.map((tool, i) => (
                <ToolCard key={tool.slug} tool={tool} index={i} />
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="border-t border-divider py-6 text-center text-xs text-subtle">
        © {new Date().getFullYear()} Arshanemi Tools. Signed in securely.
      </footer>
    </div>
  );
}
