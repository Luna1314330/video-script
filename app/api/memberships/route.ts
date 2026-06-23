import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { activateUserMembership } from '@/lib/activate-membership'
import { getUserMembershipActive } from '@/lib/generation-quota'
import { getDb } from '@/lib/db/index'
import { isMembershipActive } from '@/lib/db/tables'
import { memberships } from '@/lib/db/schema'
import { requireAuthUser } from '@/lib/require-auth'
import {
  ensureSiteSettingsHydrated,
  getSiteSettings,
  isMembershipPlanEnabled,
  toAdminApiPayload,
} from '@/lib/site-settings'

export async function GET(request: NextRequest) {
  try {
    const auth = await requireAuthUser(request)
    if (!auth.ok) {
      return NextResponse.json({ error: auth.message }, { status: auth.status })
    }

    const db = getDb()
    if (db) {
      await ensureSiteSettingsHydrated(db)
    }

    let membership = null
    if (db) {
      const rows = await db
        .select()
        .from(memberships)
        .where(eq(memberships.userId, auth.user.id))
        .limit(1)
      membership = rows[0] ?? null
    }

    const active = membership
      ? isMembershipActive(membership.status, membership.expiresAt)
      : false

    return NextResponse.json({
      success: true,
      membership: membership
        ? {
            id: membership.id,
            status: active ? 'active' : membership.status,
            plan_type: membership.planType,
            starts_at: membership.startsAt,
            expires_at: membership.expiresAt,
          }
        : { status: 'free', plan_type: null },
      pricing: toAdminApiPayload(getSiteSettings()).membership_pricing,
    })
  } catch (error) {
    console.error('获取会员信息错误:', error)
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

    const body = await request.json()
    const { type, payment_method = 'wechat' } = body

    if (!isMembershipPlanEnabled(type)) {
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
      type,
      source: 'user',
      paymentMethod: payment_method,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: result.status })
    }

    return NextResponse.json({
      success: true,
      membership: {
        id: result.membershipId,
        status: 'active',
        plan_type: result.planType,
        starts_at: result.startsAt,
        expires_at: result.expiresAt,
      },
      order: {
        id: result.orderId,
        order_no: result.orderNo,
        amount: result.amount,
      },
    })
  } catch (error) {
    console.error('开通会员错误:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
