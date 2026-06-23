import { and, desc, eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db/index'
import { memberships, orders, userProfiles } from '@/lib/db/schema'
import { mapAdminOrder } from '@/lib/db/tables'
import { requireAdminApi } from '@/lib/admin-auth-server'

export async function GET(request: NextRequest) {
  const denied = requireAdminApi(request)
  if (denied) return denied

  const db = getDb()
  if (!db) {
    return NextResponse.json({ success: false, error: '数据库未配置，请设置 DATABASE_URL' }, { status: 503 })
  }

  try {
    const rows = await db
      .select({
        id: orders.id,
        userId: orders.userId,
        orderNo: orders.orderNo,
        amount: orders.amount,
        paymentMethod: orders.paymentMethod,
        status: orders.status,
        paidAt: orders.paidAt,
        createdAt: orders.createdAt,
        phone: userProfiles.phone,
        nickname: userProfiles.nickname,
      })
      .from(orders)
      .leftJoin(userProfiles, eq(orders.userId, userProfiles.id))
      .orderBy(desc(orders.createdAt))

    const result = rows.map((row) =>
      mapAdminOrder({
        id: row.id,
        user_id: row.userId,
        order_no: row.orderNo,
        amount: row.amount,
        payment_method: row.paymentMethod,
        status: row.status,
        paid_at: row.paidAt,
        created_at: row.createdAt,
        user_profiles: { phone: row.phone, nickname: row.nickname },
      }),
    )

    return NextResponse.json({ success: true, data: result })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '服务器错误'
    console.error('获取订单列表异常:', error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const denied = requireAdminApi(request)
  if (denied) return denied

  const db = getDb()
  if (!db) {
    return NextResponse.json({ success: false, error: '数据库未配置' }, { status: 503 })
  }

  try {
    const body = await request.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json({ success: false, error: '缺少必要参数' }, { status: 400 })
    }

    if (status === 'refunded') {
      const orderRows = await db
        .select({
          userId: orders.userId,
          paymentMethod: orders.paymentMethod,
          orderNo: orders.orderNo,
        })
        .from(orders)
        .where(eq(orders.id, id))
        .limit(1)

      const order = orderRows[0]
      if (!order) {
        return NextResponse.json({ success: false, error: '订单不存在' }, { status: 404 })
      }

      const manual =
        order.paymentMethod === 'manual' || (order.orderNo || '').startsWith('MAN')
      if (manual) {
        return NextResponse.json(
          { success: false, error: '手动开通订单不支持退款，请在会员管理中关闭会员' },
          { status: 400 },
        )
      }
    }

    await db.update(orders).set({ status }).where(eq(orders.id, id))

    if (status === 'refunded') {
      const orderRows = await db
        .select({ userId: orders.userId })
        .from(orders)
        .where(eq(orders.id, id))
        .limit(1)

      const order = orderRows[0]
      if (order) {
        await db
          .update(memberships)
          .set({ status: 'cancelled', planType: null })
          .where(
            and(eq(memberships.userId, order.userId), eq(memberships.status, 'active')),
          )
      }
    }

    return NextResponse.json({ success: true, message: '订单状态更新成功' })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '服务器错误'
    console.error('更新订单状态异常:', error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
