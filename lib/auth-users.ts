import { eq } from 'drizzle-orm'
import { hashPassword, verifyPassword } from '@/lib/auth-server'
import {
  AUTH_MESSAGES,
  validateUserPassword,
  validateUserPhone,
} from '@/lib/auth-validation'
import type { AppDb } from '@/lib/db/index'
import { isActiveFlag, newId } from '@/lib/db/index'
import { memberships, userProfiles } from '@/lib/db/schema'
import { mapAdminUser } from '@/lib/db/tables'

export { AUTH_MESSAGES, validateUserPassword, validateUserPhone }
export type { AuthErrorCode } from '@/lib/auth-validation'

type ProvisionInput = {
  phone: string
  password: string
  nickname?: string
}

type ProvisionSuccess = {
  success: true
  profile: ReturnType<typeof mapAdminUser>
  userId: string
}

type ProvisionFailure = {
  success: false
  message: string
  status: number
  code?: import('@/lib/auth-validation').AuthErrorCode
}

export async function findUserProfileByPhone(db: AppDb, phone: string) {
  const rows = await db
    .select({
      id: userProfiles.id,
      isActive: userProfiles.isActive,
      passwordHash: userProfiles.passwordHash,
      nickname: userProfiles.nickname,
      phone: userProfiles.phone,
    })
    .from(userProfiles)
    .where(eq(userProfiles.phone, phone.trim()))
    .limit(1)

  const row = rows[0]
  if (!row) return null

  return {
    id: row.id,
    is_active: isActiveFlag(row.isActive),
    password_hash: row.passwordHash,
    nickname: row.nickname,
    phone: row.phone,
  }
}

export async function verifyUserCredentials(
  db: AppDb,
  phone: string,
  password: string,
): Promise<
  | { ok: true; user: { id: string; phone: string; nickname: string | null } }
  | {
      ok: false
      message: string
      status: number
      code?: import('@/lib/auth-validation').AuthErrorCode
    }
> {
  const profile = await findUserProfileByPhone(db, phone)
  if (!profile) {
    return {
      ok: false,
      message: AUTH_MESSAGES.invalidCredentials,
      status: 401,
      code: 'INVALID_CREDENTIALS',
    }
  }

  if (profile.is_active === false) {
    return {
      ok: false,
      message: AUTH_MESSAGES.banned,
      status: 403,
      code: 'BANNED',
    }
  }

  const valid = await verifyPassword(password, profile.password_hash)
  if (!valid) {
    return {
      ok: false,
      message: AUTH_MESSAGES.invalidCredentials,
      status: 401,
      code: 'INVALID_CREDENTIALS',
    }
  }

  return {
    ok: true,
    user: {
      id: profile.id,
      phone: profile.phone,
      nickname: profile.nickname,
    },
  }
}

export async function provisionAppUser(
  db: AppDb,
  input: ProvisionInput,
): Promise<ProvisionSuccess | ProvisionFailure> {
  const phone = input.phone.trim()
  const phoneError = validateUserPhone(phone)
  if (phoneError) {
    return { success: false, message: phoneError, status: 400 }
  }

  const passwordError = validateUserPassword(input.password)
  if (passwordError) {
    return { success: false, message: passwordError, status: 400 }
  }

  const nickname = input.nickname?.trim() || `用户${phone.slice(-4)}`
  const existingProfile = await findUserProfileByPhone(db, phone)

  if (existingProfile) {
    if (existingProfile.is_active === false) {
      return {
        success: false,
        message: AUTH_MESSAGES.banned,
        status: 403,
        code: 'BANNED',
      }
    }
    return {
      success: false,
      message: AUTH_MESSAGES.alreadyRegistered,
      status: 400,
      code: 'ALREADY_REGISTERED',
    }
  }

  const userId = newId()
  const passwordHash = await hashPassword(input.password)
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')

  try {
    await db.transaction(async (tx) => {
      await tx.insert(userProfiles).values({
        id: userId,
        phone,
        passwordHash,
        nickname,
        isActive: 1,
        createdAt: now,
      })

      await tx.insert(memberships).values({
        id: newId(),
        userId,
        status: 'free',
        planType: null,
        startsAt: now,
        expiresAt: null,
      })
    })
  } catch (error) {
    console.error('创建用户失败:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : '创建用户失败',
      status: 500,
    }
  }

  const profile = {
    id: userId,
    phone,
    nickname,
    is_active: true,
    created_at: now,
  }

  return {
    success: true,
    userId,
    profile: mapAdminUser(profile, { status: 'free', expires_at: null }),
  }
}

export async function updateUserPassword(
  db: AppDb,
  userId: string,
  newPassword: string,
): Promise<{ success: boolean; message?: string }> {
  const passwordHash = await hashPassword(newPassword)
  await db
    .update(userProfiles)
    .set({ passwordHash })
    .where(eq(userProfiles.id, userId))

  return { success: true }
}
