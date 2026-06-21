import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/storage/database/supabase-client'

// 获取当前用户信息
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

    // 获取用户 profiles
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      console.error('获取 profiles 失败:', profileError)
    }

    // 获取用户会员状态
    const { data: membership, error: membershipError } = await supabase
      .from('memberships')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .gte('expire_at', new Date().toISOString().split('T')[0])
      .maybeSingle()

    if (membershipError) {
      console.error('获取会员信息失败:', membershipError)
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        nickname: profile?.nickname,
        avatar: profile?.avatar,
        status: profile?.status,
      },
      membership: membership ? {
        type: membership.type,
        status: membership.status,
        start_at: membership.start_at,
        expire_at: membership.expire_at,
      } : null,
    })
  } catch (error) {
    console.error('获取用户信息错误:', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}
