import { NextRequest, NextResponse } from 'next/server'
import { listUserScriptHistory } from '@/lib/script-history'
import { requireAuthUser } from '@/lib/require-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  const auth = await requireAuthUser(request)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status })
  }

  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase 未配置' }, { status: 503 })
  }

  try {
    const page = Number(request.nextUrl.searchParams.get('page') || 1)
    const pageSize = Number(request.nextUrl.searchParams.get('pageSize') || 50)

    const result = await listUserScriptHistory(supabaseAdmin, auth.user.id, {
      page,
      pageSize,
    })

    return NextResponse.json({
      success: true,
      data: result.items,
      pagination: {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        totalPages: Math.max(1, Math.ceil(result.total / result.pageSize)),
      },
    })
  } catch (error) {
    console.error('获取脚本历史失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
