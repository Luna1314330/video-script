import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/storage/database/supabase-client'

// 获取当前用户的会员信息
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '未提供认证令牌' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const supabase = getSupabaseClient(token)

    // 验证 token 并获取用户
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: '无效的认证令牌' },
        { status: 401 }
      )
    }

    // 获取当前有效会员
    const today = new Date().toISOString().split('T')[0]
    const { data: membership, error: membershipError } = await supabase
      .from('memberships')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .lte('expire_at', today)
      .maybeSingle()

    // 如果没有已过期的，再查一下有没有未过期的
    let activeMembership = null
    if (!membership) {
      const { data: validMembership } = await supabase
        .from('memberships')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .gte('expire_at', today)
        .maybeSingle()
      activeMembership = validMembership
    }

    // 获取系统设置（会员价格配置）
    const { data: settings } = await supabase
      .from('system_settings')
      .select('*')
      .eq('id', 'membership_pricing')
      .maybeSingle()

    return NextResponse.json({
      success: true,
      membership: activeMembership || membership,
      pricing: settings?.value || null,
    })
  } catch (error) {
    console.error('获取会员信息错误:', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}

// 开通会员
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: '未提供认证令牌' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const supabase = getSupabaseClient(token)

    // 验证 token 并获取用户
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      return NextResponse.json(
        { error: '无效的认证令牌' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { type } = body // monthly, quarterly, yearly

    if (!['monthly', 'quarterly', 'yearly'].includes(type)) {
      return NextResponse.json(
        { error: '无效的会员类型' },
        { status: 400 }
      )
    }

    // 检查是否已有有效会员
    const today = new Date().toISOString().split('T')[0]
    const { data: existingMembership } = await supabase
      .from('memberships')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .gte('expire_at', today)
      .maybeSingle()

    if (existingMembership) {
      return NextResponse.json(
        { error: '您已有有效会员，无需重复购买' },
        { status: 400 }
      )
    }

    // 计算过期时间
    const startDate = new Date()
    const expireDate = new Date()
    
    switch (type) {
      case 'monthly':
        expireDate.setMonth(expireDate.getMonth() + 1)
        break
      case 'quarterly':
        expireDate.setMonth(expireDate.getMonth() + 3)
        break
      case 'yearly':
        expireDate.setFullYear(expireDate.getFullYear() + 1)
        break
    }

    // 创建会员记录
    const { data: newMembership, error: membershipError } = await supabase
      .from('memberships')
      .insert({
        user_id: user.id,
        type,
        status: 'active',
        start_at: startDate.toISOString().split('T')[0],
        expire_at: expireDate.toISOString().split('T')[0],
        auto_renew: false,
      })
      .select()
      .single()

    if (membershipError) {
      console.error('创建会员失败:', membershipError)
      return NextResponse.json(
        { error: '开通会员失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      membership: {
        id: newMembership.id,
        type: newMembership.type,
        status: newMembership.status,
        start_at: newMembership.start_at,
        expire_at: newMembership.expire_at,
      },
    })
  } catch (error) {
    console.error('开通会员错误:', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}
