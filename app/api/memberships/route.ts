import { NextRequest, NextResponse } from 'next/server'
import { activateUserMembership } from '@/lib/activate-membership'
import { DB, isMembershipActive } from '@/lib/db/tables'
import {
  ensureSiteSettingsHydrated,
  getSiteSettings,
  isMembershipPlanEnabled,
  toAdminApiPayload,
} from '@/lib/site-settings'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { getSupabaseClient } from '@/storage/database/supabase-client'

// 获取当前用户的会员信息
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '未提供认证令牌' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const supabase = getSupabaseClient(token)

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: '无效的认证令牌' }, { status: 401 })
    }

    const supabaseAdmin = getSupabaseAdmin()
    if (supabaseAdmin) {
      await ensureSiteSettingsHydrated(supabaseAdmin)
    }

    const { data: membership, error: membershipError } = await supabase
      .from(DB.memberships)
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (membershipError) {
      console.error('获取会员信息失败:', membershipError)
    }

    const active = membership
      ? isMembershipActive(membership.status, membership.expires_at)
      : false

    return NextResponse.json({
      success: true,
      membership: membership
        ? {
            id: membership.id,
            status: active ? 'active' : membership.status,
            plan_type: membership.plan_type,
            starts_at: membership.starts_at,
            expires_at: membership.expires_at,
          }
        : { status: 'free', plan_type: null },
      pricing: toAdminApiPayload(getSiteSettings()).membership_pricing,
    })
  } catch (error) {
    console.error('获取会员信息错误:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}

// 开通会员
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: '未提供认证令牌' }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const supabase = getSupabaseClient(token)

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: '无效的认证令牌' }, { status: 401 })
    }

    const supabaseAdmin = getSupabaseAdmin()
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase 未配置' }, { status: 503 })
    }

    await ensureSiteSettingsHydrated(supabaseAdmin)

    const body = await request.json()
    const { type, payment_method = 'wechat' } = body

    if (!isMembershipPlanEnabled(type)) {
      return NextResponse.json({ error: '该会员套餐暂未开放' }, { status: 400 })
    }

    const { data: existingMembership } = await supabaseAdmin
      .from(DB.memberships)
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()

    if (existingMembership && isMembershipActive(existingMembership.status, existingMembership.expires_at)) {
      return NextResponse.json({ error: '您已有有效会员，无需重复购买' }, { status: 400 })
    }

    const result = await activateUserMembership(supabaseAdmin, {
      userId: user.id,
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
