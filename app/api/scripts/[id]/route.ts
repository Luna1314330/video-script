import { NextRequest, NextResponse } from 'next/server'
import { deleteUserScriptHistory } from '@/lib/script-history'
import { requireAuthUser } from '@/lib/require-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuthUser(_request)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status })
  }

  const { id } = await context.params
  if (!id) {
    return NextResponse.json({ error: '缺少记录 ID' }, { status: 400 })
  }

  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase 未配置' }, { status: 503 })
  }

  try {
    const deleted = await deleteUserScriptHistory(supabaseAdmin, auth.user.id, id)
    if (!deleted) {
      return NextResponse.json({ error: '记录不存在' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('删除脚本历史失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
