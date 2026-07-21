'use client'
import { usePathname } from 'next/navigation'
import { ChevronRight, ExternalLink } from 'lucide-react'
import UserMenu from '@/components/dashboard/UserMenu'

function buildBreadcrumb(pathname) {
  const parts = pathname.replace('/settings', '').split('/').filter(Boolean)
  if (!parts.length) return [{ label: 'Dashboard', href: '/settings' }]
  const crumbs = [{ label: 'Dashboard', href: '/settings' }]
  let path = '/settings'
  parts.forEach((p) => {
    path += `/${p}`
    const label = p.charAt(0).toUpperCase() + p.slice(1).replace(/-/g, ' ')
    crumbs.push({ label, href: path })
  })
  return crumbs
}

export default function Topbar({ username, email, role }) {
  const pathname = usePathname()
  const crumbs = buildBreadcrumb(pathname)

  return (
    <header className="flex-shrink-0 h-14 bg-card border-b border-divider flex items-center px-6 gap-4 z-10">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 flex-1 min-w-0">
        {crumbs.map((crumb, i) => (
          <span key={crumb.href} className="flex items-center gap-1.5 min-w-0">
            {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-subtle flex-shrink-0" />}
            <span className={`text-sm truncate ${
              i === crumbs.length - 1
                ? 'font-semibold text-foreground'
                : 'text-subtle hover:text-muted cursor-pointer'
            }`}>
              {crumb.label}
            </span>
          </span>
        ))}
      </nav>

      {/* Right side */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Plain 'user' role has no sidebar, so no "View Website" link to
            find otherwise — surface it here instead. Plain <a>, not
            next/link — hard navigation back to the public site on purpose
            (see Sidebar.jsx's "View Website" for the same reasoning). */}
        {role === 'user' && (
          <a
            href="/"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-muted hover:bg-surface hover:text-foreground border border-divider transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Main Site
          </a>
        )}

        {/* Same profile menu as the public dashboard header (Profile/Settings/Logout) */}
        <UserMenu user={{ name: username || 'Admin', email, role }} />
      </div>
    </header>
  )
}
