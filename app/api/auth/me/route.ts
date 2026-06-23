import { NextRequest, NextResponse } from 'next/server'
import { DB, isMembershipActive, normalizePhone } from '@/lib/db/tables'
import { getSupabaseAuthClient } from '@/lib/supabase-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')

    if (!token) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    const supabaseAuth = getSupabaseAuthClient()
    if (!supabaseAuth) {
      return NextResponse.json({ error: 'Supabase 未配置' }, { status: 503 })
    }

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: '登录已过期，请重新登录' }, { status: 401 })
    }

    const supabaseAdmin = getSupabaseAdmin()
    if (!supabaseAdmin) {
      return NextResponse.json({
        user: {
          id: user.id,
          phone: normalizePhone(user.user_metadata?.phone as string | undefined),
          nickname: user.user_metadata?.nickname || '',
        },
      })
    }

    const [{ data: profile }, { data: membership }] = await Promise.all([
      supabaseAdmin
        .from(DB.userProfiles)
        .select('phone, nickname, is_active')
        .eq('id', user.id)
        .maybeSingle(),
      supabaseAdmin
        .from(DB.memberships)
        .select('status, starts_at, expires_at, plan_type')
        .eq('user_id', user.id)
        .maybeSingle(),
    ])

    if (profile?.is_active === false) {
      return NextResponse.json({ error: '账号已被禁用' }, { status: 403 })
    }

    const active = membership
      ? isMembershipActive(membership.status, membership.expires_at)
      : false

    return NextResponse.json({
      user: {
        id: user.id,
        phone: normalizePhone(profile?.phone),
        nickname: profile?.nickname || user.user_metadata?.nickname || '',
        membership: membership
          ? {
              status: active ? 'active' : membership.status,
              plan_type: membership.plan_type,
              starts_at: membership.starts_at,
              expires_at: membership.expires_at,
            }
          : { status: 'free', plan_type: null },
      },
    })
  } catch (error) {
    console.error('获取用户信息异常:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
