import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db/index'
import { getMembershipOrderForUser } from '@/lib/orders/membership-order'
import { requireAuthUser } from '@/lib/require-auth'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  const auth = await requireAuthUser(request)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status })
  }

  const db = getDb()
  if (!db) {
    return NextResponse.json({ error: '数据库未配置' }, { status: 503 })
  }

  const { id } = await context.params
  const order = await getMembershipOrderForUser(db, auth.user.id, id)

  if (!order) {
    return NextResponse.json({ error: '订单不存在' }, { status: 404 })
  }

  return NextResponse.json({
    success: true,
    order: {
      id: order.id,
      order_no: order.orderNo,
      amount: Number(order.amount),
      plan_type: order.planType,
      payment_method: order.paymentMethod,
      status: order.status,
      paid_at: order.paidAt,
      created_at: order.createdAt,
    },
  })
}
