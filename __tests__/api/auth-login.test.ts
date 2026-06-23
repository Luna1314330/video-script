import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from '@/app/api/auth/login/route'
import { AUTH_MESSAGES } from '@/lib/auth-users'
import { createJsonRequest, readJsonResponse } from '../helpers/http'

vi.mock('@/lib/supabase-admin', () => ({
  getSupabaseAdmin: vi.fn(),
}))

vi.mock('@/lib/supabase-auth', () => ({
  getSupabaseAuthClient: vi.fn(),
}))

import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { getSupabaseAuthClient } from '@/lib/supabase-auth'

const validBody = { phone: '13800138000', password: '123456' }

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('手机号格式错误时返回 400', async () => {
    const res = await POST(createJsonRequest('http://localhost/api/auth/login', {
      phone: '123',
      password: '123456',
    }))
    const { status, body } = await readJsonResponse(res)

    expect(status).toBe(400)
    expect(body.error).toMatch(/手机号/)
  })

  it('密码不符合规则时返回 400', async () => {
    const res = await POST(createJsonRequest('http://localhost/api/auth/login', {
      phone: '13800138000',
      password: '12',
    }))
    const { status, body } = await readJsonResponse(res)

    expect(status).toBe(400)
    expect(body.error).toMatch(/密码/)
  })

  it('账号被禁用时返回 403', async () => {
    vi.mocked(getSupabaseAdmin).mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { id: 'u1', is_active: false },
              error: null,
            }),
          }),
        }),
      }),
    } as never)

    const res = await POST(createJsonRequest('http://localhost/api/auth/login', validBody))
    const { status, body } = await readJsonResponse(res)

    expect(status).toBe(403)
    expect(body).toEqual({ error: AUTH_MESSAGES.banned, code: 'BANNED' })
  })

  it('Supabase Auth 未配置时返回 503', async () => {
    vi.mocked(getSupabaseAdmin).mockReturnValue(null)
    vi.mocked(getSupabaseAuthClient).mockReturnValue(null)

    const res = await POST(createJsonRequest('http://localhost/api/auth/login', validBody))
    const { status, body } = await readJsonResponse(res)

    expect(status).toBe(503)
    expect(body.error).toMatch(/Supabase/)
  })

  it('凭据错误时返回 401', async () => {
    vi.mocked(getSupabaseAdmin).mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      }),
    } as never)

    vi.mocked(getSupabaseAuthClient).mockReturnValue({
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({
          data: { session: null, user: null },
          error: { message: 'Invalid login credentials' },
        }),
        signOut: vi.fn(),
      },
    } as never)

    const res = await POST(createJsonRequest('http://localhost/api/auth/login', validBody))
    const { status, body } = await readJsonResponse(res)

    expect(status).toBe(401)
    expect(body.code).toBe('INVALID_CREDENTIALS')
  })

  it('登录成功返回 token 与用户信息', async () => {
    const profileQuery = {
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: { phone: '13800138000', nickname: '小明', is_active: true },
            error: null,
          }),
        }),
      }),
    }

    vi.mocked(getSupabaseAdmin).mockReturnValue({
      from: vi.fn().mockImplementation((table) => {
        if (table === 'user_profiles') return profileQuery
        return profileQuery
      }),
    } as never)

    vi.mocked(getSupabaseAuthClient).mockReturnValue({
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({
          data: {
            session: { access_token: 'access-token', refresh_token: 'refresh-token' },
            user: { id: 'user-1', user_metadata: { nickname: '小明' } },
          },
          error: null,
        }),
        signOut: vi.fn(),
      },
    } as never)

    const res = await POST(createJsonRequest('http://localhost/api/auth/login', validBody))
    const { status, body } = await readJsonResponse<{
      success: boolean
      token: string
      user: { phone: string; nickname: string }
    }>(res)

    expect(status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.token).toBe('access-token')
    expect(body.user.phone).toBe('13800138000')
    expect(body.user.nickname).toBe('小明')
  })
})
