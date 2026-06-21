import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: '未授权' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    const supabase = createClient(token)

    // 验证用户
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: '用户验证失败' }, { status: 401 })
    }

    const body = await request.json()
    const { plan_id, amount, payment_method = 'mock' } = body

    // 计算到期时间
    const now = new Date()
    let expires_at = new Date(now)

    switch (plan_id) {
      case 'monthly':
        expires_at.setMonth(expires_at.getMonth() + 1)
        break
      case 'quarterly':
        expires_at.setMonth(expires_at.getMonth() + 3)
        break
      case 'yearly':
        expires_at.setFullYear(expires_at.getFullYear() + 1)
        break
      default:
        return NextResponse.json({ error: '无效的套餐' }, { status: 400 })
    }

    // 创建订单
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: user.id,
        plan_id,
        amount: amount || 0,
        payment_method,
        payment_status: 'paid',
        created_at: now.toISOString()
      })
      .select()
      .single()

    if (orderError) {
      console.error('创建订单失败:', orderError)
      return NextResponse.json({ error: '创建订单失败' }, { status: 500 })
    }

    // 更新或创建会员记录
    const { data: existingMembership } = await supabase
      .from('memberships')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (existingMembership) {
      // 累加会员时长
      const currentExpiry = new Date(existingMembership.expires_at)
      if (currentExpiry > now) {
        currentExpiry.setMonth(currentExpiry.getMonth() + (plan_id === 'monthly' ? 1 : plan_id === 'quarterly' ? 3 : 12))
        expires_at = currentExpiry
      }

      await supabase
        .from('memberships')
        .update({
          plan_id,
          status: 'active',
          expires_at: expires_at.toISOString(),
          updated_at: now.toISOString()
        })
        .eq('user_id', user.id)
    } else {
      await supabase
        .from('memberships')
        .insert({
          user_id: user.id,
          plan_id,
          status: 'active',
          expires_at: expires_at.toISOString(),
          created_at: now.toISOString()
        })
    }

    return NextResponse.json({
      success: true,
      message: '购买成功',
      order_id: order.id,
      expires_at: expires_at.toISOString()
    })
  } catch (error) {
    console.error('订单处理错误:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
