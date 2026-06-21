import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// GET - 获取所有系统设置
export async function GET() {
  try {
    const { data: settings, error } = await supabaseAdmin
      .from('system_settings')
      .select('*')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('获取系统设置失败:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    // 转换为 key-value 格式
    const result: Record<string, any> = {}
    ;(settings || []).forEach((s: any) => {
      result[s.id] = s.value
    })

    return NextResponse.json({ success: true, data: result })
  } catch (error: any) {
    console.error('获取系统设置异常:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

// PUT - 更新系统设置
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    // 遍历更新每个设置
    for (const [key, value] of Object.entries(body)) {
      const { error } = await supabaseAdmin
        .from('system_settings')
        .upsert({ 
          id: key, 
          value,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id',
        })

      if (error) {
        console.error(`更新设置 ${key} 失败:`, error)
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, message: '设置保存成功' })
  } catch (error: any) {
    console.error('保存设置异常:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
