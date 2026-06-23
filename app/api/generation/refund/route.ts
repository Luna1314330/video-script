import { NextRequest, NextResponse } from 'next/server'
import { refundScriptGenerationQuota } from '@/lib/generation-quota'
import { getDb } from '@/lib/db/index'
import { requireAuthUser } from '@/lib/require-auth'

export async function POST(request: NextRequest) {
  const auth = await requireAuthUser(request)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status })
  }

  const db = getDb()
  if (!db) {
    return NextResponse.json({ error: '数据库未配置' }, { status: 503 })
  }

  try {
    const body = (await request.json()) as { logId?: string }
    if (!body.logId) {
      return NextResponse.json({ error: '缺少 logId' }, { status: 400 })
    }

    const result = await refundScriptGenerationQuota(db, auth.user.id, body.logId)
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('退还额度失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
