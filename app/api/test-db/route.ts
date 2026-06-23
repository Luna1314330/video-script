import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db/index'
import { memberships, systemSettings, userProfiles } from '@/lib/db/schema'
import { ensureSiteSettingsHydrated } from '@/lib/site-settings'

export async function GET() {
  try {
    const db = getDb()
    if (!db) {
      return NextResponse.json({
        success: false,
        message: 'DATABASE_URL 未配置',
      }, { status: 503 })
    }

    const [profiles, membershipRows, settings, hydrated] = await Promise.all([
      db.select().from(userProfiles).limit(1),
      db.select().from(memberships).limit(1),
      db.select().from(systemSettings).limit(5),
      ensureSiteSettingsHydrated(db),
    ])

    return NextResponse.json({
      success: true,
      message: 'MySQL 连接成功',
      data: {
        userProfiles: profiles,
        memberships: membershipRows,
        systemSettings: settings,
        settingsHydrated: hydrated,
      },
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'MySQL 连接失败',
      error: error instanceof Error ? error.message : '未知错误',
    }, { status: 500 })
  }
}
