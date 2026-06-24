import { afterEach, describe, expect, it } from 'vitest'
import {
  getWechatPayConfig,
  getWechatPayStatus,
  isWechatPayConfigured,
  isWechatPayMockEnabled,
} from '@/lib/wechat-pay/config'

describe('wechat pay config', () => {
  const originalEnv = { ...process.env }

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('未配置时返回 null', () => {
    delete process.env.WECHAT_PAY_MCH_ID
    delete process.env.WECHAT_PAY_APP_ID
    delete process.env.WECHAT_PAY_API_V3_KEY
    delete process.env.WECHAT_PAY_SERIAL_NO
    delete process.env.WECHAT_PAY_PRIVATE_KEY
    delete process.env.WECHAT_PAY_NOTIFY_URL

    expect(getWechatPayConfig()).toBeNull()
    expect(isWechatPayConfigured()).toBe(false)
  })

  it('mock 模式下视为 ready', () => {
    process.env.WECHAT_PAY_MOCK = 'true'
    expect(isWechatPayMockEnabled()).toBe(true)
    expect(getWechatPayStatus().ready).toBe(true)
  })
})
