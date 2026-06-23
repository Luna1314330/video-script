import { sql } from 'drizzle-orm'
import { NextResponse } from 'next/server'
import { formatDbError, getDb, isDbConfigured } from '@/lib/db/index'
import { memberships, systemSettings, userProfiles } from '@/lib/db/schema'
import { ensureSiteSettingsHydrated } from '@/lib/site-settings'

const REQUIRED_TABLES = [
  'user_profiles',
  'memberships',
  'orders',
  'generation_logs',
  'script_history',
  'system_settings',
] as const

export async function GET() {
  try {
    if (!isDbConfigured()) {
      return NextResponse.json({
        success: false,
        message: 'DATABASE_URL 未配置',
        hint: '在服务器创建 .env.production.local 或通过 PM2/systemd 注入环境变量',
      }, { status: 503 })
    }

    const db = getDb()
    if (!db) {
      return NextResponse.json({
        success: false,
        message: 'DATABASE_URL 未配置',
      }, { status: 503 })
    }

    const tableRows = await db.execute(
      sql`SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE()`,
    )
    const existingTables = new Set(
      (tableRows[0] as Array<{ TABLE_NAME?: string; table_name?: string }>).map(
        (row) => row.TABLE_NAME || row.table_name || '',
      ),
    )
    const missingTables = REQUIRED_TABLES.filter((name) => !existingTables.has(name))

    const [profiles, membershipRows, settings, hydrated] = await Promise.all([
      db.select().from(userProfiles).limit(1),
      db.select().from(memberships).limit(1),
      db.select().from(systemSettings).limit(5),
      ensureSiteSettingsHydrated(db),
    ])

    return NextResponse.json({
      success: missingTables.length === 0,
      message:
        missingTables.length === 0
          ? 'MySQL 连接成功，表结构完整'
          : `MySQL 已连接，但缺少表：${missingTables.join(', ')}`,
      missingTables,
      data: {
        userProfiles: profiles,
        memberships: membershipRows,
        systemSettings: settings,
        settingsHydrated: hydrated,
      },
    }, { status: missingTables.length === 0 ? 200 : 500 })
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'MySQL 连接失败',
      error: formatDbError(error),
    }, { status: 500 })
  }
}
