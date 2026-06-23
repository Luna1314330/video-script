import { NextRequest, NextResponse } from 'next/server'
import { refundScriptGenerationQuota } from '@/lib/generation-quota'
import { requireAuthUser } from '@/lib/require-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  const auth = await requireAuthUser(request)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status })
  }

  const body = (await request.json()) as { generationLogId?: string }
  if (!body.generationLogId) {
    return NextResponse.json({ error: '缺少 generationLogId' }, { status: 400 })
  }

  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase 未配置' }, { status: 503 })
  }

  try {
    const result = await refundScriptGenerationQuota(
      supabaseAdmin,
      auth.user.id,
      body.generationLogId,
    )
    return NextResponse.json({
      success: true,
      refunded: result.refunded,
      quota: result.quota,
    })
  } catch (error) {
    console.error('退还额度失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
