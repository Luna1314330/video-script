import { describe, expect, it } from 'vitest'
import { getQuotaExhaustedMessage } from '@/lib/generation/client'
import {
  isQuotaBlocked,
  isQuotaExhaustedError,
} from '@/lib/generation/use-generation-quota'

describe('isQuotaExhaustedError', () => {
  it('识别额度用尽错误文案', () => {
    expect(isQuotaExhaustedError('今日脚本生成次数已用完（6 次/天）')).toBe(true)
    expect(isQuotaExhaustedError('今日免费生成次数已用完（1 次/天），开通会员可获得更多额度')).toBe(true)
    expect(isQuotaExhaustedError('今日免费体验次数已用完（3 次/天），请明日再试')).toBe(true)
    expect(isQuotaExhaustedError('网络错误')).toBe(false)
    expect(isQuotaExhaustedError(null)).toBe(false)
  })
})

describe('isQuotaBlocked', () => {
  it('剩余为 0 时视为额度阻塞', () => {
    expect(
      isQuotaBlocked(
        {
          isMember: true,
          dailyLimit: 6,
          used: 6,
          remaining: 0,
          membershipPurchaseEnabled: false,
        },
        null,
      ),
    ).toBe(true)
  })

  it('错误为额度类时也视为阻塞', () => {
    expect(isQuotaBlocked(null, '今日脚本生成次数已用完（6 次/天）')).toBe(true)
  })
})

describe('getQuotaExhaustedMessage', () => {
  it('免费体验期提示明日再试', () => {
    const message = getQuotaExhaustedMessage({
      isMember: false,
      dailyLimit: 3,
      used: 3,
      remaining: 0,
      membershipPurchaseEnabled: false,
    })
    expect(message).toContain('免费体验')
    expect(message).toContain('明日再试')
    expect(message).not.toContain('开通会员')
  })

  it('开放购买时提示开通会员', () => {
    const message = getQuotaExhaustedMessage({
      isMember: false,
      dailyLimit: 1,
      used: 1,
      remaining: 0,
      membershipPurchaseEnabled: true,
    })
    expect(message).toContain('免费')
    expect(message).toContain('开通会员')
  })

  it('会员提示每日上限', () => {
    const message = getQuotaExhaustedMessage({
      isMember: true,
      dailyLimit: 20,
      used: 20,
      remaining: 0,
      membershipPurchaseEnabled: true,
    })
    expect(message).toContain('20 次/天')
    expect(message).not.toContain('开通会员')
  })
})
