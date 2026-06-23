import { NextRequest, NextResponse } from 'next/server'
import { signAccessToken, isJwtConfigured } from '@/lib/auth-server'
import {
  validateUserPassword,
  validateUserPhone,
  verifyUserCredentials,
} from '@/lib/auth-users'
import { getDb } from '@/lib/db/index'
import { normalizePhone } from '@/lib/db/tables'

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

    const db = getDb()
    if (!db) {
      return NextResponse.json({ error: '数据库未配置，无法登录' }, { status: 503 })
    }

    if (!isJwtConfigured()) {
      return NextResponse.json({ error: '认证未配置，无法登录' }, { status: 503 })
    }

    const verified = await verifyUserCredentials(db, trimmedPhone, password)
    if (!verified.ok) {
      return NextResponse.json(
        { error: verified.message, code: verified.code },
        { status: verified.status },
      )
    }

    const displayPhone = normalizePhone(verified.user.phone)
    const nickname = verified.user.nickname || `用户${displayPhone.slice(-4)}`
    const token = await signAccessToken({ userId: verified.user.id, phone: displayPhone })

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: verified.user.id,
        phone: displayPhone,
        nickname,
      },
    })
  } catch (error) {
    console.error('登录异常:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
