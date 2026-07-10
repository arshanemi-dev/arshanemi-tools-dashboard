'use client';

import { LogOut } from 'lucide-react';
import UserMenu from './UserMenu';

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
         {user ? (
                <UserMenu user={user} onLogout={() => setUser(null)} />
              ) : (
                <>
                  <Button href="/login" variant="outline" size="sm" className="hidden sm:inline-flex">
                    Login
                  </Button>
                  <Button href="/contact" size="sm" className="hidden sm:inline-flex">
                    Get Free Audit
                  </Button>
                </>
              )}
        </div>
      </nav>
    </header>
  );
}
