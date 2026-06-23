import { NextRequest, NextResponse } from 'next/server'
import { activateUserMembership } from '@/lib/activate-membership'
import { mockAdminMembershipsResponse } from '@/lib/admin-api-mock'
import {
  DB,
  mapAdminMembership,
  USER_PROFILE_EMBED,
} from '@/lib/db/tables'
import { ensureSiteSettingsHydrated } from '@/lib/site-settings'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdminApi } from '@/lib/admin-auth-server'

// GET - 获取所有会员列表
export async function GET(request: NextRequest) {
  const denied = requireAdminApi(request)
  if (denied) return denied

  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) {
    return NextResponse.json(mockAdminMembershipsResponse())
  }

  try {
    await ensureSiteSettingsHydrated(supabaseAdmin)

    const { data: memberships, error: membershipsError } = await supabaseAdmin
      .from(DB.memberships)
      .select(`*, ${USER_PROFILE_EMBED}`)
      .order('starts_at', { ascending: false })

    if (membershipsError) {
      console.error('获取会员列表失败:', membershipsError)
      return NextResponse.json({ success: false, error: membershipsError.message }, { status: 500 })
    }

    const result = (memberships || []).map(mapAdminMembership)
    return NextResponse.json({ success: true, data: result })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '服务器错误'
    console.error('获取会员列表异常:', error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

// POST - 管理员手动开通/续费会员
export async function POST(request: NextRequest) {
  const denied = requireAdminApi(request)
  if (denied) return denied

  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) {
    return NextResponse.json({ success: false, error: 'Supabase 未配置' }, { status: 503 })
  }

  try {
    await ensureSiteSettingsHydrated(supabaseAdmin)

    const body = await request.json()
    const { userId, type } = body

    const result = await activateUserMembership(supabaseAdmin, {
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

// PUT - 更新会员状态
export async function PUT(request: NextRequest) {
  const denied = requireAdminApi(request)
  if (denied) return denied

  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) {
    return NextResponse.json({ success: false, error: 'Supabase 未配置' }, { status: 503 })
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

    const updatePayload: { status: string; plan_type?: string | null } = { status }
    if (status !== 'active') {
      updatePayload.plan_type = null
    }

    const { error } = await supabaseAdmin
      .from(DB.memberships)
      .update(updatePayload)
      .eq('id', id)

    if (error) {
      console.error('更新会员状态失败:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: '会员状态更新成功' })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '服务器错误'
    console.error('更新会员状态异常:', error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
