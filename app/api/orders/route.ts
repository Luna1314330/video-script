import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db/index'
import { isMembershipActive } from '@/lib/db/tables'
import { memberships } from '@/lib/db/schema'
import { createPendingMembershipOrder } from '@/lib/orders/membership-order'
import { requireAuthUser } from '@/lib/require-auth'
import {
  ensureSiteSettingsHydrated,
  isMembershipPlanEnabled,
  isMembershipPurchaseEnabled,
} from '@/lib/site-settings'
import { listUserOrders } from '@/lib/user-orders'
import { getWechatPayStatus } from '@/lib/wechat-pay/config'

export async function GET(request: NextRequest) {
  const auth = await requireAuthUser(request)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status })
  }

  const db = getDb()
  if (!db) {
    return NextResponse.json({ error: '数据库未配置' }, { status: 503 })
  }

  try {
    const page = Number(request.nextUrl.searchParams.get('page') || '1')
    const pageSize = Number(request.nextUrl.searchParams.get('pageSize') || '20')
    const result = await listUserOrders(db, auth.user.id, { page, pageSize })

    return NextResponse.json({
      success: true,
      items: result.items,
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    })
  } catch (error) {
    console.error('获取订单列表失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

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

    if (!isMembershipPurchaseEnabled()) {
      return NextResponse.json(
        { error: '当前为免费体验期，暂不支持在线购买会员' },
        { status: 403 },
      )
    }

    const body = await request.json()
    const { plan_id, payment_method = 'wechat' } = body

    if (!isMembershipPlanEnabled(plan_id)) {
      return NextResponse.json({ error: '该会员套餐暂未开放' }, { status: 400 })
    }

    if (payment_method !== 'wechat') {
      return NextResponse.json({ error: '当前仅支持微信支付' }, { status: 400 })
    }

    const existingRows = await db
      .select()
      .from(memberships)
      .where(eq(memberships.userId, auth.user.id))
      .limit(1)

    const existingMembership = existingRows[0]
    if (
      existingMembership &&
      isMembershipActive(existingMembership.status, existingMembership.expiresAt)
    ) {
      return NextResponse.json({ error: '您已有有效会员，无需重复购买' }, { status: 400 })
    }

    const result = await createPendingMembershipOrder(db, {
      userId: auth.user.id,
      planType: plan_id,
      paymentMethod: 'wechat',
    })

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: result.status })
    }

    const wechatPay = getWechatPayStatus()

    return NextResponse.json({
      success: true,
      order: {
        id: result.orderId,
        order_no: result.orderNo,
        amount: result.amount,
        status: result.status,
        plan_type: result.planType,
      },
      payment: {
        method: 'wechat',
        wechatPay,
      },
    })
  } catch (error) {
    console.error('创建订单错误:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
