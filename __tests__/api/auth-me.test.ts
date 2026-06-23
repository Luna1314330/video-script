import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GET } from '@/app/api/auth/me/route'
import { readJsonResponse } from '../helpers/http'

vi.mock('@/lib/supabase-auth', () => ({
  getSupabaseAuthClient: vi.fn(),
}))

vi.mock('@/lib/supabase-admin', () => ({
  getSupabaseAdmin: vi.fn(),
}))

import { getSupabaseAuthClient } from '@/lib/supabase-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

function authRequest(token?: string) {
  return new Request('http://localhost/api/auth/me', {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
}

describe('GET /api/auth/me', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('未登录返回 401', async () => {
    const res = await GET(authRequest() as never)
    const { status, body } = await readJsonResponse(res)

    expect(status).toBe(401)
    expect(body.error).toBe('未登录')
  })

  it('token 过期返回 401', async () => {
    vi.mocked(getSupabaseAuthClient).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: new Error('expired') }),
      },
    } as never)

    const res = await GET(authRequest('bad-token') as never)
    const { status, body } = await readJsonResponse(res)

    expect(status).toBe(401)
    expect(body.error).toMatch(/登录已过期/)
  })

  it('账号被禁用返回 403', async () => {
    vi.mocked(getSupabaseAuthClient).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-1', user_metadata: {} } },
          error: null,
        }),
      },
    } as never)

    vi.mocked(getSupabaseAdmin).mockReturnValue({
      from: vi.fn().mockImplementation((table: string) => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data:
                table === 'user_profiles'
                  ? { phone: '13800138000', nickname: '测试', is_active: false }
                  : null,
              error: null,
            }),
          }),
        }),
      })),
    } as never)

    const res = await GET(authRequest('token') as never)
    const { status, body } = await readJsonResponse(res)

    expect(status).toBe(403)
    expect(body.error).toBe('账号已被禁用')
  })

  it('有效会员返回 active 状态', async () => {
    const future = new Date(Date.now() + 86400000).toISOString()

    vi.mocked(getSupabaseAuthClient).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-1', user_metadata: { nickname: '会员用户' } } },
          error: null,
        }),
      },
    } as never)

    vi.mocked(getSupabaseAdmin).mockReturnValue({
      from: vi.fn().mockImplementation((table: string) => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data:
                table === 'user_profiles'
                  ? { phone: '13800138000', nickname: '会员用户', is_active: true }
                  : {
                      status: 'active',
                      plan_type: 'monthly',
                      starts_at: '2024-01-01',
                      expires_at: future,
                    },
              error: null,
            }),
          }),
        }),
      })),
    } as never)

    const res = await GET(authRequest('token') as never)
    const { status, body } = await readJsonResponse<{
      user: { membership: { status: string; plan_type: string } }
    }>(res)

    expect(status).toBe(200)
    expect(body.user.membership.status).toBe('active')
    expect(body.user.membership.plan_type).toBe('monthly')
  })

  it('无会员记录时返回 free 状态', async () => {
    vi.mocked(getSupabaseAuthClient).mockReturnValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-1', user_metadata: {} } },
          error: null,
        }),
      },
    } as never)

    vi.mocked(getSupabaseAdmin).mockReturnValue({
      from: vi.fn().mockImplementation((table: string) => ({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data:
                table === 'user_profiles'
                  ? { phone: '13800138000', nickname: '普通用户', is_active: true }
                  : null,
              error: null,
            }),
          }),
        }),
      })),
    } as never)

    const res = await GET(authRequest('token') as never)
    const { status, body } = await readJsonResponse<{
      user: { membership: { status: string } }
    }>(res)

    expect(status).toBe(200)
    expect(body.user.membership.status).toBe('free')
  })
})
