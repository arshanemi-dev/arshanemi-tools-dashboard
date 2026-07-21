// Connected-mode proxy helpers. See CONNECT_MODE.md / .env.example for the full
// story. NEXT_PUBLIC_IS_CONNECT toggles whether /api/auth/* and /api/admin/* read
// and write against the root admin panel (arshanemi-admin-pannels) instead of this
// app's own local Supabase — mirrors tools/arshanemi-tools-1's identical flag.
export const IS_CONNECT = process.env.NEXT_PUBLIC_IS_CONNECT === 'true'

const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_API_URL || ''

// Server-to-server admin CRUD calls (companies/users/tools/blogs/theme/generic
// collections & singletons). Uses the static ADMIN_API_TOKEN service credential,
// NOT the visiting user's own session token — root's /api/admin/* routes require a
// master_admin token, and this app's own JWT can't be verified by root anyway (see
// .env.example for the JWT_SECRET-sharing note that auth proxying relies on
// instead). Same credential model as tools-1's app/api/files-expiry/route.js.
export async function proxyAdminCall(path, { method = 'GET', body } = {}) {
  const res = await fetch(`${ADMIN_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.ADMIN_API_TOKEN ?? ''}`,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  })
  const data = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, data }
}

// Pulls the caller's own bearer/cookie token off an incoming request so it can
// be forwarded as this same identity's Authorization header on the outbound
// call to root — same priority order as lib/auth.js's getAuthPayload (Bearer
// header, then the arshanemi-token/admin-token cookies), since cookies don't
// cross origins on a server-to-server fetch.
export function authHeaderFrom(req) {
  const bearer = req.headers.get('Authorization')
  if (bearer?.startsWith('Bearer ')) return bearer
  const token = req.cookies.get('arshanemi-token')?.value || req.cookies.get('admin-token')?.value
  return token ? `Bearer ${token}` : undefined
}

// Auth calls (login/refresh/me/change-password/...) — forwards the request as-is
// and returns root's response verbatim, so root's accessToken/refreshToken/user
// pass straight through to the browser unchanged. `authHeader` forwards the
// caller's own bearer token for already-authenticated calls (me, change-password).
export async function proxyAuthCall(path, { method = 'POST', body, authHeader } = {}) {
  const res = await fetch(`${ADMIN_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(authHeader ? { Authorization: authHeader } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  })
  const data = await res.json().catch(() => ({}))
  return { status: res.status, data }
}
