/** 浏览器端登录态（与 /api/auth/login 写入的 key 一致） */

const ACCESS_TOKEN_KEY = 'sb-access-token'
const REFRESH_TOKEN_KEY = 'sb-refresh-token'
const USER_KEY = 'user'

export const AUTH_EXPIRED_MESSAGE = '登录已过期，请重新登录'

let handlingAuthExpired = false

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getAuthHeaders(): HeadersInit {
  const token = getAccessToken()
  if (!token) return {}
  return { Authorization: `Bearer ${token}` }
}

export function isLoggedIn(): boolean {
  return Boolean(getAccessToken())
}

export function clearAuthSession(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function isAuthExpiredMessage(message: string | null | undefined): boolean {
  if (!message?.trim()) return false
  return message.includes('登录已过期') || message.includes('登录已失效')
}

/** 401 且本地仍有 token 时，视为登录失效并跳转首页 */
export function shouldForceLogoutOn401(
  status: number,
  message: string | null | undefined,
): boolean {
  if (status !== 401 || !getAccessToken()) return false
  if (isAuthExpiredMessage(message)) return true
  const text = message?.trim() || ''
  return (
    text.includes('未登录') ||
    text.includes('未授权') ||
    text.includes('无效的认证') ||
    text.includes('用户验证失败') ||
    text.includes('请先登录')
  )
}

export function handleAuthExpired(): void {
  if (typeof window === 'undefined') return
  if (handlingAuthExpired) return
  handlingAuthExpired = true

  clearAuthSession()
  window.location.replace('/')
}

export function handleAuthExpiredFromResponse(
  status: number,
  payload?: { error?: string; message?: string } | null,
): boolean {
  const message = payload?.error || payload?.message
  if (!shouldForceLogoutOn401(status, message)) return false
  handleAuthExpired()
  return true
}

/** 带登录态的请求；401 登录失效时自动清缓存并跳转首页 */
export async function authFetch(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  const res = await fetch(input, init)

  if (res.status === 401 && getAccessToken()) {
    let payload: { error?: string; message?: string } | null = null
    try {
      payload = (await res.clone().json()) as { error?: string; message?: string }
    } catch {
      payload = null
    }
    handleAuthExpiredFromResponse(401, payload)
  }

  return res
}

export function saveAuthSession(input: {
  token: string
  refreshToken?: string
  user: unknown
}): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(ACCESS_TOKEN_KEY, input.token)
  if (input.refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, input.refreshToken)
  }
  localStorage.setItem(USER_KEY, JSON.stringify(input.user))
}
