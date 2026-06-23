import { describe, expect, it } from 'vitest'
import {
  AUTH_MESSAGES,
  mapAuthErrorMessage,
  validateUserPassword,
  validateUserPhone,
} from '@/lib/auth-users'

describe('validateUserPhone', () => {
  it('拒绝空手机号', () => {
    expect(validateUserPhone('')).toBe('手机号不能为空')
    expect(validateUserPhone('   ')).toBe('手机号不能为空')
  })

  it('拒绝格式错误的手机号', () => {
    expect(validateUserPhone('12345678901')).toBe('手机号格式不正确，请输入11位有效手机号')
    expect(validateUserPhone('1380013800')).toBe('手机号格式不正确，请输入11位有效手机号')
    expect(validateUserPhone('23800138000')).toBe('手机号格式不正确，请输入11位有效手机号')
  })

  it('接受有效手机号', () => {
    expect(validateUserPhone('13800138000')).toBeNull()
    expect(validateUserPhone(' 15912345678 ')).toBeNull()
  })
})

describe('validateUserPassword', () => {
  it('拒绝空密码', () => {
    expect(validateUserPassword('')).toBe('请输入密码')
  })

  it('拒绝过短或过长的密码', () => {
    expect(validateUserPassword('12345')).toBe('密码至少 6 位')
    expect(validateUserPassword('1234567890123')).toBe('密码长度不能超过 12 位')
  })

  it('接受 6-12 位密码', () => {
    expect(validateUserPassword('123456')).toBeNull()
    expect(validateUserPassword('123456789012')).toBeNull()
  })
})

describe('mapAuthErrorMessage', () => {
  it('映射已注册错误', () => {
    const result = mapAuthErrorMessage({ message: 'User already registered' })
    expect(result).toEqual({
      message: AUTH_MESSAGES.alreadyRegistered,
      status: 400,
      code: 'ALREADY_REGISTERED',
    })
  })

  it('映射凭据错误', () => {
    const result = mapAuthErrorMessage({ message: 'Invalid login credentials' })
    expect(result).toEqual({
      message: AUTH_MESSAGES.invalidCredentials,
      status: 401,
      code: 'INVALID_CREDENTIALS',
    })
  })

  it('映射邮箱未验证错误', () => {
    const result = mapAuthErrorMessage({ message: 'Email not confirmed' })
    expect(result.message).toBe('账号尚未验证，请联系管理员')
    expect(result.status).toBe(403)
  })

  it('映射密码相关错误', () => {
    const result = mapAuthErrorMessage({ message: 'Password should be at least 6 characters' })
    expect(result.message).toBe('密码不符合要求，请检查后重试')
    expect(result.status).toBe(400)
  })

  it('未知错误保留原始信息', () => {
    const result = mapAuthErrorMessage({ message: 'Something went wrong', status: 502 })
    expect(result.message).toBe('注册失败：Something went wrong')
    expect(result.status).toBe(502)
  })
})
