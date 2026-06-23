import { NextRequest, NextResponse } from 'next/server'
import { mockAdminSettingsResponse } from '@/lib/admin-api-mock'
import {
  ensureSiteSettingsHydrated,
  getSiteSettings,
  persistSiteSettingsToDb,
  toAdminApiPayload,
  updateSiteSettingsFromAdmin,
} from '@/lib/site-settings'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdminApi } from '@/lib/admin-auth-server'

// GET - 从 system_settings 表读取配置
export async function GET(request: NextRequest) {
  const denied = requireAdminApi(request)
  if (denied) return denied

  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) {
    return NextResponse.json(mockAdminSettingsResponse())
  }

  try {
    const result = await ensureSiteSettingsHydrated(supabaseAdmin)

    return NextResponse.json({
      success: true,
      data: toAdminApiPayload(result.settings),
      meta: {
        persisted: result.persisted,
        tableReady: result.tableReady,
        note: result.tableReady
          ? '配置已持久化到 system_settings 表'
          : '请先在 Supabase SQL Editor 执行 storage/database/system_settings.sql',
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

// PUT - 保存到 system_settings 表
export async function PUT(request: NextRequest) {
  const denied = requireAdminApi(request)
  if (denied) return denied

  const supabaseAdmin = getSupabaseAdmin()
  if (!supabaseAdmin) {
    return NextResponse.json({ success: false, error: 'Supabase 未配置' }, { status: 503 })
  }

  try {
    const body = await request.json()
    const settings = updateSiteSettingsFromAdmin(body)

    await persistSiteSettingsToDb(supabaseAdmin, settings)

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

    if (message.includes('Could not find the table')) {
      return NextResponse.json({
        success: false,
        error: 'system_settings 表不存在，请先在 Supabase 执行 storage/database/system_settings.sql',
      }, { status: 503 })
    }

    console.error('保存系统设置失败:', error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
