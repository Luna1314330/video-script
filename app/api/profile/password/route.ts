import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const { userId, oldPassword, newPassword } = await request.json()

    if (!userId || !oldPassword || !newPassword) {
      return NextResponse.json(
        { success: false, message: '缺少参数' },
        { status: 400 }
      )
    }

    if (newPassword.length < 6 || newPassword.length > 12) {
      return NextResponse.json(
        { success: false, message: '新密码长度需为6-12位' },
        { status: 400 }
      )
    }

    // 使用 service_role 密钥的管理端客户端
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // 获取用户信息
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('phone')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, message: '用户不存在' },
        { status: 404 }
      )
    }

    // 通过邮箱登录验证旧密码
    const { error: signInError } = await supabaseAdmin.auth.admin.signInWithPassword({
      email: `${profile.phone}@script-workshop.com`,
      password: oldPassword,
    })

    if (signInError) {
      return NextResponse.json(
        { success: false, message: '旧密码错误' },
        { status: 401 }
      )
    }

    // 获取 auth.users 中的用户
    const { data: authUser, error: listError } = await supabaseAdmin.auth.admin.listUsers()
    const targetUser = authUser?.users.find(u => u.id === userId)

    if (!targetUser) {
      return NextResponse.json(
        { success: false, message: '用户不存在' },
        { status: 404 }
      )
    }

    // 更新密码
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      targetUser.id,
      { password: newPassword }
    )

    if (updateError) {
      return NextResponse.json(
        { success: false, message: '修改密码失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '密码修改成功'
    })
  } catch (error) {
    console.error('修改密码错误:', error)
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 }
    )
  }
}
