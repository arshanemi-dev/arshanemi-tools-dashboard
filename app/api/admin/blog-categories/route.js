import { NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import { getCollection, createItem } from '@/lib/db'
import { IS_CONNECT, proxyAdminCall } from '@/lib/connect'

export async function GET() {
  if (IS_CONNECT) {
    const { status, data } = await proxyAdminCall('/api/admin/blog-categories')
    return NextResponse.json(data, { status })
  }
  const categories = await getCollection('blog-categories')
  return NextResponse.json(categories)
}

export async function POST(req) {
  const body = await req.json()

  if (IS_CONNECT) {
    const { status, data } = await proxyAdminCall('/api/admin/blog-categories', { method: 'POST', body })
    if (status < 300) revalidateTag('blog-categories')
    return NextResponse.json(data, { status })
  }

  const category = await createItem('blog-categories', body)
  revalidateTag('blog-categories')
  return NextResponse.json(category, { status: 201 })
}
