import type { User } from '@supabase/supabase-js'
import { getSupabaseAuthClient } from '@/lib/supabase-auth'

export type AuthResult =
  | { ok: true; user: User; token: string }
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

  const supabaseAuth = getSupabaseAuthClient()
  if (!supabaseAuth) {
    return { ok: false, message: 'Supabase 未配置', status: 503 }
  }

  const { data: { user }, error } = await supabaseAuth.auth.getUser(token)
  if (error || !user) {
    return { ok: false, message: '登录已过期，请重新登录', status: 401 }
  }

  return { ok: true, user, token }
}
