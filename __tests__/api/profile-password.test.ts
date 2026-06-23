import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from '@/app/api/profile/password/route'
import { createJsonRequest, readJsonResponse } from '../helpers/http'

vi.mock('@/lib/require-auth', () => ({
  requireAuthUser: vi.fn(),
}))

vi.mock('@/lib/db/index', () => ({
  getDb: vi.fn(),
}))

vi.mock('@/lib/auth-users', async () => {
  const actual = await vi.importActual<typeof import('@/lib/auth-validation')>(
    '@/lib/auth-validation',
  )
  return {
    ...actual,
    verifyUserCredentials: vi.fn(),
    updateUserPassword: vi.fn(),
  }
})

import { updateUserPassword, verifyUserCredentials } from '@/lib/auth-users'
import { requireAuthUser } from '@/lib/require-auth'
import { getDb } from '@/lib/db/index'

describe('POST /api/profile/password', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getDb).mockReturnValue({
      select: vi.fn().mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([
              { phone: '13800138000', isActive: 1 },
            ]),
          }),
        }),
      }),
    } as never)
  })

  it('未登录返回 401', async () => {
    vi.mocked(requireAuthUser).mockResolvedValue({
      ok: false,
      message: '请先登录后再生成脚本',
      status: 401,
    })

    const res = await POST(
      createJsonRequest('http://localhost/api/profile/password', {
        oldPassword: '123456',
        newPassword: '654321',
      }),
    )
    const { status, body } = await readJsonResponse(res)

    expect(status).toBe(401)
    expect(body.message).toMatch(/登录/)
  })

  it('新密码不符合规则时返回 400', async () => {
    vi.mocked(requireAuthUser).mockResolvedValue({
      ok: true,
      user: { id: 'user-1' },
      token: 'token',
    })

    const res = await POST(
      createJsonRequest('http://localhost/api/profile/password', {
        oldPassword: '123456',
        newPassword: '12',
      }),
    )
    const { status, body } = await readJsonResponse(res)

    expect(status).toBe(400)
    expect(body.message).toMatch(/密码/)
  })

  it('新旧密码相同时返回 400', async () => {
    vi.mocked(requireAuthUser).mockResolvedValue({
      ok: true,
      user: { id: 'user-1' },
      token: 'token',
    })

    const res = await POST(
      createJsonRequest('http://localhost/api/profile/password', {
        oldPassword: '123456',
        newPassword: '123456',
      }),
    )
    const { status, body } = await readJsonResponse(res)

    expect(status).toBe(400)
    expect(body.message).toBe('新密码不能与旧密码相同')
  })

  it('旧密码错误返回 401', async () => {
    vi.mocked(requireAuthUser).mockResolvedValue({
      ok: true,
      user: { id: 'user-1' },
      token: 'token',
    })

    vi.mocked(verifyUserCredentials).mockResolvedValue({
      ok: false,
      message: '手机号或密码错误',
      status: 401,
    })

    const res = await POST(
      createJsonRequest('http://localhost/api/profile/password', {
        oldPassword: 'wrong',
        newPassword: '654321',
      }),
    )
    const { status, body } = await readJsonResponse(res)

    expect(status).toBe(401)
    expect(body.message).toBe('旧密码错误')
  })

  it('修改成功返回 success', async () => {
    vi.mocked(requireAuthUser).mockResolvedValue({
      ok: true,
      user: { id: 'user-1' },
      token: 'token',
    })

    vi.mocked(verifyUserCredentials).mockResolvedValue({
      ok: true,
      user: { id: 'user-1', phone: '13800138000', nickname: '用户' },
    })
    vi.mocked(updateUserPassword).mockResolvedValue({ success: true })

    const res = await POST(
      createJsonRequest('http://localhost/api/profile/password', {
        oldPassword: '123456',
        newPassword: '654321',
      }),
    )
    const { status, body } = await readJsonResponse(res)

    expect(status).toBe(200)
    expect(body.success).toBe(true)
    expect(updateUserPassword).toHaveBeenCalledWith(expect.anything(), 'user-1', '654321')
  })
})
