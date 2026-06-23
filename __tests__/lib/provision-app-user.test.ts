import { beforeEach, describe, expect, it, vi } from 'vitest'
import { provisionAppUser } from '@/lib/auth-users'
import { AUTH_MESSAGES } from '@/lib/auth-users'

function createSupabaseMock(options: {
  existingProfile?: { id: string; is_active: boolean } | null
  authCreateError?: { message: string } | null
  authUserId?: string
  profileInsertError?: { message: string } | null
  profileRow?: Record<string, unknown>
  membershipInsertError?: { message: string } | null
}) {
  const deleteUser = vi.fn().mockResolvedValue({ error: null })
  const deleteProfileEq = vi.fn().mockResolvedValue({ error: null })

  const supabase = {
    from: vi.fn((table: string) => {
      if (table === 'user_profiles') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: options.existingProfile ?? null,
                error: null,
              }),
            }),
          }),
          insert: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: options.profileRow ?? {
                  id: options.authUserId ?? 'new-user',
                  phone: '13800138000',
                  nickname: '用户8000',
                  is_active: true,
                  created_at: '2024-01-01',
                },
                error: options.profileInsertError ?? null,
              }),
            }),
          }),
          delete: vi.fn().mockReturnValue({ eq: deleteProfileEq }),
        }
      }

      if (table === 'memberships') {
        return {
          insert: vi.fn().mockResolvedValue({
            error: options.membershipInsertError ?? null,
          }),
        }
      }

      return {}
    }),
    auth: {
      admin: {
        createUser: vi.fn().mockResolvedValue({
          data: options.authCreateError
            ? { user: null }
            : { user: { id: options.authUserId ?? 'new-user' } },
          error: options.authCreateError ?? null,
        }),
        deleteUser,
      },
    },
  }

  return { supabase: supabase as never, deleteUser, deleteProfileEq }
}

describe('provisionAppUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('手机号已存在且未禁用时拒绝注册', async () => {
    const { supabase } = createSupabaseMock({
      existingProfile: { id: 'existing', is_active: true },
    })

    const result = await provisionAppUser(supabase, {
      phone: '13800138000',
      password: '123456',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.code).toBe('ALREADY_REGISTERED')
      expect(result.message).toBe(AUTH_MESSAGES.alreadyRegistered)
    }
  })

  it('手机号被禁用时拒绝注册', async () => {
    const { supabase } = createSupabaseMock({
      existingProfile: { id: 'existing', is_active: false },
    })

    const result = await provisionAppUser(supabase, {
      phone: '13800138000',
      password: '123456',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.code).toBe('BANNED')
    }
  })

  it('成功创建 Auth 用户、资料与 free 会员记录', async () => {
    const { supabase } = createSupabaseMock({ authUserId: 'new-user' })

    const result = await provisionAppUser(supabase, {
      phone: '13800138000',
      password: '123456',
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.userId).toBe('new-user')
      expect(result.profile.phone).toBe('13800138000')
    }
  })

  it('资料写入失败时回滚 Auth 用户', async () => {
    const { supabase, deleteUser } = createSupabaseMock({
      authUserId: 'new-user',
      profileInsertError: { message: 'profile failed' },
    })

    const result = await provisionAppUser(supabase, {
      phone: '13800138000',
      password: '123456',
    })

    expect(result.success).toBe(false)
    expect(deleteUser).toHaveBeenCalledWith('new-user')
  })

  it('会员记录写入失败时回滚资料与 Auth', async () => {
    const { supabase, deleteUser, deleteProfileEq } = createSupabaseMock({
      authUserId: 'new-user',
      membershipInsertError: { message: 'membership failed' },
    })

    const result = await provisionAppUser(supabase, {
      phone: '13800138000',
      password: '123456',
    })

    expect(result.success).toBe(false)
    expect(deleteProfileEq).toHaveBeenCalledWith('id', 'new-user')
    expect(deleteUser).toHaveBeenCalledWith('new-user')
  })
})
