import { NextResponse } from 'next/server'
import {
  ADMIN_COOKIE_NAME,
  clearAdminSessionCookieOptions,
} from '@/lib/admin-auth-server'

export async function POST() {
  const response = NextResponse.json({ success: true })
  response.cookies.set(ADMIN_COOKIE_NAME, '', clearAdminSessionCookieOptions())
  return response
}
