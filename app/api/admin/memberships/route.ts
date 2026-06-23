import { desc, eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { activateUserMembership } from '@/lib/activate-membership'
import { getDb } from '@/lib/db/index'
import { memberships, userProfiles } from '@/lib/db/schema'
import { mapAdminMembership } from '@/lib/db/tables'
import { ensureSiteSettingsHydrated } from '@/lib/site-settings'
import { requireAdminApi } from '@/lib/admin-auth-server'

export async function GET(request: NextRequest) {
  const denied = requireAdminApi(request)
  if (denied) return denied

  const db = getDb()
  if (!db) {
    return NextResponse.json({ success: false, error: '数据库未配置，请设置 DATABASE_URL' }, { status: 503 })
  }

  try {
    await ensureSiteSettingsHydrated(db)

    const rows = await db
      .select({
        id: memberships.id,
        userId: memberships.userId,
        status: memberships.status,
        planType: memberships.planType,
        startsAt: memberships.startsAt,
        expiresAt: memberships.expiresAt,
        phone: userProfiles.phone,
        nickname: userProfiles.nickname,
      })
      .from(memberships)
      .leftJoin(userProfiles, eq(memberships.userId, userProfiles.id))
      .orderBy(desc(memberships.startsAt))

    const result = rows.map((row) =>
      mapAdminMembership({
        id: row.id,
        user_id: row.userId,
        status: row.status,
        plan_type: row.planType,
        starts_at: row.startsAt,
        expires_at: row.expiresAt,
        user_profiles: { phone: row.phone, nickname: row.nickname },
      }),
    )

    return NextResponse.json({ success: true, data: result })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '服务器错误'
    console.error('获取会员列表异常:', error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const denied = requireAdminApi(request)
  if (denied) return denied

  const db = getDb()
  if (!db) {
    return NextResponse.json({ success: false, error: '数据库未配置' }, { status: 503 })
  }

  try {
    await ensureSiteSettingsHydrated(db)

    const body = await request.json()
    const { userId, type } = body

    const result = await activateUserMembership(db, {
      userId,
      type,
      source: 'admin',
      paymentMethod: 'manual',
    })

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.message },
        { status: result.status },
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        id: result.membershipId,
        orderId: result.orderId,
        orderNo: result.orderNo,
        startsAt: result.startsAt,
        expiresAt: result.expiresAt,
        amount: result.amount,
        planType: result.planType,
      },
      message: '会员开通成功，已同步生成订单记录',
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '服务器错误'
    console.error('开通会员异常:', error)
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

    const allowed = ['free', 'active', 'expired', 'cancelled']
    if (!allowed.includes(status)) {
      return NextResponse.json({ success: false, error: '无效的会员状态' }, { status: 400 })
    }

    const updatePayload: {
      status: string
      planType?: string | null
    } = { status }

    if (status !== 'active') {
      updatePayload.planType = null
    }

    await db.update(memberships).set(updatePayload).where(eq(memberships.id, id))

    return NextResponse.json({ success: true, message: '会员状态更新成功' })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '服务器错误'
    console.error('更新会员状态异常:', error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
