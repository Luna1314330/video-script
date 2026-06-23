import { describe, expect, it } from 'vitest'
import {
  AUTH_MESSAGES,
  validateUserPassword,
  validateUserPhone,
} from '@/lib/auth-validation'

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

describe('AUTH_MESSAGES', () => {
  it('包含常用提示文案', () => {
    expect(AUTH_MESSAGES.invalidCredentials).toBe('手机号或密码错误')
    expect(AUTH_MESSAGES.alreadyRegistered).toMatch(/已注册/)
  })
})
