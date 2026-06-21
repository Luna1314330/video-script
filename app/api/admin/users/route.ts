import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// GET /api/admin/users - 获取所有用户列表
export async function GET() {
  try {
    const { data: profiles, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('获取用户列表失败:', error)
      return NextResponse.json({ success: false, message: '获取用户列表失败', error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: profiles || [] })
  } catch (err) {
    console.error('获取用户列表异常:', err)
    return NextResponse.json({ success: false, message: '服务器错误' }, { status: 500 })
  }
}

// POST /api/admin/users - 添加用户
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, nickname } = body

    if (!phone) {
      return NextResponse.json({ success: false, message: '手机号不能为空' }, { status: 400 })
    }

    // 检查手机号是否已存在
    const { data: existing } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('phone', phone)
      .single()

    if (existing) {
      return NextResponse.json({ success: false, message: '该手机号已存在' }, { status: 400 })
    }

    // 创建用户（使用 service_role 密钥）
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .insert({
        phone,
        nickname: nickname || `用户${phone.slice(-4)}`,
        is_banned: false,
      })
      .select()
      .single()

    if (error) {
      console.error('添加用户失败:', error)
      return NextResponse.json({ success: false, message: '添加用户失败', error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error('添加用户异常:', err)
    return NextResponse.json({ success: false, message: '服务器错误' }, { status: 500 })
  }
}
