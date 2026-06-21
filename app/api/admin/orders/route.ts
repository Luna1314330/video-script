import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// GET - 获取所有订单
export async function GET() {
  try {
    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select(`
        *,
        profiles:user_id (
          id,
          phone,
          nickname
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('获取订单列表失败:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    // 转换数据格式
    const result = (orders || []).map((o: any) => ({
      id: o.id,
      orderNo: o.order_no,
      userId: o.user_id,
      phone: o.profiles?.phone || '',
      nickname: o.profiles?.nickname || '',
      type: o.membership_type,
      amount: o.amount,
      paymentMethod: o.payment_method,
      status: o.status,
      createdAt: o.created_at,
    }))

    return NextResponse.json({ success: true, data: result })
  } catch (error: any) {
    console.error('获取订单列表异常:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// PUT - 更新订单状态（退款）
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json({ success: false, error: '缺少必要参数' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('orders')
      .update({ 
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      console.error('更新订单状态失败:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    // 如果是退款，同时关闭会员
    if (status === 'refunded') {
      const { data: order } = await supabaseAdmin
        .from('orders')
        .select('user_id, membership_type')
        .eq('id', id)
        .single()

      if (order) {
        await supabaseAdmin
          .from('memberships')
          .update({ status: 'cancelled' })
          .eq('user_id', order.user_id)
          .eq('membership_type', order.membership_type)
          .eq('status', 'active')
      }
    }

    return NextResponse.json({ success: true, message: '订单状态更新成功' })
  } catch (error: any) {
    console.error('更新订单状态异常:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
