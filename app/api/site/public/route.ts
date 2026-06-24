import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db/index'
import {
  ensureSiteSettingsHydrated,
  getSiteSettings,
  isMembershipPurchaseEnabled,
} from '@/lib/site-settings'

export const dynamic = 'force-dynamic'

/** 公开：前端展示用（无需登录） */
export async function GET() {
  const db = getDb()
  if (db) {
    try {
      await ensureSiteSettingsHydrated(db)
    } catch (error) {
      console.error('加载站点配置失败:', error)
    }
  }

  const settings = getSiteSettings()

  return NextResponse.json({
    success: true,
    membershipPurchaseEnabled: isMembershipPurchaseEnabled(),
    freeDailyGenerations: settings.freeGenerations.daily,
  })
}
