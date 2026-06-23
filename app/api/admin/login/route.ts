import { NextRequest, NextResponse } from 'next/server'
import {
  ADMIN_COOKIE_NAME,
  adminSessionCookieOptions,
  createAdminSessionToken,
  hasValidAdminSession,
  verifyAdminCredentials,
} from '@/lib/admin-auth-server'

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { username?: string; password?: string }
    const username = body.username ?? ''
    const password = body.password ?? ''

    if (!verifyAdminCredentials(username, password)) {
      return NextResponse.json({ success: false, error: '用户名或密码错误' }, { status: 401 })
    }

    const response = NextResponse.json({
      success: true,
      username: 'admin',
    })

    response.cookies.set(ADMIN_COOKIE_NAME, createAdminSessionToken(), adminSessionCookieOptions())

    return response
  } catch {
    return NextResponse.json({ success: false, error: '登录失败' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  if (!hasValidAdminSession(request)) {
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }

  return NextResponse.json({ authenticated: true, username: 'admin' })
}
