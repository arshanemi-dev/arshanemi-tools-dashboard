'use client';

import { LogOut } from 'lucide-react';

function roleLabel(role) {
  if (!role) return 'Member';
  return role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function DashboardTopbar({ user, onLogout, loggingOut }) {
  const name = user?.name || 'there';
  const initial = name.charAt(0).toUpperCase() || '?';

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-divider bg-background/70 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <a href="#top" className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-foreground">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-cyan text-sm">
            ⚡
          </span>
          Arshanemi<span className="gradient-text">Tools</span>
        </a>

        <div className="flex items-center gap-3">
          <div className="hidden items-center gap-2.5 border-r border-divider pr-3 sm:flex">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-accent to-cyan text-xs font-bold text-background">
              {initial}
            </span>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-foreground">{name}</p>
              <p className="text-[11px] text-subtle">{roleLabel(user?.role)}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onLogout}
            disabled={loggingOut}
            className="inline-flex items-center gap-1.5 rounded-full border border-divider px-4 py-2 text-sm font-semibold text-muted transition-colors hover:border-divider-light hover:text-foreground disabled:opacity-60"
          >
            <LogOut size={14} />
            {loggingOut ? 'Signing out…' : 'Log Out'}
          </button>
        </div>
      </nav>
    </header>
  );
}
