import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

// GET - 获取所有脚本历史
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const keyword = searchParams.get('keyword') || ''

    let query = supabaseAdmin
      .from('script_history')
      .select(`
        *,
        profiles:user_id (
          id,
          phone,
          nickname
        )
      `)
      .order('created_at', { ascending: false })

    // 如果有关键词，模糊搜索
    if (keyword) {
      query = query.or(
        `product_name.ilike.%${keyword}%,industry.ilike.%${keyword}%,topic.ilike.%${keyword}%,profiles.phone.ilike.%${keyword}%`
      )
    }

    const { data: scripts, error } = await query.limit(100)

    if (error) {
      console.error('获取脚本历史失败:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    // 转换数据格式，脱敏手机号
    const result = (scripts || []).map((s: any) => {
      const phone = s.profiles?.phone || ''
      const maskedPhone = phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')
      
      return {
        id: s.id,
        userId: s.user_id,
        phone: maskedPhone,
        industry: s.industry,
        productName: s.product_name,
        productDesc: s.product_desc,
        shootScene: s.shoot_scene,
        topic: s.topic,
        generatedScript: s.generated_script,
        createdAt: s.created_at,
      }
    })

    return NextResponse.json({ success: true, data: result })
  } catch (error: any) {
    console.error('获取脚本历史异常:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
