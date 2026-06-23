import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { isJwtConfigured, verifyAccessToken } from '@/lib/auth-server'
import { getDb } from '@/lib/db/index'
import { isActiveFlag } from '@/lib/db/index'
import { memberships, userProfiles } from '@/lib/db/schema'
import { isMembershipActive, normalizePhone } from '@/lib/db/tables'

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '')

    if (!token) {
      return NextResponse.json({ error: '未登录' }, { status: 401 })
    }

    if (!isJwtConfigured()) {
      return NextResponse.json({ error: '认证未配置' }, { status: 503 })
    }

    const payload = await verifyAccessToken(token)
    if (!payload) {
      return NextResponse.json({ error: '登录已过期，请重新登录' }, { status: 401 })
    }

    const db = getDb()
    if (!db) {
      return NextResponse.json({
        user: {
          id: payload.userId,
          phone: normalizePhone(payload.phone),
          nickname: '',
        },
      })
    }

    const [profileRows, membershipRows] = await Promise.all([
      db
        .select({
          phone: userProfiles.phone,
          nickname: userProfiles.nickname,
          isActive: userProfiles.isActive,
        })
        .from(userProfiles)
        .where(eq(userProfiles.id, payload.userId))
        .limit(1),
      db
        .select({
          status: memberships.status,
          startsAt: memberships.startsAt,
          expiresAt: memberships.expiresAt,
          planType: memberships.planType,
        })
        .from(memberships)
        .where(eq(memberships.userId, payload.userId))
        .limit(1),
    ])

    const profile = profileRows[0]
    if (profile && !isActiveFlag(profile.isActive)) {
      return NextResponse.json({ error: '账号已被禁用' }, { status: 403 })
    }

    const membership = membershipRows[0]
    const active = membership
      ? isMembershipActive(membership.status, membership.expiresAt)
      : false

    return NextResponse.json({
      user: {
        id: payload.userId,
        phone: normalizePhone(profile?.phone || payload.phone),
        nickname: profile?.nickname || '',
        membership: membership
          ? {
              status: active ? 'active' : membership.status,
              plan_type: membership.planType,
              starts_at: membership.startsAt,
              expires_at: membership.expiresAt,
            }
          : { status: 'free', plan_type: null },
      },
    })
  } catch (error) {
    console.error('获取用户信息异常:', error)
    return NextResponse.json({ error: '服务器错误' }, { status: 500 })
  }
}
