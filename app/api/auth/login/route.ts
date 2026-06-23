import { NextRequest, NextResponse } from 'next/server'
import {
  AUTH_MESSAGES,
  findUserProfileByPhone,
  mapAuthErrorMessage,
  validateUserPassword,
  validateUserPhone,
} from '@/lib/auth-users'
import { DB, normalizePhone, phoneToEmail } from '@/lib/db/tables'
import { getSupabaseAuthClient } from '@/lib/supabase-auth'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function POST(request: NextRequest) {
  try {
    const { phone, password } = await request.json()
    const trimmedPhone = (phone ?? '').trim()

    const phoneError = validateUserPhone(trimmedPhone)
    if (phoneError) {
      return NextResponse.json({ error: phoneError }, { status: 400 })
    }

    const passwordError = validateUserPassword(password ?? '')
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 })
    }

    const supabaseAdmin = getSupabaseAdmin()
    if (supabaseAdmin) {
      const profile = await findUserProfileByPhone(supabaseAdmin, trimmedPhone)
      if (profile?.is_active === false) {
        return NextResponse.json(
          { error: AUTH_MESSAGES.banned, code: 'BANNED' },
          { status: 403 },
        )
      }
    }

    const supabaseAuth = getSupabaseAuthClient()
    if (!supabaseAuth) {
      return NextResponse.json({ error: 'Supabase 未配置，无法登录' }, { status: 503 })
    }

    const { data, error } = await supabaseAuth.auth.signInWithPassword({
      email: phoneToEmail(trimmedPhone),
      password,
    })

    if (error || !data.session || !data.user) {
      const mapped = mapAuthErrorMessage(error)
      return NextResponse.json(
        { error: mapped.message, code: mapped.code },
        { status: mapped.status },
      )
    }

    let nickname = data.user.user_metadata?.nickname as string | undefined
    let displayPhone = normalizePhone(trimmedPhone)

    if (supabaseAdmin) {
      const { data: profile } = await supabaseAdmin
        .from(DB.userProfiles)
        .select('phone, nickname, is_active')
        .eq('id', data.user.id)
        .maybeSingle()

      if (profile?.is_active === false) {
        await supabaseAuth.auth.signOut()
        return NextResponse.json(
          { error: AUTH_MESSAGES.banned, code: 'BANNED' },
          { status: 403 },
        )
      }

      if (profile) {
        nickname = profile.nickname || nickname
        displayPhone = normalizePhone(profile.phone)
      }
    }

    return NextResponse.json({
      success: true,
      token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      user: {
        id: data.user.id,
        phone: displayPhone,
        nickname: nickname || `用户${displayPhone.slice(-4)}`,
      },
    })
  } catch (error) {
    console.error('登录异常:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
