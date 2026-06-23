import { desc, eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import { createAdminUser } from '@/lib/admin-users'
import { getDb, isActiveFlag } from '@/lib/db/index'
import { memberships, userProfiles } from '@/lib/db/schema'
import { mapAdminUser } from '@/lib/db/tables'
import { requireAdminApi } from '@/lib/admin-auth-server'

export async function GET(request: NextRequest) {
  const denied = requireAdminApi(request)
  if (denied) return denied

  const db = getDb()
  if (!db) {
    return NextResponse.json({ success: false, error: '数据库未配置，请设置 DATABASE_URL' }, { status: 503 })
  }

  try {
    const [profiles, membershipRows] = await Promise.all([
      db.select().from(userProfiles).orderBy(desc(userProfiles.createdAt)),
      db.select({
        userId: memberships.userId,
        status: memberships.status,
        expiresAt: memberships.expiresAt,
        planType: memberships.planType,
      }).from(memberships),
    ])

    const membershipByUser = new Map(
      membershipRows.map((m) => [m.userId, m]),
    )

    const result = profiles.map((profile) =>
      mapAdminUser(
        {
          id: profile.id,
          phone: profile.phone,
          nickname: profile.nickname,
          is_active: isActiveFlag(profile.isActive),
          created_at: profile.createdAt,
        },
        membershipByUser.get(profile.id),
      ),
    )

    return NextResponse.json({ success: true, data: result })
  } catch (err) {
    console.error('获取用户列表异常:', err)
    return NextResponse.json({ success: false, message: '服务器错误' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const denied = requireAdminApi(request)
  if (denied) return denied

  const db = getDb()
  if (!db) {
    return NextResponse.json({ success: false, message: '数据库未配置，无法添加用户' }, { status: 503 })
  }

  try {
    const body = await request.json()
    const result = await createAdminUser(db, body)

    if (!result.success) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: result.status },
      )
    }

    return NextResponse.json({
      success: true,
      data: result.data,
      message: result.initialPassword
        ? `用户已创建，初始密码：${result.initialPassword}`
        : '用户已创建',
    })
  } catch (err) {
    console.error('添加用户异常:', err)
    return NextResponse.json({ success: false, message: '服务器错误' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const denied = requireAdminApi(request)
  if (denied) return denied

  const db = getDb()
  if (!db) {
    return NextResponse.json({ success: false, message: '数据库未配置' }, { status: 503 })
  }

  try {
    const body = await request.json()
    const { id, status } = body

    if (!id || !status) {
      return NextResponse.json({ success: false, message: '缺少必要参数' }, { status: 400 })
    }

    await db
      .update(userProfiles)
      .set({ isActive: status === 'banned' ? 0 : 1 })
      .where(eq(userProfiles.id, id))

    return NextResponse.json({ success: true, message: '用户状态更新成功' })
  } catch (err) {
    console.error('更新用户状态异常:', err)
    return NextResponse.json({ success: false, message: '服务器错误' }, { status: 500 })
  }
}
