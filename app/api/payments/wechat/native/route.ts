import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db/index'
import {
  fulfillMembershipOrder,
  getMembershipOrderForUser,
} from '@/lib/orders/membership-order'
import { PLAN_TYPE_LABELS } from '@/lib/db/tables'
import { requireAuthUser } from '@/lib/require-auth'
import { ensureSiteSettingsHydrated } from '@/lib/site-settings'
import { createNativePayOrder } from '@/lib/wechat-pay/client'
import {
  getWechatPayConfig,
  isWechatPayConfigured,
  isWechatPayMockEnabled,
} from '@/lib/wechat-pay/config'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthUser(request)
    if (!auth.ok) {
      return NextResponse.json({ error: auth.message }, { status: auth.status })
    }

    const db = getDb()
    if (!db) {
      return NextResponse.json({ error: '数据库未配置' }, { status: 503 })
    }

    await ensureSiteSettingsHydrated(db)

    const body = await request.json()
    const { order_id: orderId } = body

    if (!orderId || typeof orderId !== 'string') {
      return NextResponse.json({ error: '缺少订单 ID' }, { status: 400 })
    }

    const order = await getMembershipOrderForUser(db, auth.user.id, orderId)
    if (!order) {
      return NextResponse.json({ error: '订单不存在' }, { status: 404 })
    }

    if (order.status === 'paid') {
      return NextResponse.json({
        success: true,
        alreadyPaid: true,
        order: { id: order.id, status: 'paid' },
      })
    }

    if (order.status !== 'pending') {
      return NextResponse.json({ error: '订单状态不可支付' }, { status: 400 })
    }

    if (order.paymentMethod !== 'wechat') {
      return NextResponse.json({ error: '该订单不支持微信支付' }, { status: 400 })
    }

    if (isWechatPayMockEnabled()) {
      const result = await fulfillMembershipOrder(db, {
        orderId: order.id,
        wechatTransactionId: `MOCK_${Date.now()}`,
      })

      if (!result.success) {
        return NextResponse.json({ error: result.message }, { status: result.status })
      }

      return NextResponse.json({
        success: true,
        mock: true,
        order: {
          id: result.orderId,
          order_no: result.orderNo,
          status: 'paid',
        },
        membership: {
          id: result.membershipId,
          status: 'active',
          plan_type: result.planType,
          starts_at: result.startsAt,
          expires_at: result.expiresAt,
        },
      })
    }

    const config = getWechatPayConfig()
    if (!config) {
      return NextResponse.json(
        {
          error:
            '微信支付尚未配置完成。请配置商户号、证书与回调地址，或临时开启 WECHAT_PAY_MOCK=true 用于本地测试。',
        },
        { status: 503 },
      )
    }

    const planLabel = order.planType
      ? PLAN_TYPE_LABELS[order.planType as keyof typeof PLAN_TYPE_LABELS] || order.planType
      : '会员'

    const native = await createNativePayOrder(config, {
      description: `脚本工坊${planLabel}`,
      outTradeNo: order.orderNo,
      amountYuan: Number(order.amount),
    })

    return NextResponse.json({
      success: true,
      codeUrl: native.codeUrl,
      order: {
        id: order.id,
        order_no: order.orderNo,
        amount: Number(order.amount),
        status: order.status,
      },
      wechatPayConfigured: isWechatPayConfigured(),
    })
  } catch (error) {
    console.error('创建微信支付失败:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '创建支付失败' },
      { status: 500 },
    )
  }
}
