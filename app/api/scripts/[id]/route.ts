import { NextRequest, NextResponse } from 'next/server'
import { deleteUserScriptHistory } from '@/lib/script-history'
import { getDb } from '@/lib/db/index'
import { requireAuthUser } from '@/lib/require-auth'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuthUser(request)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status })
  }

  const db = getDb()
  if (!db) {
    return NextResponse.json({ error: '数据库未配置' }, { status: 503 })
  }

  try {
    const { id } = await params
    const deleted = await deleteUserScriptHistory(db, auth.user.id, id)
    if (!deleted) {
      return NextResponse.json({ error: '记录不存在' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('删除脚本历史失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
