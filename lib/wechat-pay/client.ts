import { createDecipheriv, createSign, createVerify, randomBytes } from 'node:crypto'
import type { WechatPayConfig } from '@/lib/wechat-pay/config'

const WECHAT_PAY_HOST = 'https://api.mch.weixin.qq.com'

type RequestOptions = {
  method: 'GET' | 'POST'
  path: string
  body?: unknown
}

type NativePayResult = {
  codeUrl: string
}

type NotifyResource = {
  algorithm: string
  ciphertext: string
  associated_data: string
  nonce: string
  original_type: string
}

export type WechatPayNotifyPayload = {
  mchid: string
  appid: string
  out_trade_no: string
  transaction_id: string
  trade_type: string
  trade_state: string
  trade_state_desc: string
  bank_type?: string
  success_time?: string
  payer?: { openid?: string }
  amount?: { total?: number; payer_total?: number; currency?: string }
}

function buildAuthorization(
  config: WechatPayConfig,
  method: string,
  path: string,
  body: string,
): string {
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const nonce = randomBytes(16).toString('hex')
  const message = `${method}\n${path}\n${timestamp}\n${nonce}\n${body}\n`
  const signature = createSign('RSA-SHA256')
    .update(message)
    .sign(config.privateKey, 'base64')

  return [
    'WECHATPAY2-SHA256-RSA2048',
    `mchid="${config.mchId}"`,
    `nonce_str="${nonce}"`,
    `signature="${signature}"`,
    `timestamp="${timestamp}"`,
    `serial_no="${config.serialNo}"`,
  ].join(' ')
}

async function wechatPayRequest<T>(
  config: WechatPayConfig,
  options: RequestOptions,
): Promise<T> {
  const body = options.body ? JSON.stringify(options.body) : ''
  const authorization = buildAuthorization(config, options.method, options.path, body)

  const response = await fetch(`${WECHAT_PAY_HOST}${options.path}`, {
    method: options.method,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: authorization,
      'User-Agent': 'script-workshop/1.0',
    },
    body: options.method === 'POST' ? body : undefined,
  })

  const text = await response.text()
  let data: unknown = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }

  if (!response.ok) {
    const message =
      typeof data === 'object' &&
      data !== null &&
      'message' in data &&
      typeof (data as { message: unknown }).message === 'string'
        ? (data as { message: string }).message
        : `微信支付请求失败 (${response.status})`
    throw new Error(message)
  }

  return data as T
}

export async function createNativePayOrder(
  config: WechatPayConfig,
  input: {
    description: string
    outTradeNo: string
    amountYuan: number
  },
): Promise<NativePayResult> {
  const total = Math.round(input.amountYuan * 100)
  if (total <= 0) {
    throw new Error('订单金额无效')
  }

  const data = await wechatPayRequest<{ code_url?: string }>(config, {
    method: 'POST',
    path: '/v3/pay/transactions/native',
    body: {
      appid: config.appId,
      mchid: config.mchId,
      description: input.description,
      out_trade_no: input.outTradeNo,
      notify_url: config.notifyUrl,
      amount: {
        total,
        currency: 'CNY',
      },
    },
  })

  if (!data.code_url) {
    throw new Error('微信支付未返回付款二维码')
  }

  return { codeUrl: data.code_url }
}

function verifyNotifySignature(
  config: WechatPayConfig,
  headers: Headers,
  body: string,
): void {
  if (!config.platformCert) {
    throw new Error('未配置 WECHAT_PAY_PLATFORM_CERT，无法验签回调')
  }

  const signature = headers.get('wechatpay-signature')
  const timestamp = headers.get('wechatpay-timestamp')
  const nonce = headers.get('wechatpay-nonce')

  if (!signature || !timestamp || !nonce) {
    throw new Error('微信支付回调缺少签名头')
  }

  const message = `${timestamp}\n${nonce}\n${body}\n`
  const verified = createVerify('RSA-SHA256')
    .update(message)
    .verify(config.platformCert, signature, 'base64')

  if (!verified) {
    throw new Error('微信支付回调验签失败')
  }
}

function decryptNotifyResource(
  apiV3Key: string,
  resource: NotifyResource,
): WechatPayNotifyPayload {
  const key = Buffer.from(apiV3Key, 'utf8')
  const nonce = Buffer.from(resource.nonce, 'utf8')
  const ciphertext = Buffer.from(resource.ciphertext, 'base64')
  const authTag = ciphertext.subarray(ciphertext.length - 16)
  const data = ciphertext.subarray(0, ciphertext.length - 16)

  const decipher = createDecipheriv('aes-256-gcm', key, nonce)
  decipher.setAuthTag(authTag)
  if (resource.associated_data) {
    decipher.setAAD(Buffer.from(resource.associated_data, 'utf8'))
  }

  const decrypted = Buffer.concat([decipher.update(data), decipher.final()])
  return JSON.parse(decrypted.toString('utf8')) as WechatPayNotifyPayload
}

export function parseWechatPayNotify(
  config: WechatPayConfig,
  headers: Headers,
  rawBody: string,
): WechatPayNotifyPayload {
  verifyNotifySignature(config, headers, rawBody)

  const envelope = JSON.parse(rawBody) as {
    resource?: NotifyResource
  }

  if (!envelope.resource) {
    throw new Error('微信支付回调缺少 resource')
  }

  return decryptNotifyResource(config.apiV3Key, envelope.resource)
}
