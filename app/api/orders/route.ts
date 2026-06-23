import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { activateUserMembership } from '@/lib/activate-membership'
import { getDb } from '@/lib/db/index'
import { isMembershipActive } from '@/lib/db/tables'
import { memberships } from '@/lib/db/schema'
import { requireAuthUser } from '@/lib/require-auth'
import {
  ensureSiteSettingsHydrated,
  isMembershipPlanEnabled,
} from '@/lib/site-settings'

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
    const { plan_id, payment_method = 'wechat' } = body

    if (!isMembershipPlanEnabled(plan_id)) {
      return NextResponse.json({ error: '该会员套餐暂未开放' }, { status: 400 })
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

    const result = await activateUserMembership(db, {
      userId: auth.user.id,
      type: plan_id,
      source: 'user',
      paymentMethod: payment_method,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: result.status })
    }

    return NextResponse.json({
      success: true,
      order: {
        id: result.orderId,
        order_no: result.orderNo,
        amount: result.amount,
      },
      membership: {
        id: result.membershipId,
        status: 'active',
        plan_type: result.planType,
        starts_at: result.startsAt,
        expires_at: result.expiresAt,
      },
    })
  } catch (error) {
    console.error('创建订单错误:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
