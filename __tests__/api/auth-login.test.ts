import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from '@/app/api/auth/login/route'
import { AUTH_MESSAGES } from '@/lib/auth-validation'
import { createJsonRequest, readJsonResponse } from '../helpers/http'

vi.mock('@/lib/db/index', () => ({
  getDb: vi.fn(),
}))

vi.mock('@/lib/auth-server', () => ({
  isJwtConfigured: vi.fn(),
  signAccessToken: vi.fn(),
}))

vi.mock('@/lib/auth-users', async () => {
  const actual = await vi.importActual<typeof import('@/lib/auth-validation')>(
    '@/lib/auth-validation',
  )
  return {
    ...actual,
    verifyUserCredentials: vi.fn(),
  }
})

import { isJwtConfigured, signAccessToken } from '@/lib/auth-server'
import { verifyUserCredentials } from '@/lib/auth-users'
import { getDb } from '@/lib/db/index'

const validBody = { phone: '13800138000', password: '123456' }

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getDb).mockReturnValue({} as never)
    vi.mocked(isJwtConfigured).mockReturnValue(true)
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
    vi.mocked(verifyUserCredentials).mockResolvedValue({
      ok: false,
      message: AUTH_MESSAGES.banned,
      status: 403,
      code: 'BANNED',
    })

    const res = await POST(createJsonRequest('http://localhost/api/auth/login', validBody))
    const { status, body } = await readJsonResponse(res)

    expect(status).toBe(403)
    expect(body).toEqual({ error: AUTH_MESSAGES.banned, code: 'BANNED' })
  })

  it('数据库未配置时返回 503', async () => {
    vi.mocked(getDb).mockReturnValue(null)

    const res = await POST(createJsonRequest('http://localhost/api/auth/login', validBody))
    const { status, body } = await readJsonResponse(res)

    expect(status).toBe(503)
    expect(body.error).toMatch(/数据库未配置/)
  })

  it('凭据错误时返回 401', async () => {
    vi.mocked(verifyUserCredentials).mockResolvedValue({
      ok: false,
      message: AUTH_MESSAGES.invalidCredentials,
      status: 401,
      code: 'INVALID_CREDENTIALS',
    })

    const res = await POST(createJsonRequest('http://localhost/api/auth/login', validBody))
    const { status, body } = await readJsonResponse(res)

    expect(status).toBe(401)
    expect(body.code).toBe('INVALID_CREDENTIALS')
  })

  it('登录成功返回 token 与用户信息', async () => {
    vi.mocked(verifyUserCredentials).mockResolvedValue({
      ok: true,
      user: { id: 'user-1', phone: '13800138000', nickname: '小明' },
    })
    vi.mocked(signAccessToken).mockResolvedValue('access-token')

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
