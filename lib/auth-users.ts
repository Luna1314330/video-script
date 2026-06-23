import type { SupabaseClient } from '@supabase/supabase-js'
import { DB, mapAdminUser, phoneToEmail } from '@/lib/db/tables'

const PHONE_REGEX = /^1[3-9]\d{9}$/

export const AUTH_MESSAGES = {
  alreadyRegistered: '该手机号已注册过，请直接登录',
  banned: '该手机号已被禁用，请联系管理员',
  invalidCredentials: '手机号或密码错误',
} as const

export type AuthErrorCode = 'ALREADY_REGISTERED' | 'BANNED' | 'INVALID_CREDENTIALS'

/** 将 Supabase Auth 英文错误转为中文提示 */
export function mapAuthErrorMessage(
  error: { message?: string; status?: number | string } | null | undefined,
): { message: string; status: number; code?: AuthErrorCode } {
  const raw = error?.message?.trim() || ''
  const lower = raw.toLowerCase()

  if (
    lower.includes('already been registered') ||
    lower.includes('already registered') ||
    lower.includes('user already registered')
  ) {
    return {
      message: AUTH_MESSAGES.alreadyRegistered,
      status: 400,
      code: 'ALREADY_REGISTERED',
    }
  }

  if (lower.includes('invalid login credentials') || lower.includes('invalid credentials')) {
    return {
      message: AUTH_MESSAGES.invalidCredentials,
      status: 401,
      code: 'INVALID_CREDENTIALS',
    }
  }

  if (lower.includes('email not confirmed')) {
    return { message: '账号尚未验证，请联系管理员', status: 403 }
  }

  if (lower.includes('password')) {
    return { message: '密码不符合要求，请检查后重试', status: 400 }
  }

  return {
    message: raw ? `注册失败：${raw}` : '创建登录账号失败',
    status: typeof error?.status === 'number' ? error.status : 500,
  }
}

export function validateUserPhone(phone: string): string | null {
  const trimmed = phone.trim()
  if (!trimmed) return '手机号不能为空'
  if (!PHONE_REGEX.test(trimmed)) return '手机号格式不正确，请输入11位有效手机号'
  return null
}

export function validateUserPassword(password: string): string | null {
  if (!password) return '请输入密码'
  if (password.length < 6) return '密码至少 6 位'
  if (password.length > 12) return '密码长度不能超过 12 位'
  return null
}

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
  code?: AuthErrorCode
}

export async function findUserProfileByPhone(
  supabaseAdmin: SupabaseClient,
  phone: string,
) {
  const { data } = await supabaseAdmin
    .from(DB.userProfiles)
    .select('id, is_active')
    .eq('phone', phone.trim())
    .maybeSingle()
  return data
}

/** Auth + user_profiles + memberships(free)，管理员添加与前端注册共用 */
export async function provisionAppUser(
  supabaseAdmin: SupabaseClient,
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

  const email = phoneToEmail(phone)
  const nickname = input.nickname?.trim() || `用户${phone.slice(-4)}`

  const existingProfile = await findUserProfileByPhone(supabaseAdmin, phone)

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

  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
    user_metadata: { nickname, phone },
  })

  if (authError || !authData.user) {
    console.error('创建 Auth 用户失败:', authError)
    const mapped = mapAuthErrorMessage(authError)
    return {
      success: false,
      message: mapped.message,
      status: mapped.status,
      code: mapped.code,
    }
  }

  const userId = authData.user.id

  const { data: profile, error: profileError } = await supabaseAdmin
    .from(DB.userProfiles)
    .insert({
      id: userId,
      phone,
      nickname,
      is_active: true,
    })
    .select()
    .single()

  if (profileError) {
    console.error('创建用户资料失败:', profileError)
    await supabaseAdmin.auth.admin.deleteUser(userId)
    return {
      success: false,
      message: profileError.message || '写入用户资料失败',
      status: 500,
    }
  }

  const now = new Date().toISOString()
  const { error: membershipError } = await supabaseAdmin
    .from(DB.memberships)
    .insert({
      user_id: userId,
      status: 'free',
      plan_type: null,
      starts_at: now,
      expires_at: null,
    })

  if (membershipError) {
    console.error('创建会员记录失败:', membershipError)
    await supabaseAdmin.from(DB.userProfiles).delete().eq('id', userId)
    await supabaseAdmin.auth.admin.deleteUser(userId)
    return {
      success: false,
      message: membershipError.message || '创建会员记录失败',
      status: 500,
    }
  }

  return {
    success: true,
    userId,
    profile: mapAdminUser(profile, { status: 'free', expires_at: null }),
  }
}
