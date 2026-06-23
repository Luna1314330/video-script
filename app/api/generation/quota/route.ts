import { NextRequest, NextResponse } from 'next/server'
import { getGenerationQuota } from '@/lib/generation-quota'
import { getDb } from '@/lib/db/index'
import { requireAuthUser } from '@/lib/require-auth'

export async function GET(request: NextRequest) {
  const auth = await requireAuthUser(request)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status })
  }

  const db = getDb()
  if (!db) {
    return NextResponse.json({ error: '数据库未配置' }, { status: 503 })
  }

  try {
    const quota = await getGenerationQuota(db, auth.user.id)
    return NextResponse.json({ success: true, quota })
  } catch (error) {
    console.error('获取额度失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
