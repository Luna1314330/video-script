import { beforeEach, describe, expect, it, vi } from 'vitest'
import { POST } from '@/app/api/profile/password/route'
import { createJsonRequest, readJsonResponse } from '../helpers/http'

vi.mock('@/lib/require-auth', () => ({
  requireAuthUser: vi.fn(),
}))

vi.mock('@/lib/supabase-admin', () => ({
  getSupabaseAdmin: vi.fn(),
}))

vi.mock('@/lib/supabase-auth', () => ({
  getSupabaseAuthClient: vi.fn(),
}))

import { requireAuthUser } from '@/lib/require-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { getSupabaseAuthClient } from '@/lib/supabase-auth'

describe('POST /api/profile/password', () => {
  beforeEach(() => {
    vi.clearAllMocks()
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
    } as never)

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
    } as never)

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
    } as never)

    vi.mocked(getSupabaseAdmin).mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { phone: '13800138000', is_active: true },
              error: null,
            }),
          }),
        }),
      }),
      auth: { admin: { updateUserById: vi.fn() } },
    } as never)

    vi.mocked(getSupabaseAuthClient).mockReturnValue({
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({
          error: { message: 'Invalid login credentials' },
        }),
      },
    } as never)

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
    } as never)

    const updateUserById = vi.fn().mockResolvedValue({ error: null })

    vi.mocked(getSupabaseAdmin).mockReturnValue({
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { phone: '13800138000', is_active: true },
              error: null,
            }),
          }),
        }),
      }),
      auth: { admin: { updateUserById } },
    } as never)

    vi.mocked(getSupabaseAuthClient).mockReturnValue({
      auth: {
        signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
      },
    } as never)

    const res = await POST(
      createJsonRequest('http://localhost/api/profile/password', {
        oldPassword: '123456',
        newPassword: '654321',
      }),
    )
    const { status, body } = await readJsonResponse(res)

    expect(status).toBe(200)
    expect(body.success).toBe(true)
    expect(updateUserById).toHaveBeenCalledWith('user-1', { password: '654321' })
  })
})
