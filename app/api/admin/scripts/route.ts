import { eq, inArray } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { mockAdminScriptsResponse } from '@/lib/admin-api-mock'
import { getDb } from '@/lib/db/index'
import { userProfiles } from '@/lib/db/schema'
import { mapAdminScript } from '@/lib/db/tables'
import { listAdminScriptHistory } from '@/lib/script-history'
import { requireAdminApi } from '@/lib/admin-auth-server'

export async function GET(request: NextRequest) {
  const denied = requireAdminApi(request)
  if (denied) return denied

  const db = getDb()
  if (!db) {
    return NextResponse.json(mockAdminScriptsResponse())
  }

  try {
    const keyword = request.nextUrl.searchParams.get('keyword') || ''
    const scripts = await listAdminScriptHistory(db, keyword)

    const userIds = [...new Set(scripts.map((s) => s.user_id))]
    const profiles =
      userIds.length > 0
        ? await db
            .select({
              id: userProfiles.id,
              phone: userProfiles.phone,
              nickname: userProfiles.nickname,
            })
            .from(userProfiles)
            .where(inArray(userProfiles.id, userIds))
        : []

    const profileMap = new Map(profiles.map((p) => [p.id, p]))

    const result = scripts.map((row) => {
      const profile = profileMap.get(row.user_id)
      return mapAdminScript({
        ...row,
        user_profiles: profile
          ? { phone: profile.phone, nickname: profile.nickname }
          : undefined,
      })
    })

    return NextResponse.json({ success: true, data: result })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '服务器错误'
    console.error('获取脚本历史异常:', error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
