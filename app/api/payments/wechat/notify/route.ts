import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db/index'
import { fulfillMembershipOrder } from '@/lib/orders/membership-order'
import { parseWechatPayNotify } from '@/lib/wechat-pay/client'
import { getWechatPayConfig } from '@/lib/wechat-pay/config'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const config = getWechatPayConfig()
  if (!config) {
    return NextResponse.json({ code: 'FAIL', message: '微信支付未配置' }, { status: 503 })
  }

  const db = getDb()
  if (!db) {
    return NextResponse.json({ code: 'FAIL', message: '数据库未配置' }, { status: 503 })
  }

  const rawBody = await request.text()

  try {
    const payload = parseWechatPayNotify(config, request.headers, rawBody)

    if (payload.trade_state !== 'SUCCESS') {
      return NextResponse.json({ code: 'SUCCESS', message: 'ignored' })
    }

    const paidAt = payload.success_time ? new Date(payload.success_time) : new Date()

    const result = await fulfillMembershipOrder(db, {
      orderNo: payload.out_trade_no,
      paidAt,
      wechatTransactionId: payload.transaction_id,
    })

    if (!result.success) {
      console.error('微信支付回调履约失败:', result.message)
      return NextResponse.json({ code: 'FAIL', message: result.message }, { status: 500 })
    }

    return NextResponse.json({ code: 'SUCCESS', message: '成功' })
  } catch (error) {
    console.error('微信支付回调处理失败:', error)
    return NextResponse.json(
      { code: 'FAIL', message: error instanceof Error ? error.message : '处理失败' },
      { status: 400 },
    )
  }
}
