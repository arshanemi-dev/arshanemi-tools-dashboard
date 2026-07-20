'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { isLoggedIn, getStoredUser, clearAuthTokens } from '@/lib/tokenStore'
import { ToastProvider } from '@/components/admin/Toast'
import DashboardTopbar from '@/components/dashboard/DashboardTopbar'
import ProfileContent from '@/components/profile/ProfileContent'

// Public-facing profile page — where the plain 'user' role lands (no
// /settings sidebar for that role by design; see app/settings/layout.js).
// master_admin/admin keep using /settings/profile inside the admin shell.
// Uses the same client-side, localStorage-driven auth check as the tools
// dashboard homepage (app/page.js) so the main header behaves identically.
export default function ProfilePage() {
  const router = useRouter()
  const [authStatus, setAuthStatus] = useState('checking') // checking | authed
  const [user, setUser] = useState(null)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    if (!isLoggedIn()) {
      router.replace('/login')
      return
    }
    setUser(getStoredUser())
    setAuthStatus('authed')
  }, [router])

  async function handleLogout() {
    setLoggingOut(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } finally {
      clearAuthTokens()
      window.location.href = '/login'
    }
  }

  if (authStatus !== 'authed') {
    return <div className="min-h-screen bg-background" />
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardTopbar user={user} onLogout={handleLogout} loggingOut={loggingOut} />
      <main className="pt-16">
        <div className="max-w-5xl mx-auto px-5 sm:px-8 py-10">
          <ToastProvider>
            <ProfileContent />
          </ToastProvider>
        </div>
      </main>
    </div>
  )
}
