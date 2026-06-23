import { verifyAccessToken, isJwtConfigured } from '@/lib/auth-server'

export type AuthUser = {
  id: string
  phone?: string
  nickname?: string
}

export type AuthResult =
  | { ok: true; user: AuthUser; token: string }
  | { ok: false; message: string; status: number }

export function getBearerToken(request: Request): string | null {
  const header = request.headers.get('authorization')
  if (!header) return null
  const match = header.match(/^Bearer\s+(.+)$/i)
  return match?.[1]?.trim() || null
}

export async function requireAuthUser(request: Request): Promise<AuthResult> {
  const token = getBearerToken(request)
  if (!token) {
    return { ok: false, message: '请先登录后再生成脚本', status: 401 }
  }

  if (!isJwtConfigured()) {
    return { ok: false, message: '认证未配置', status: 503 }
  }

  const payload = await verifyAccessToken(token)
  if (!payload) {
    return { ok: false, message: '登录已过期，请重新登录', status: 401 }
  }

  return {
    ok: true,
    user: { id: payload.userId, phone: payload.phone },
    token,
  }
}
