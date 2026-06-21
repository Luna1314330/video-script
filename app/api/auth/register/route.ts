import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/storage/database/supabase-client'

// 注册
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, phone, nickname } = body

    // 验证必填字段
    if (!email || !password) {
      return NextResponse.json(
        { error: '邮箱和密码不能为空' },
        { status: 400 }
      )
    }

    const supabase = getSupabaseClient()

    // 使用 Supabase Auth 注册
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        phone: phone || null,
        nickname: nickname || email.split('@')[0],
      },
    })

    if (authError) {
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    // 创建用户 profiles
    const { error: profileError } = await supabase.from('profiles').insert({
      id: authData.user.id,
      phone: phone || null,
      nickname: nickname || email.split('@')[0],
      status: 'active',
    })

    if (profileError) {
      console.error('创建 profiles 失败:', profileError)
    }

    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        phone: authData.user.phone,
      },
    })
  } catch (error) {
    console.error('注册错误:', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}
