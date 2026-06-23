import { NextResponse } from 'next/server'
import { getUserMembershipActive } from '@/lib/generation-quota'
import { getDb } from '@/lib/db/index'
import { requireAuthUser } from '@/lib/require-auth'
import {
  ensureSiteSettingsHydrated,
  getCustomerServiceWechat,
} from '@/lib/site-settings'

/** 会员专属：获取客服微信号 */
export async function GET(request: Request) {
  const auth = await requireAuthUser(request)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status })
  }

  const db = getDb()
  if (!db) {
    return NextResponse.json({ error: '数据库未配置' }, { status: 503 })
  }

  const isMember = await getUserMembershipActive(db, auth.user.id)
  if (!isMember) {
    return NextResponse.json({ error: '仅会员可查看专属客服' }, { status: 403 })
  }

  await ensureSiteSettingsHydrated(db)

  return NextResponse.json({
    success: true,
    wechat: getCustomerServiceWechat(),
  })
}
