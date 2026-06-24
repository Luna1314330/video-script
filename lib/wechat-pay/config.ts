export type WechatPayConfig = {
  mchId: string
  appId: string
  apiV3Key: string
  serialNo: string
  privateKey: string
  notifyUrl: string
  platformCert?: string
}

function readPrivateKey(): string | null {
  const inline = process.env.WECHAT_PAY_PRIVATE_KEY?.trim()
  if (inline) {
    return inline.replace(/\\n/g, '\n')
  }

  const path = process.env.WECHAT_PAY_PRIVATE_KEY_PATH?.trim()
  if (!path) return null

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('node:fs') as typeof import('node:fs')
    return fs.readFileSync(path, 'utf8')
  } catch {
    return null
  }
}

export function isWechatPayMockEnabled(): boolean {
  return process.env.WECHAT_PAY_MOCK === 'true'
}

export function getWechatPayConfig(): WechatPayConfig | null {
  const mchId = process.env.WECHAT_PAY_MCH_ID?.trim()
  const appId = process.env.WECHAT_PAY_APP_ID?.trim()
  const apiV3Key = process.env.WECHAT_PAY_API_V3_KEY?.trim()
  const serialNo = process.env.WECHAT_PAY_SERIAL_NO?.trim()
  const privateKey = readPrivateKey()
  const notifyUrl = process.env.WECHAT_PAY_NOTIFY_URL?.trim()
  const platformCert = process.env.WECHAT_PAY_PLATFORM_CERT?.trim()?.replace(/\\n/g, '\n')

  if (!mchId || !appId || !apiV3Key || !serialNo || !privateKey || !notifyUrl) {
    return null
  }

  return {
    mchId,
    appId,
    apiV3Key,
    serialNo,
    privateKey,
    notifyUrl,
    platformCert: platformCert || undefined,
  }
}

export function isWechatPayConfigured(): boolean {
  return getWechatPayConfig() !== null
}

export function getWechatPayStatus() {
  const mock = isWechatPayMockEnabled()
  const configured = isWechatPayConfigured()

  return {
    mock,
    configured,
    ready: mock || configured,
    notifyUrl: process.env.WECHAT_PAY_NOTIFY_URL?.trim() || null,
  }
}
