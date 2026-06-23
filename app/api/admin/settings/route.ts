import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/lib/db/index'
import {
  ensureSiteSettingsHydrated,
  getSiteSettings,
  persistSiteSettingsToDb,
  toAdminApiPayload,
  updateSiteSettingsFromAdmin,
} from '@/lib/site-settings'
import { requireAdminApi } from '@/lib/admin-auth-server'

export async function GET(request: NextRequest) {
  const denied = requireAdminApi(request)
  if (denied) return denied

  const db = getDb()
  if (!db) {
    return NextResponse.json({ success: false, error: '数据库未配置，请设置 DATABASE_URL' }, { status: 503 })
  }

  try {
    const result = await ensureSiteSettingsHydrated(db)

    return NextResponse.json({
      success: true,
      data: toAdminApiPayload(result.settings),
      meta: {
        persisted: result.persisted,
        tableReady: result.tableReady,
        note: result.tableReady
          ? '配置已持久化到 system_settings 表'
          : '请先在 MySQL 执行 storage/database/schema.mysql.sql 中的 system_settings 初始化',
      },
    })
  } catch (error) {
    console.error('读取系统设置失败:', error)
    return NextResponse.json({
      success: true,
      data: toAdminApiPayload(getSiteSettings()),
      meta: {
        persisted: false,
        tableReady: false,
        note: '读取数据库失败，已回退到默认配置',
      },
    })
  }
}

export async function PUT(request: NextRequest) {
  const denied = requireAdminApi(request)
  if (denied) return denied

  const db = getDb()
  if (!db) {
    return NextResponse.json({ success: false, error: '数据库未配置' }, { status: 503 })
  }

  try {
    const body = await request.json()
    const settings = updateSiteSettingsFromAdmin(body)
    await persistSiteSettingsToDb(db, settings)

    return NextResponse.json({
      success: true,
      message: '设置已保存',
      data: toAdminApiPayload(getSiteSettings()),
      meta: {
        persisted: true,
        tableReady: true,
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : '保存失败'

    if (message.includes("doesn't exist")) {
      return NextResponse.json({
        success: false,
        error: 'system_settings 表不存在，请先在 MySQL 执行建表 SQL',
      }, { status: 503 })
    }

    console.error('保存系统设置失败:', error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
