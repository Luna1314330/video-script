import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAuthClient } from '@/lib/supabase-auth'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization')

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      const supabaseAuth = getSupabaseAuthClient()
      if (supabaseAuth) {
        const { error } = await supabaseAuth.auth.signOut()
        if (error) {
          console.error('登出错误:', error)
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: '已成功登出',
    })
  } catch (error) {
    console.error('登出错误:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
