import { NextRequest, NextResponse } from 'next/server'
import { getGenerationQuota } from '@/lib/generation-quota'
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
    const quota = await getGenerationQuota(supabaseAdmin, auth.user.id)
    return NextResponse.json({ success: true, data: quota })
  } catch (error) {
    console.error('获取额度失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
