import { NextResponse } from 'next/server'
import { getStaffFromRequest } from '@/lib/auth'
import { getAllUserSettingsMap, upsertUserToolsAccess, getAllUsers } from '@/lib/db'
import { IS_CONNECT, proxyAdminCall } from '@/lib/connect'

// proxyAdminCall always authenticates as the service-level ADMIN_API_TOKEN
// (master_admin), so root's response is never pre-scoped by company — this
// re-derives the same allowlist locally in connected mode too, just sourcing
// the user list from root instead of the local `users` table.
async function allowedUserIds(staff) {
  if (staff.role !== 'admin') return null // null = no restriction (master_admin)
  if (IS_CONNECT) {
    const { data } = await proxyAdminCall('/api/admin/users')
    const users = Array.isArray(data) ? data : []
    return new Set(users.filter((u) => u.companyId === staff.companyId && u.role === 'user').map((u) => u.id))
  }
  const companyUsers = await getAllUsers({ companyId: staff.companyId, role: 'user' })
  return new Set(companyUsers.map((u) => u.id))
}

export async function GET(req) {
  const staff = await getStaffFromRequest(req)
  if (!staff) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (IS_CONNECT) {
    const { status, data } = await proxyAdminCall('/api/admin/user-settings')
    const allowed = await allowedUserIds(staff)
    if (!allowed) return NextResponse.json(data, { status })
    const scoped = {}
    for (const [userId, access] of Object.entries(data ?? {})) {
      if (allowed.has(userId)) scoped[userId] = access
    }
    return NextResponse.json(scoped, { status })
  }

  const map = await getAllUserSettingsMap()
  const allowed = await allowedUserIds(staff)
  if (!allowed) return NextResponse.json(map)

  const scoped = {}
  for (const [userId, access] of Object.entries(map)) {
    if (allowed.has(userId)) scoped[userId] = access
  }
  return NextResponse.json(scoped)
}

// Bulk save — body is { [userId]: toolSlug[] }; each entry upserts one user_settings row.
export async function PUT(req) {
  const staff = await getStaffFromRequest(req)
  if (!staff) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const access = await req.json()
  const allowed = await allowedUserIds(staff)
  const entries = Object.entries(access).filter(([userId]) => !allowed || allowed.has(userId))

  if (IS_CONNECT) {
    const { status, data } = await proxyAdminCall('/api/admin/user-settings', {
      method: 'PUT',
      body: Object.fromEntries(entries),
    })
    return NextResponse.json(data, { status })
  }

  await Promise.all(entries.map(([userId, toolsAccess]) => upsertUserToolsAccess(userId, toolsAccess)))
  return NextResponse.json(Object.fromEntries(entries))
}
