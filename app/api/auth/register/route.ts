import { NextRequest, NextResponse } from 'next/server'
import { provisionAppUser, validateUserPassword, validateUserPhone } from '@/lib/auth-users'
import { getDb } from '@/lib/db/index'

export async function POST(request: NextRequest) {
  try {
    const { phone, password } = await request.json()

    const phoneError = validateUserPhone(phone ?? '')
    if (phoneError) {
      return NextResponse.json({ error: phoneError }, { status: 400 })
    }

    const passwordError = validateUserPassword(password ?? '')
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 })
    }

    const db = getDb()
    if (!db) {
      return NextResponse.json({ error: '数据库未配置，无法注册' }, { status: 503 })
    }

    const result = await provisionAppUser(db, {
      phone: phone.trim(),
      password,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.message, code: result.code },
        { status: result.status },
      )
    }

    return NextResponse.json({
      success: true,
      message: '注册成功',
      user: {
        id: result.profile.id,
        phone: result.profile.phone,
        nickname: result.profile.nickname,
      },
    })
  } catch (error) {
    console.error('注册异常:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
