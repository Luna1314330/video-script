import { beforeEach, describe, expect, it, vi } from 'vitest'
import { provisionAppUser } from '@/lib/auth-users'
import { AUTH_MESSAGES } from '@/lib/auth-validation'
import { hashPassword } from '@/lib/auth-server'
import { newId } from '@/lib/db/index'

vi.mock('@/lib/auth-server', () => ({
  hashPassword: vi.fn().mockResolvedValue('hashed-password'),
}))

vi.mock('@/lib/db/index', async () => {
  const actual = await vi.importActual<typeof import('@/lib/db/index')>('@/lib/db/index')
  return {
    ...actual,
    newId: vi.fn(),
  }
})

function createDbMock(options: {
  existingProfile?: {
    id: string
    is_active: boolean
    password_hash: string
    nickname: string | null
    phone: string
  } | null
  transactionError?: Error
}) {
  const limit = vi.fn().mockResolvedValue(
    options.existingProfile
      ? [
          {
            id: options.existingProfile.id,
            isActive: options.existingProfile.is_active ? 1 : 0,
            passwordHash: options.existingProfile.password_hash,
            nickname: options.existingProfile.nickname,
            phone: options.existingProfile.phone,
          },
        ]
      : [],
  )

  return {
    select: vi.fn().mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({ limit }),
      }),
    }),
    transaction: options.transactionError
      ? vi.fn().mockRejectedValue(options.transactionError)
      : vi.fn().mockImplementation(async (fn) =>
          fn({
            insert: vi.fn().mockReturnValue({
              values: vi.fn().mockResolvedValue(undefined),
            }),
          }),
        ),
  } as never
}

describe('provisionAppUser', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(hashPassword).mockResolvedValue('hashed-password')
    vi.mocked(newId).mockReturnValueOnce('user-1').mockReturnValueOnce('membership-1')
  })

  it('手机号已存在且未禁用时拒绝注册', async () => {
    const db = createDbMock({
      existingProfile: {
        id: 'existing',
        is_active: true,
        password_hash: 'hash',
        nickname: '用户',
        phone: '13800138000',
      },
    })

    const result = await provisionAppUser(db, {
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
    const db = createDbMock({
      existingProfile: {
        id: 'existing',
        is_active: false,
        password_hash: 'hash',
        nickname: '用户',
        phone: '13800138000',
      },
    })

    const result = await provisionAppUser(db, {
      phone: '13800138000',
      password: '123456',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.code).toBe('BANNED')
    }
  })

  it('成功创建用户资料与 free 会员记录', async () => {
    const db = createDbMock({ existingProfile: null })

    const result = await provisionAppUser(db, {
      phone: '13800138000',
      password: '123456',
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.userId).toBe('user-1')
      expect(result.profile.phone).toBe('13800138000')
    }
  })

  it('数据库事务失败时返回 500', async () => {
    const db = createDbMock({
      existingProfile: null,
      transactionError: new Error('db failed'),
    })

    const result = await provisionAppUser(db, {
      phone: '13800138000',
      password: '123456',
    })

    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.status).toBe(500)
    }
  })
})
