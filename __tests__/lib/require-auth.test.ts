import { describe, expect, it, vi } from 'vitest'
import { getBearerToken, requireAuthUser } from '@/lib/require-auth'

vi.mock('@/lib/auth-server', () => ({
  isJwtConfigured: vi.fn(),
  verifyAccessToken: vi.fn(),
}))

import { isJwtConfigured, verifyAccessToken } from '@/lib/auth-server'

describe('getBearerToken', () => {
  it('从 Authorization 头提取 token', () => {
    const request = new Request('http://localhost', {
      headers: { Authorization: 'Bearer my-token-123' },
    })
    expect(getBearerToken(request)).toBe('my-token-123')
  })

  it('无 Authorization 时返回 null', () => {
    expect(getBearerToken(new Request('http://localhost'))).toBeNull()
  })

  it('忽略非 Bearer 格式', () => {
    const request = new Request('http://localhost', {
      headers: { Authorization: 'Basic abc' },
    })
    expect(getBearerToken(request)).toBeNull()
  })
})

describe('requireAuthUser', () => {
  it('未携带 token 时返回 401', async () => {
    const result = await requireAuthUser(new Request('http://localhost'))
    expect(result).toEqual({
      ok: false,
      message: '请先登录后再生成脚本',
      status: 401,
    })
  })

  it('JWT 未配置时返回 503', async () => {
    vi.mocked(isJwtConfigured).mockReturnValue(false)

    const result = await requireAuthUser(
      new Request('http://localhost', {
        headers: { Authorization: 'Bearer token' },
      }),
    )

    expect(result).toEqual({ ok: false, message: '认证未配置', status: 503 })
  })

  it('token 无效时返回 401', async () => {
    vi.mocked(isJwtConfigured).mockReturnValue(true)
    vi.mocked(verifyAccessToken).mockResolvedValue(null)

    const result = await requireAuthUser(
      new Request('http://localhost', {
        headers: { Authorization: 'Bearer bad-token' },
      }),
    )

    expect(result).toEqual({
      ok: false,
      message: '登录已过期，请重新登录',
      status: 401,
    })
  })

  it('token 有效时返回用户信息', async () => {
    vi.mocked(isJwtConfigured).mockReturnValue(true)
    vi.mocked(verifyAccessToken).mockResolvedValue({
      userId: 'user-1',
      phone: '13800138000',
    })

    const result = await requireAuthUser(
      new Request('http://localhost', {
        headers: { Authorization: 'Bearer valid-token' },
      }),
    )

    expect(result).toEqual({
      ok: true,
      user: { id: 'user-1', phone: '13800138000' },
      token: 'valid-token',
    })
  })
})
