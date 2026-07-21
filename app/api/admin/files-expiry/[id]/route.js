import { NextResponse } from 'next/server'
import { getAdminFromRequest } from '@/lib/auth'
import { editOneFilesExpiry } from '@/lib/db'
import { IS_CONNECT, proxyAdminCall } from '@/lib/connect'

export async function PATCH(req, { params }) {
  const admin = await getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { name, expiryAt } = body

  if (!name && !expiryAt) {
    return NextResponse.json({ error: 'Provide name or expiryAt to update' }, { status: 400 })
  }

  if (IS_CONNECT) {
    const { status, data } = await proxyAdminCall(`/api/admin/files-expiry/${id}`, { method: 'PATCH', body: { name, expiryAt } })
    return NextResponse.json(data, { status })
  }

  const updated = await editOneFilesExpiry(id, { name, expiryAt })
  return NextResponse.json({ record: updated })
}
