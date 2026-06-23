import { describe, expect, it, vi } from 'vitest'
import {
  formatProfileDate,
  getMembershipActionLabel,
  getMembershipPurchaseLabel,
  getMembershipStatusLabel,
  getPlanTypeLabel,
  isActiveMembership,
} from '@/lib/profile/client'

describe('profile client helpers', () => {
  it('formatProfileDate 格式化有效日期', () => {
    const formatted = formatProfileDate('2024-03-15T10:00:00.000Z')
    expect(formatted).toMatch(/2024/)
  })

  it('formatProfileDate 处理空值与无效日期', () => {
    expect(formatProfileDate(null)).toBe('—')
    expect(formatProfileDate(undefined)).toBe('—')
    expect(formatProfileDate('invalid-date')).toBe('invalid-date')
  })

  it('getMembershipStatusLabel 返回中文标签', () => {
    expect(getMembershipStatusLabel('free')).toBe('普通用户')
    expect(getMembershipStatusLabel('active')).toBe('VIP会员')
    expect(getMembershipStatusLabel('expired')).toBe('会员已过期')
    expect(getMembershipStatusLabel('cancelled')).toBe('会员已取消')
  })

  it('getPlanTypeLabel 返回套餐名称', () => {
    expect(getPlanTypeLabel('monthly')).toBe('月度会员')
    expect(getPlanTypeLabel('quarterly')).toBe('季度会员')
    expect(getPlanTypeLabel('yearly')).toBe('年度会员')
    expect(getPlanTypeLabel(null)).toBe('—')
    expect(getPlanTypeLabel('custom')).toBe('custom')
  })

  it('会员文案区分开通与续费', () => {
    expect(getMembershipActionLabel(false)).toBe('开通会员')
    expect(getMembershipActionLabel(true)).toBe('会员续费')
    expect(getMembershipPurchaseLabel(false)).toBe('立即开通')
    expect(getMembershipPurchaseLabel(true)).toBe('立即续费')
    expect(isActiveMembership({ status: 'active', plan_type: 'monthly' })).toBe(true)
    expect(isActiveMembership({ status: 'free', plan_type: null })).toBe(false)
  })
})

describe('profile client API wrappers', () => {
  it('fetchCurrentUser 成功返回用户', async () => {
    const { fetchCurrentUser } = await import('@/lib/profile/client')
    const user = {
      id: 'u1',
      phone: '13800138000',
      nickname: '测试用户',
      membership: { status: 'free' as const, plan_type: null },
    }

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ user }),
      }),
    )

    await expect(fetchCurrentUser()).resolves.toEqual(user)
  })

  it('fetchCurrentUser 失败抛出错误', async () => {
    const { fetchCurrentUser } = await import('@/lib/profile/client')

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: '未登录' }),
      }),
    )

    await expect(fetchCurrentUser()).rejects.toThrow('未登录')
    vi.unstubAllGlobals()
  })

  it('changePassword 成功不抛错', async () => {
    const { changePassword } = await import('@/lib/profile/client')

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      }),
    )

    await expect(
      changePassword({ oldPassword: '123456', newPassword: '654321' }),
    ).resolves.toBeUndefined()
    vi.unstubAllGlobals()
  })

  it('changePassword 失败抛出服务端消息', async () => {
    const { changePassword } = await import('@/lib/profile/client')

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ success: false, message: '旧密码错误' }),
      }),
    )

    await expect(
      changePassword({ oldPassword: 'wrong', newPassword: '654321' }),
    ).rejects.toThrow('旧密码错误')
    vi.unstubAllGlobals()
  })
})
