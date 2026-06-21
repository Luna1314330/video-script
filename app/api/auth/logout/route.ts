import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseClient } from '@/storage/database/supabase-client'

// 登出
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')
    
    // 如果有 token，验证并登出
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const supabase = getSupabaseClient(token)
      
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('登出错误:', error)
      }
    }

    return NextResponse.json({
      success: true,
      message: '已成功登出',
    })
  } catch (error) {
    console.error('登出错误:', error)
    return NextResponse.json(
      { error: '服务器错误' },
      { status: 500 }
    )
  }
}
