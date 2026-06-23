import { NextRequest, NextResponse } from 'next/server'
import { createAdminUser } from '@/lib/admin-users'
import { mockAdminUsersResponse } from '@/lib/admin-api-mock'
import { DB, mapAdminUser } from '@/lib/db/tables'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdminApi } from '@/lib/admin-auth-server'

// GET /api/admin/users - 获取所有用户列表
export async function GET(request: NextRequest) {
  const denied = requireAdminApi(request)
  if (denied) return denied

  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) {
    return NextResponse.json(mockAdminUsersResponse())
  }

  try {
    const [{ data: profiles, error }, { data: memberships }] = await Promise.all([
      supabaseAdmin
        .from(DB.userProfiles)
        .select('*')
        .order('created_at', { ascending: false }),
      supabaseAdmin
        .from(DB.memberships)
        .select('user_id, status, expires_at, plan_type'),
    ])

    if (error) {
      console.error('获取用户列表失败:', error)
      return NextResponse.json(
        { success: false, message: '获取用户列表失败', error: error.message },
        { status: 500 },
      )
    }

    const membershipByUser = new Map(
      (memberships || []).map((m) => [m.user_id, m]),
    )
    const result = (profiles || []).map((profile) =>
      mapAdminUser(profile, membershipByUser.get(profile.id)),
    )

    return NextResponse.json({ success: true, data: result })
  } catch (err) {
    console.error('获取用户列表异常:', err)
    return NextResponse.json({ success: false, message: '服务器错误' }, { status: 500 })
  }
}

// POST /api/admin/users - 手动添加用户（Auth + user_profiles + memberships）
export async function POST(request: NextRequest) {
  const denied = requireAdminApi(request)
  if (denied) return denied

  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) {
    return NextResponse.json({ success: false, message: 'Supabase 未配置，无法添加用户' }, { status: 503 })
  }

  try {
    const body = await request.json()
    const result = await createAdminUser(supabaseAdmin, body)

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: result.status },
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: result.initialPassword
        ? `用户已创建，初始密码：${result.initialPassword}`
        : '用户已创建',
    })
  } catch (err) {
    console.error('添加用户异常:', err)
    return NextResponse.json({ success: false, message: '服务器错误' }, { status: 500 })
  }
}

// PUT /api/admin/users - 封禁/解封用户
export async function PUT(request: NextRequest) {
  const denied = requireAdminApi(request)
  if (denied) return denied

  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) {
    return NextResponse.json({ success: false, message: 'Supabase 未配置' }, { status: 503 })
  }

  try {
    const body = await request.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json({ success: false, message: '缺少必要参数' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from(DB.userProfiles)
      .update({ is_active: status !== 'banned' })
      .eq('id', id)

    if (error) {
      console.error('更新用户状态失败:', error)
      return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: '用户状态更新成功' })
  } catch (err) {
    console.error('更新用户状态异常:', err)
    return NextResponse.json({ success: false, message: '服务器错误' }, { status: 500 })
  }
}
