import { describe, expect, it } from 'vitest'
import {
  createAdminSessionToken,
  verifyAdminCredentials,
  verifyAdminSessionToken,
} from '@/lib/admin-auth-server'

describe('verifyAdminCredentials', () => {
  it('正确账号密码通过', () => {
    expect(verifyAdminCredentials('admin', '19910113')).toBe(true)
  })

  it('错误密码拒绝', () => {
    expect(verifyAdminCredentials('admin', 'wrong')).toBe(false)
    expect(verifyAdminCredentials('admin', 'admin1991')).toBe(false)
  })

  it('错误用户名拒绝', () => {
    expect(verifyAdminCredentials('root', '19910113')).toBe(false)
  })
})

describe('admin session token', () => {
  it('创建后可验证', () => {
    const token = createAdminSessionToken()
    expect(verifyAdminSessionToken(token)).toBe(true)
  })

  it('无效 token 拒绝', () => {
    expect(verifyAdminSessionToken('invalid')).toBe(false)
    expect(verifyAdminSessionToken(null)).toBe(false)
  })
})
