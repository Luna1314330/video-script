import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// GET - 获取所有会员列表
export async function GET() {
  try {
    // 查询会员信息，关联用户数据
    const { data: memberships, error: membershipsError } = await supabaseAdmin
      .from('memberships')
      .select(`
        *,
        profiles:user_id (
          id,
          phone,
          nickname,
          created_at
        )
      `)
      .order('created_at', { ascending: false })

    if (membershipsError) {
      console.error('获取会员列表失败:', membershipsError)
      return NextResponse.json({ success: false, error: membershipsError.message }, { status: 500 })
    }

    // 转换数据格式
    const result = (memberships || []).map((m: any) => ({
      id: m.id,
      userId: m.user_id,
      phone: m.profiles?.phone || '',
      nickname: m.profiles?.nickname || '',
      type: m.membership_type,
      startDate: m.start_date,
      expireDate: m.expire_date,
      status: m.status,
      createdAt: m.created_at,
    }))

    return NextResponse.json({ success: true, data: result })
  } catch (error: any) {
    console.error('获取会员列表异常:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// POST - 开通/续费会员
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, type } = body

    if (!userId || !type) {
      return NextResponse.json({ success: false, error: '缺少必要参数' }, { status: 400 })
    }

    // 计算到期时间
    const now = new Date()
    let expireDate = new Date()
    
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
      default:
        return NextResponse.json({ success: false, error: '无效的会员类型' }, { status: 400 })
    }

    // 检查是否已有会员
    const { data: existing, error: existingError } = await supabaseAdmin
      .from('memberships')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .single()

    if (existingError && existingError.code !== 'PGRST116') {
      console.error('查询会员失败:', existingError)
      return NextResponse.json({ success: false, error: existingError.message }, { status: 500 })
    }

    let membershipId: string

    if (existing) {
      // 续费：延长到期时间
      const newExpireDate = new Date(existing.expire_date)
      if (newExpireDate > now) {
        // 如果会员未过期，从到期日延长
        switch (type) {
          case 'monthly':
            newExpireDate.setMonth(newExpireDate.getMonth() + 1)
            break
          case 'quarterly':
            newExpireDate.setMonth(newExpireDate.getMonth() + 3)
            break
          case 'yearly':
            newExpireDate.setFullYear(newExpireDate.getFullYear() + 1)
            break
        }
        expireDate = newExpireDate
      }

      const { data, error } = await supabaseAdmin
        .from('memberships')
        .update({
          membership_type: type,
          expire_date: expireDate.toISOString(),
          updated_at: now.toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) {
        console.error('续费会员失败:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
      }
      membershipId = data.id
    } else {
      // 新开通
      const { data, error } = await supabaseAdmin
        .from('memberships')
        .insert({
          user_id: userId,
          membership_type: type,
          start_date: now.toISOString(),
          expire_date: expireDate.toISOString(),
          status: 'active',
        })
        .select()
        .single()

      if (error) {
        console.error('开通会员失败:', error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
      }
      membershipId = data.id
    }

    return NextResponse.json({ 
      success: true, 
      data: { id: membershipId },
      message: '会员开通成功' 
    })
  } catch (error: any) {
    console.error('开通会员异常:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// PUT - 更新会员状态
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json({ success: false, error: '缺少必要参数' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('memberships')
      .update({ 
        status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      console.error('更新会员状态失败:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: '会员状态更新成功' })
  } catch (error: any) {
    console.error('更新会员状态异常:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
