import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from '@/app/api/auth/register/route'
import { AUTH_MESSAGES } from '@/lib/auth-users'
import { createJsonRequest, readJsonResponse } from '../helpers/http'

vi.mock('@/lib/supabase-admin', () => ({
  getSupabaseAdmin: vi.fn(),
}))

vi.mock('@/lib/auth-users', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/auth-users')>()
  return {
    ...actual,
    provisionAppUser: vi.fn(),
  }
})

import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { provisionAppUser } from '@/lib/auth-users'

const validBody = { phone: '13800138000', password: '123456' }

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('手机号无效时返回 400', async () => {
    const res = await POST(createJsonRequest('http://localhost/api/auth/register', {
      phone: '',
      password: '123456',
    }))
    const { status, body } = await readJsonResponse(res)

    expect(status).toBe(400)
    expect(body.error).toMatch(/手机号/)
  })

  it('密码无效时返回 400', async () => {
    const res = await POST(createJsonRequest('http://localhost/api/auth/register', {
      phone: '13800138000',
      password: '',
    }))
    const { status, body } = await readJsonResponse(res)

    expect(status).toBe(400)
    expect(body.error).toMatch(/密码/)
  })

  it('Supabase 未配置时返回 503', async () => {
    vi.mocked(getSupabaseAdmin).mockReturnValue(null)

    const res = await POST(createJsonRequest('http://localhost/api/auth/register', validBody))
    const { status, body } = await readJsonResponse(res)

    expect(status).toBe(503)
    expect(body.error).toMatch(/Supabase/)
  })

  it('手机号已注册时返回 400', async () => {
    vi.mocked(getSupabaseAdmin).mockReturnValue({} as never)
    vi.mocked(provisionAppUser).mockResolvedValue({
      success: false,
      message: AUTH_MESSAGES.alreadyRegistered,
      status: 400,
      code: 'ALREADY_REGISTERED',
    })

    const res = await POST(createJsonRequest('http://localhost/api/auth/register', validBody))
    const { status, body } = await readJsonResponse(res)

    expect(status).toBe(400)
    expect(body.code).toBe('ALREADY_REGISTERED')
  })

  it('注册成功返回用户信息', async () => {
    vi.mocked(getSupabaseAdmin).mockReturnValue({} as never)
    vi.mocked(provisionAppUser).mockResolvedValue({
      success: true,
      userId: 'user-1',
      profile: {
        id: 'user-1',
        phone: '13800138000',
        nickname: '用户8000',
        status: 'active',
        membershipType: 'none',
        membershipPlanLabel: '无',
        membershipExpireAt: null,
        createdAt: '2024-01-01',
      },
    })

    const res = await POST(createJsonRequest('http://localhost/api/auth/register', validBody))
    const { status, body } = await readJsonResponse<{
      success: boolean
      message: string
      user: { phone: string }
    }>(res)

    expect(status).toBe(200)
    expect(body.success).toBe(true)
    expect(body.message).toBe('注册成功')
    expect(body.user.phone).toBe('13800138000')
  })
})
