import { eq } from 'drizzle-orm'
import { NextRequest, NextResponse } from 'next/server'
import {
  updateUserPassword,
  validateUserPassword,
  verifyUserCredentials,
} from '@/lib/auth-users'
import { getDb } from '@/lib/db/index'
import { userProfiles } from '@/lib/db/schema'
import { requireAuthUser } from '@/lib/require-auth'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireAuthUser(request)
    if (!auth.ok) {
      return NextResponse.json(
        { success: false, message: auth.message },
        { status: auth.status },
      )
    }

    const body = (await request.json()) as {
      oldPassword?: string
      newPassword?: string
    }

    const oldPassword = body.oldPassword ?? ''
    const newPassword = body.newPassword ?? ''

    if (!oldPassword) {
      return NextResponse.json(
        { success: false, message: '请输入旧密码' },
        { status: 400 },
      )
    }

    const newPasswordError = validateUserPassword(newPassword)
    if (newPasswordError) {
      return NextResponse.json(
        { success: false, message: newPasswordError },
        { status: 400 },
      )
    }

    if (oldPassword === newPassword) {
      return NextResponse.json(
        { success: false, message: '新密码不能与旧密码相同' },
        { status: 400 },
      )
    }

    const db = getDb()
    if (!db) {
      return NextResponse.json(
        { success: false, message: '数据库未配置' },
        { status: 503 },
      )
    }

    const profileRows = await db
      .select({
        phone: userProfiles.phone,
        isActive: userProfiles.isActive,
      })
      .from(userProfiles)
      .where(eq(userProfiles.id, auth.user.id))
      .limit(1)

    const profile = profileRows[0]
    if (!profile?.phone) {
      return NextResponse.json(
        { success: false, message: '用户不存在' },
        { status: 404 },
      )
    }

    if (profile.isActive === 0) {
      return NextResponse.json(
        { success: false, message: '账号已被禁用' },
        { status: 403 },
      )
    }

    const verified = await verifyUserCredentials(db, profile.phone, oldPassword)
    if (!verified.ok) {
      return NextResponse.json(
        { success: false, message: '旧密码错误' },
        { status: 401 },
      )
    }

    await updateUserPassword(db, auth.user.id, newPassword)

    return NextResponse.json({
      success: true,
      message: '密码修改成功',
    })
  } catch (error) {
    console.error('修改密码错误:', error)
    return NextResponse.json(
      { success: false, message: '服务器错误' },
      { status: 500 },
    )
  }
}
