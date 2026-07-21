import { NextResponse } from 'next/server'
import { revalidateTag, revalidatePath } from 'next/cache'
import { getItem, updateItem, deleteItem } from '@/lib/db'
import { deleteImage } from '@/lib/upload'
import { IS_CONNECT, proxyAdminCall } from '@/lib/connect'

const IMAGE_FIELDS = {
  team: ['photo'],
  testimonials: ['avatar'],
  'case-studies': ['image'],
  partners: ['url'],
  blogs: ['image'],
}

const NO_CACHE = { 'Cache-Control': 'no-store, no-cache, must-revalidate' }

// Revalidates every public page that renders services or industries so changes appear
// immediately without waiting for the 1-hour ISR TTL to expire.
// Called after any create/update/delete on these collections.
function revalidatePublicPages(collection, item) {
  if (collection === 'services') {
    revalidatePath('/', 'layout')
    revalidatePath('/')
    revalidatePath('/services')
    if (item?.slug) revalidatePath(`/services/${item.slug}`)
  } else if (collection === 'industries') {
    revalidatePath('/', 'layout')
    revalidatePath('/')
    revalidatePath('/industries')
    if (item?.slug) revalidatePath(`/industries/${item.slug}`)
  } else if (collection === 'case-studies') {
    revalidatePath('/case-studies')
    const slug = item?.slug || (item?.title ? item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') : null)
    if (slug) revalidatePath(`/case-studies/${slug}`)
  }
}

export async function GET(req, { params }) {
  const { collection, id } = await params
  if (IS_CONNECT) {
    const { status, data } = await proxyAdminCall(`/api/admin/${collection}/${id}`)
    return NextResponse.json(data, { status, headers: NO_CACHE })
  }
  const item = await getItem(collection, id)
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(item, { headers: NO_CACHE })
}

export async function PUT(req, { params }) {
  const { collection, id } = await params
  const body = await req.json()

  if (IS_CONNECT) {
    const { status, data } = await proxyAdminCall(`/api/admin/${collection}/${id}`, { method: 'PUT', body })
    if (status < 300) {
      revalidateTag(collection)
      revalidatePublicPages(collection, data)
    }
    return NextResponse.json(data, { status, headers: NO_CACHE })
  }

  const updated = await updateItem(collection, id, body)
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  revalidateTag(collection)
  revalidatePublicPages(collection, updated)
  return NextResponse.json(updated, { headers: NO_CACHE })
}

export async function DELETE(req, { params }) {
  const { collection, id } = await params

  if (IS_CONNECT) {
    // No local record to read image fields off of — the item lives on root
    // now, and any images it references belong to root's blob store, not
    // this app's. Skip blob cleanup; just proxy the delete.
    const { status, data } = await proxyAdminCall(`/api/admin/${collection}/${id}`, { method: 'DELETE' })
    if (status < 300) {
      revalidateTag(collection)
      revalidatePublicPages(collection, null)
    }
    return NextResponse.json(data, { status, headers: NO_CACHE })
  }

  const item = await getItem(collection, id)
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Clean up Vercel Blob images before deletion
  const fields = IMAGE_FIELDS[collection] || []
  for (const field of fields) {
    if (item[field]) await deleteImage(item[field])
  }

  await deleteItem(collection, id)
  revalidateTag(collection)
  revalidatePublicPages(collection, item)
  return NextResponse.json({ ok: true }, { headers: NO_CACHE })
}
