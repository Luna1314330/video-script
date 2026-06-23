import { NextRequest, NextResponse } from 'next/server'
import { validateUserPassword } from '@/lib/auth-users'
import { DB, phoneToEmail } from '@/lib/db/tables'
import { requireAuthUser } from '@/lib/require-auth'
import { getSupabaseAuthClient } from '@/lib/supabase-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthUser(request)
    if (!auth.ok) {
      return NextResponse.json(
        { success: false, message: auth.message },
        { status: auth.status },
      )
    }

    const body = (await request.json()) as {
      oldPassword?: string
      newPassword?: string
    }

    const oldPassword = body.oldPassword ?? ''
    const newPassword = body.newPassword ?? ''

    if (!oldPassword) {
      return NextResponse.json(
        { success: false, message: '请输入旧密码' },
        { status: 400 },
      )
    }

    const newPasswordError = validateUserPassword(newPassword)
    if (newPasswordError) {
      return NextResponse.json(
        { success: false, message: newPasswordError },
        { status: 400 },
      )
    }

    if (oldPassword === newPassword) {
      return NextResponse.json(
        { success: false, message: '新密码不能与旧密码相同' },
        { status: 400 },
      )
    }

    const supabaseAdmin = getSupabaseAdmin()
    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, message: 'Supabase 未配置' },
        { status: 503 },
      )
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from(DB.userProfiles)
      .select('phone, is_active')
      .eq('id', auth.user.id)
      .maybeSingle()

    if (profileError || !profile?.phone) {
      return NextResponse.json(
        { success: false, message: '用户不存在' },
        { status: 404 },
      )
    }

    if (profile.is_active === false) {
      return NextResponse.json(
        { success: false, message: '账号已被禁用' },
        { status: 403 },
      )
    }

    const supabaseAuth = getSupabaseAuthClient()
    if (!supabaseAuth) {
      return NextResponse.json(
        { success: false, message: 'Supabase 未配置' },
        { status: 503 },
      )
    }

    const { error: signInError } = await supabaseAuth.auth.signInWithPassword({
      email: phoneToEmail(profile.phone),
      password: oldPassword,
    })

    if (signInError) {
      return NextResponse.json(
        { success: false, message: '旧密码错误' },
        { status: 401 },
      )
    }

    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      auth.user.id,
      { password: newPassword },
    )

    if (updateError) {
      console.error('更新密码失败:', updateError)
      return NextResponse.json(
        { success: false, message: '修改密码失败，请稍后重试' },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      message: '密码修改成功',
    })
  } catch (error) {
    console.error('修改密码错误:', error)
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 },
    )
  }
}
