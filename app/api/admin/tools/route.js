import { NextResponse } from 'next/server'
import { revalidateTag, revalidatePath } from 'next/cache'
import { getAdminFromRequest, getStaffFromRequest } from '@/lib/auth'
import { getAllToolsFromDB, createTool } from '@/lib/db'
import { IS_CONNECT, proxyAdminCall } from '@/lib/connect'

// Read is shared with the company-scoped 'admin' role (needed for the Tools
// Access grid); creating/editing the tool catalog itself stays master-only.
export async function GET(req) {
  const staff = await getStaffFromRequest(req)
  if (!staff) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  if (IS_CONNECT) {
    const { status, data } = await proxyAdminCall('/api/admin/tools')
    return NextResponse.json(data, { status })
  }

  const tools = await getAllToolsFromDB()
  return NextResponse.json(tools)
}

export async function POST(req) {
  const admin = await getAdminFromRequest(req)
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const data = await req.json()

  if (IS_CONNECT) {
    const { status, data: resData } = await proxyAdminCall('/api/admin/tools', { method: 'POST', body: data })
    if (status < 300) {
      revalidateTag('tools')
      revalidatePath('/', 'layout')
      revalidatePath('/tools')
    }
    return NextResponse.json(resData, { status })
  }

  const tool = await createTool(data)
  revalidateTag('tools')
  revalidatePath('/', 'layout')
  revalidatePath('/tools')
  return NextResponse.json(tool, { status: 201 })
}
