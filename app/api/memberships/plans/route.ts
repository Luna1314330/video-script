import { NextResponse } from 'next/server'
import { getDb } from '@/lib/db/index'
import {
  ensureSiteSettingsHydrated,
  getEnabledMembershipPlans,
  getSiteSettings,
} from '@/lib/site-settings'

/** 公开：获取已启用的会员套餐及价格（无需登录） */
export async function GET() {
  const db = getDb()
  if (db) {
    try {
      await ensureSiteSettingsHydrated(db)
    } catch (error) {
      console.error('加载套餐配置失败:', error)
    }
  }

  const memberGenerations = getSiteSettings().memberGenerations.daily
  const plans = getEnabledMembershipPlans().map((plan) => ({
    id: plan.id,
    name: plan.name,
    price: plan.price,
    originalPrice: plan.originalPrice,
    features: [
      `每日生成 ${memberGenerations} 次`,
      '优先使用 AI',
      '专属客服支持',
    ],
  }))

  return NextResponse.json({ success: true, data: plans })
}
