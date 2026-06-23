import { NextRequest, NextResponse } from 'next/server'
import { mockAdminScriptsResponse } from '@/lib/admin-api-mock'
import {
  DB,
  mapAdminScript,
  USER_PROFILE_EMBED,
} from '@/lib/db/tables'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdminApi } from '@/lib/admin-auth-server'

// GET - 获取所有脚本历史
export async function GET(request: NextRequest) {
  const denied = requireAdminApi(request)
  if (denied) return denied

  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) {
    return NextResponse.json(mockAdminScriptsResponse())
  }

  try {
    const searchParams = request.nextUrl.searchParams
    const keyword = searchParams.get('keyword') || ''

    let query = supabaseAdmin
      .from(DB.scriptHistory)
      .select(`*, ${USER_PROFILE_EMBED}`)
      .order('created_at', { ascending: false })

    if (keyword) {
      query = query.or(
        `product_name.ilike.%${keyword}%,industry.ilike.%${keyword}%,topic.ilike.%${keyword}%`,
      )
    }

    const { data: scripts, error } = await query.limit(100)

    if (error) {
      console.error('获取脚本历史失败:', error)
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    const result = (scripts || []).map(mapAdminScript)
    return NextResponse.json({ success: true, data: result })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '服务器错误'
    console.error('获取脚本历史异常:', error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
