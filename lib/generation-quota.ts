import { and, count, eq, gte } from 'drizzle-orm'
import type { AppDb } from '@/lib/db/index'
import { newId } from '@/lib/db/index'
import { generationLogs, memberships } from '@/lib/db/schema'
import { isMembershipActive } from '@/lib/db/tables'
import {
  ensureSiteSettingsHydrated,
  getSiteSettings,
} from '@/lib/site-settings'

export const GENERATION_ACTION_SCRIPT = 'script'

function getTodayStartSql(): string {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return start.toISOString().slice(0, 19).replace('T', ' ')
}

export async function getUserMembershipActive(
  db: AppDb,
  userId: string,
): Promise<boolean> {
  const rows = await db
    .select({
      status: memberships.status,
      expiresAt: memberships.expiresAt,
    })
    .from(memberships)
    .where(eq(memberships.userId, userId))
    .limit(1)

  const data = rows[0]
  if (!data) return false
  return isMembershipActive(data.status, data.expiresAt)
}

export async function countTodayScriptGenerations(
  db: AppDb,
  userId: string,
): Promise<number> {
  const startStr = getTodayStartSql()

  const rows = await db
    .select({ value: count() })
    .from(generationLogs)
    .where(
      and(
        eq(generationLogs.userId, userId),
        eq(generationLogs.action, GENERATION_ACTION_SCRIPT),
        gte(generationLogs.createdAt, startStr),
      ),
    )

  return Number(rows[0]?.value ?? 0)
}

export async function getGenerationQuota(db: AppDb, userId: string) {
  await ensureSiteSettingsHydrated(db)

  const isMember = await getUserMembershipActive(db, userId)
  const settings = getSiteSettings()
  const dailyLimit = isMember
    ? settings.memberGenerations.daily
    : settings.freeGenerations.daily
  const used = await countTodayScriptGenerations(db, userId)
  const remaining = Math.max(0, dailyLimit - used)

  return {
    isMember,
    dailyLimit,
    used,
    remaining,
  }
}

export async function consumeScriptGenerationQuota(db: AppDb, userId: string) {
  const quota = await getGenerationQuota(db, userId)

  if (quota.remaining <= 0) {
    return {
      success: false as const,
      message: quota.isMember
        ? `今日脚本生成次数已用完（${quota.dailyLimit} 次/天）`
        : `今日免费生成次数已用完（${quota.dailyLimit} 次/天），开通会员可获得更多额度`,
      status: 429,
      quota,
    }
  }

  const logId = newId()
  const now = new Date().toISOString().slice(0, 19).replace('T', ' ')

  try {
    await db.insert(generationLogs).values({
      id: logId,
      userId,
      action: GENERATION_ACTION_SCRIPT,
      createdAt: now,
    })
  } catch (error) {
    console.error('写入生成记录失败:', error)
    return {
      success: false as const,
      message: `扣减额度失败：${error instanceof Error ? error.message : '未知错误'}`,
      status: 500,
      quota,
    }
  }

  const nextQuota = {
    ...quota,
    used: quota.used + 1,
    remaining: quota.remaining - 1,
  }

  return {
    success: true as const,
    quota: nextQuota,
    logId,
  }
}

export async function refundScriptGenerationQuota(
  db: AppDb,
  userId: string,
  logId: string,
): Promise<{ refunded: boolean; quota?: Awaited<ReturnType<typeof getGenerationQuota>> }> {
  const result = await db
    .delete(generationLogs)
    .where(and(eq(generationLogs.id, logId), eq(generationLogs.userId, userId)))

  const affected = (result as unknown as [{ affectedRows?: number }])[0]?.affectedRows ?? 0
  if (!affected) {
    return { refunded: false }
  }

  const quota = await getGenerationQuota(db, userId)
  return { refunded: true, quota }
}
