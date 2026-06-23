import type { SupabaseClient } from '@supabase/supabase-js'
import { provisionAppUser, validateUserPhone } from '@/lib/auth-users'

const DEFAULT_ADMIN_PASSWORD = '123456'

export { validateUserPhone as validateAdminUserPhone }

export async function createAdminUser(
  supabaseAdmin: SupabaseClient,
  input: { phone: string; nickname?: string; password?: string },
) {
  const phone = input.phone.trim()
  const phoneError = validateUserPhone(phone)
  if (phoneError) {
    return { success: false as const, message: phoneError, status: 400 }
  }

  const password = input.password?.trim() || DEFAULT_ADMIN_PASSWORD
  const result = await provisionAppUser(supabaseAdmin, {
    phone,
    password,
    nickname: input.nickname,
  })

  if (!result.success) {
    return { success: false as const, message: result.message, status: result.status }
  }

  return {
    success: true as const,
    data: result.profile,
    initialPassword: input.password?.trim() ? undefined : DEFAULT_ADMIN_PASSWORD,
  }
}
