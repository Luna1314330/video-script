const PHONE_REGEX = /^1[3-9]\d{9}$/

export const AUTH_MESSAGES = {
  alreadyRegistered: '该手机号已注册过，请直接登录',
  banned: '该手机号已被禁用，请联系管理员',
  invalidCredentials: '手机号或密码错误',
} as const

export type AuthErrorCode = 'ALREADY_REGISTERED' | 'BANNED' | 'INVALID_CREDENTIALS'

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
