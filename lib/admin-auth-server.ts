import { createHmac, timingSafeEqual } from 'crypto'
import type { NextRequest, NextResponse } from 'next/server'
import { NextResponse as NR } from 'next/server'

export const ADMIN_COOKIE_NAME = 'admin_session'

const ADMIN_USERNAME = process.env.ADMIN_USERNAME ?? 'admin'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? '19910113'
const SESSION_SECRET = process.env.ADMIN_SESSION_SECRET ?? 'script-workshop-admin-session'

const SESSION_MAX_AGE_SEC = 60 * 60 * 24 * 7

export function verifyAdminCredentials(username: string, password: string): boolean {
  const user = username.trim()
  const pass = password
  if (user.length !== ADMIN_USERNAME.length || pass.length !== ADMIN_PASSWORD.length) {
    return false
  }
  try {
    const userOk = timingSafeEqual(Buffer.from(user), Buffer.from(ADMIN_USERNAME))
    const passOk = timingSafeEqual(Buffer.from(pass), Buffer.from(ADMIN_PASSWORD))
    return userOk && passOk
  } catch {
    return false
  }
}

function signSessionPayload(payload: string): string {
  return createHmac('sha256', SESSION_SECRET).update(payload).digest('hex')
}

export function createAdminSessionToken(): string {
  const expiresAt = Date.now() + SESSION_MAX_AGE_SEC * 1000
  const payload = `${ADMIN_USERNAME}:${expiresAt}`
  return `${payload}.${signSessionPayload(payload)}`
}

export function verifyAdminSessionToken(token: string | undefined | null): boolean {
  if (!token) return false
  const dot = token.lastIndexOf('.')
  if (dot <= 0) return false

  const payload = token.slice(0, dot)
  const sig = token.slice(dot + 1)
  if (!payload.startsWith(`${ADMIN_USERNAME}:`)) return false

  const expected = signSessionPayload(payload)
  if (expected.length !== sig.length) return false

  try {
    if (!timingSafeEqual(Buffer.from(expected), Buffer.from(sig))) return false
  } catch {
    return false
  }

  const expiresAt = Number(payload.split(':')[1])
  return Number.isFinite(expiresAt) && expiresAt > Date.now()
}

export function adminSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: shouldUseSecureAdminCookie(),
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_MAX_AGE_SEC,
  }
}

export function clearAdminSessionCookieOptions() {
  return {
    ...adminSessionCookieOptions(),
    maxAge: 0,
  }
}

/** HTTP 部署（如 http://IP）须为 false；HTTPS 可 true 或通过 APP_URL=https://... 自动启用 */
function shouldUseSecureAdminCookie(): boolean {
  if (process.env.ADMIN_COOKIE_SECURE === 'true') return true
  if (process.env.ADMIN_COOKIE_SECURE === 'false') return false

  const appUrl = process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? ''
  return appUrl.startsWith('https://')
}

export function requireAdminApi(request: NextRequest): NextResponse | null {
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value
  if (verifyAdminSessionToken(token)) return null
  return NR.json({ success: false, error: '未授权，请先登录后台' }, { status: 401 })
}

export function hasValidAdminSession(request: NextRequest): boolean {
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value
  return verifyAdminSessionToken(token)
}
