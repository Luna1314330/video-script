import { NextRequest, NextResponse } from 'next/server'
import { activateUserMembership } from '@/lib/activate-membership'
import { DB, isMembershipActive } from '@/lib/db/tables'
import {
  ensureSiteSettingsHydrated,
  isMembershipPlanEnabled,
} from '@/lib/site-settings'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { getSupabaseClient } from '@/storage/database/supabase-client'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const supabase = getSupabaseClient(token)

    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: '用户验证失败' }, { status: 401 })
    }

    const supabaseAdmin = getSupabaseAdmin()
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase 未配置' }, { status: 503 })
    }

    await ensureSiteSettingsHydrated(supabaseAdmin)

    const body = await request.json()
    const { plan_id, payment_method = 'wechat' } = body

    if (!plan_id || !isMembershipPlanEnabled(plan_id)) {
      return NextResponse.json({ error: '无效的套餐' }, { status: 400 })
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
      type: plan_id,
      source: 'user',
      paymentMethod: payment_method,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: result.status })
    }

    return NextResponse.json({
      success: true,
      message: '购买成功',
      order_id: result.orderId,
      order_no: result.orderNo,
      plan_type: result.planType,
      expires_at: result.expiresAt,
    })
  } catch (error) {
    console.error('订单处理错误:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
