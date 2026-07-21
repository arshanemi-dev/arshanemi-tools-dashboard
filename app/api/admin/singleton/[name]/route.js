import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { getSingleton, updateSingleton } from '@/lib/db'
import { IS_CONNECT, proxyAdminCall } from '@/lib/connect'

export async function GET(req, { params }) {
  const { name } = await params
  if (IS_CONNECT) {
    const { status, data } = await proxyAdminCall(`/api/admin/singleton/${name}`)
    return NextResponse.json(data, { status })
  }
  const data = await getSingleton(name)
  return NextResponse.json(data)
}

export async function PUT(req, { params }) {
  const { name } = await params
  const body = await req.json()

  if (IS_CONNECT) {
    const { status, data } = await proxyAdminCall(`/api/admin/singleton/${name}`, { method: 'PUT', body })
    if (status < 300) revalidateTag(name)
    return NextResponse.json(data, { status })
  }

  const updated = await updateSingleton(name, body)
  revalidateTag(name)
  return NextResponse.json(updated)
}
