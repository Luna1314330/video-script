import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET } from '@/app/api/auth/me/route'
import { readJsonResponse } from '../helpers/http'

vi.mock('@/lib/auth-server', () => ({
  isJwtConfigured: vi.fn(),
  verifyAccessToken: vi.fn(),
}))

vi.mock('@/lib/db/index', () => ({
  getDb: vi.fn(),
  isActiveFlag: (value: number | boolean) => value === 1 || value === true,
}))

import { isJwtConfigured, verifyAccessToken } from '@/lib/auth-server'
import { getDb } from '@/lib/db/index'

function authRequest(token?: string) {
  return new Request('http://localhost/api/auth/me', {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
}

function mockDb(profile: unknown, membership: unknown) {
  return {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi
            .fn()
            .mockResolvedValueOnce(profile ? [profile] : [])
            .mockResolvedValueOnce(membership ? [membership] : []),
        }),
      }),
    }),
  } as never
}

describe('GET /api/auth/me', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(isJwtConfigured).mockReturnValue(true)
  })

  it('未登录返回 401', async () => {
    const res = await GET(authRequest() as never)
    const { status, body } = await readJsonResponse(res)

    expect(status).toBe(401)
    expect(body.error).toBe('未登录')
  })

  it('token 过期返回 401', async () => {
    vi.mocked(verifyAccessToken).mockResolvedValue(null)

    const res = await GET(authRequest('bad-token') as never)
    const { status, body } = await readJsonResponse(res)

    expect(status).toBe(401)
    expect(body.error).toMatch(/登录已过期/)
  })

  it('账号被禁用返回 403', async () => {
    vi.mocked(verifyAccessToken).mockResolvedValue({
      userId: 'user-1',
      phone: '13800138000',
    })
    vi.mocked(getDb).mockReturnValue(
      mockDb(
        { phone: '13800138000', nickname: '测试', isActive: 0 },
        null,
      ),
    )

    const res = await GET(authRequest('token') as never)
    const { status, body } = await readJsonResponse(res)

    expect(status).toBe(403)
    expect(body.error).toBe('账号已被禁用')
  })

  it('有效会员返回 active 状态', async () => {
    const future = new Date(Date.now() + 86400000).toISOString().slice(0, 19).replace('T', ' ')

    vi.mocked(verifyAccessToken).mockResolvedValue({
      userId: 'user-1',
      phone: '13800138000',
    })
    vi.mocked(getDb).mockReturnValue(
      mockDb(
        { phone: '13800138000', nickname: '会员用户', isActive: 1 },
        {
          status: 'active',
          planType: 'monthly',
          startsAt: '2024-01-01 00:00:00',
          expiresAt: future,
        },
      ),
    )

    const res = await GET(authRequest('token') as never)
    const { status, body } = await readJsonResponse<{
      user: { membership: { status: string; plan_type: string } }
    }>(res)

    expect(status).toBe(200)
    expect(body.user.membership.status).toBe('active')
    expect(body.user.membership.plan_type).toBe('monthly')
  })

  it('无会员记录时返回 free 状态', async () => {
    vi.mocked(verifyAccessToken).mockResolvedValue({
      userId: 'user-1',
      phone: '13800138000',
    })
    vi.mocked(getDb).mockReturnValue(
      mockDb({ phone: '13800138000', nickname: '普通用户', isActive: 1 }, null),
    )

    const res = await GET(authRequest('token') as never)
    const { status, body } = await readJsonResponse<{
      user: { membership: { status: string } }
    }>(res)

    expect(status).toBe(200)
    expect(body.user.membership.status).toBe('free')
  })
})
