import { NextRequest, NextResponse } from 'next/server'
import { mockAdminOrdersResponse } from '@/lib/admin-api-mock'
import {
  DB,
  mapAdminOrder,
  USER_PROFILE_EMBED,
} from '@/lib/db/tables'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdminApi } from '@/lib/admin-auth-server'

// GET - 获取所有订单
export async function GET(request: NextRequest) {
  const denied = requireAdminApi(request)
  if (denied) return denied

  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) {
    return NextResponse.json(mockAdminOrdersResponse())
  }

  try {
    const { data: orders, error } = await supabaseAdmin
      .from(DB.orders)
      .select(`*, ${USER_PROFILE_EMBED}`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('获取订单列表失败:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    const result = (orders || []).map(mapAdminOrder)
    return NextResponse.json({ success: true, data: result })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '服务器错误'
    console.error('获取订单列表异常:', error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

// PUT - 更新订单状态（退款）
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

    if (status === 'refunded') {
      const { data: order, error: orderError } = await supabaseAdmin
        .from(DB.orders)
        .select('user_id, payment_method, order_no')
        .eq('id', id)
        .single()

      if (orderError || !order) {
        return NextResponse.json({ success: false, error: '订单不存在' }, { status: 404 })
      }

      const manual =
        order.payment_method === 'manual' || (order.order_no || '').startsWith('MAN')
      if (manual) {
        return NextResponse.json(
          { success: false, error: '手动开通订单不支持退款，请在会员管理中关闭会员' },
          { status: 400 },
        )
      }
    }

    const { error } = await supabaseAdmin
      .from(DB.orders)
      .update({ status })
      .eq('id', id)

    if (error) {
      console.error('更新订单状态失败:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    if (status === 'refunded') {
      const { data: order } = await supabaseAdmin
        .from(DB.orders)
        .select('user_id')
        .eq('id', id)
        .single()

      if (order) {
        await supabaseAdmin
          .from(DB.memberships)
          .update({ status: 'cancelled', plan_type: null })
          .eq('user_id', order.user_id)
          .eq('status', 'active')
      }
    }

    return NextResponse.json({ success: true, message: '订单状态更新成功' })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '服务器错误'
    console.error('更新订单状态异常:', error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
