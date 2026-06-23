import { NextRequest, NextResponse } from 'next/server'
import { listUserScriptHistory } from '@/lib/script-history'
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
    const page = Number(request.nextUrl.searchParams.get('page') || '1')
    const pageSize = Number(request.nextUrl.searchParams.get('pageSize') || '50')

    const result = await listUserScriptHistory(db, auth.user.id, { page, pageSize })
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('获取脚本历史失败:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
