import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  AUTH_EXPIRED_MESSAGE,
  clearAuthSession,
  getAccessToken,
  getAuthHeaders,
  handleAuthExpiredFromResponse,
  isAuthExpiredMessage,
  isLoggedIn,
  saveAuthSession,
  shouldForceLogoutOn401,
} from '@/lib/auth-client'

describe('auth-client', () => {
  beforeEach(() => {
    clearAuthSession()
  })

  it('未登录时 isLoggedIn 为 false', () => {
    expect(isLoggedIn()).toBe(false)
    expect(getAccessToken()).toBeNull()
    expect(getAuthHeaders()).toEqual({})
  })

  it('saveAuthSession 写入 token 与用户信息', () => {
    saveAuthSession({
      token: 'test-token',
      refreshToken: 'refresh-token',
      user: { id: 'u1', phone: '13800138000' },
    })

    expect(isLoggedIn()).toBe(true)
    expect(getAccessToken()).toBe('test-token')
    expect(getAuthHeaders()).toEqual({ Authorization: 'Bearer test-token' })
    expect(localStorage.getItem('user')).toContain('13800138000')
  })

  it('clearAuthSession 清除登录态', () => {
    saveAuthSession({ token: 'abc', user: { id: '1' } })
    clearAuthSession()

    expect(isLoggedIn()).toBe(false)
    expect(localStorage.getItem('sb-access-token')).toBeNull()
    expect(localStorage.getItem('user')).toBeNull()
  })
})

describe('auth expired handling', () => {
  beforeEach(() => {
    clearAuthSession()
  })

  it('识别登录过期文案', () => {
    expect(isAuthExpiredMessage(AUTH_EXPIRED_MESSAGE)).toBe(true)
    expect(isAuthExpiredMessage('网络错误')).toBe(false)
  })

  it('401 且本地有 token 时触发强制登出', () => {
    saveAuthSession({ token: 'expired-token', user: { id: '1' } })
    expect(shouldForceLogoutOn401(401, AUTH_EXPIRED_MESSAGE)).toBe(true)
    expect(shouldForceLogoutOn401(401, '未登录')).toBe(true)
    expect(shouldForceLogoutOn401(403, AUTH_EXPIRED_MESSAGE)).toBe(false)
  })

  it('无 token 时不触发强制登出', () => {
    expect(shouldForceLogoutOn401(401, AUTH_EXPIRED_MESSAGE)).toBe(false)
  })

  it('handleAuthExpiredFromResponse 命中后返回 true', () => {
    saveAuthSession({ token: 'expired-token', user: { id: '1' } })
    const replace = vi.fn()
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { replace },
    })

    const handled = handleAuthExpiredFromResponse(401, { error: AUTH_EXPIRED_MESSAGE })

    expect(handled).toBe(true)
    expect(isLoggedIn()).toBe(false)
    expect(replace).toHaveBeenCalledWith('/')
  })
})

describe('auth-client SSR', () => {
  it('服务端环境返回空值', () => {
    const windowBackup = globalThis.window
    // @ts-expect-error simulate SSR
    delete globalThis.window

    expect(getAccessToken()).toBeNull()
    expect(isLoggedIn()).toBe(false)

    globalThis.window = windowBackup
  })
})
