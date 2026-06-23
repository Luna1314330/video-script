import { NextResponse } from 'next/server'
import { DB, isMembershipActive } from '@/lib/db/tables'
import { requireAuthUser } from '@/lib/require-auth'
import {
  ensureSiteSettingsHydrated,
  getCustomerServiceWechat,
} from '@/lib/site-settings'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

/** 会员专属：获取客服微信号 */
export async function GET(request: Request) {
  const auth = await requireAuthUser(request)
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status })
  }

  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Supabase 未配置' }, { status: 503 })
  }

  const { data: membership } = await supabaseAdmin
    .from(DB.memberships)
    .select('status, expires_at')
    .eq('user_id', auth.user.id)
    .maybeSingle()

  const isMember = membership
    ? isMembershipActive(membership.status, membership.expires_at)
    : false

  if (!isMember) {
    return NextResponse.json({ error: '仅会员可查看专属客服' }, { status: 403 })
  }

  await ensureSiteSettingsHydrated(supabaseAdmin)

  const wechat = getCustomerServiceWechat()

  return NextResponse.json({
    success: true,
    wechat,
  })
}
