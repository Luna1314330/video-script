import type { SupabaseClient } from '@supabase/supabase-js'
import { DB, isMembershipActive } from '@/lib/db/tables'
import {
  ensureSiteSettingsHydrated,
  getSiteSettings,
} from '@/lib/site-settings'

export const GENERATION_ACTION_SCRIPT = 'script'

function getTodayStartIso(): string {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return start.toISOString()
}

export async function getUserMembershipActive(
  supabaseAdmin: SupabaseClient,
  userId: string,
): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from(DB.memberships)
    .select('status, expires_at')
    .eq('user_id', userId)
    .maybeSingle()

  if (!data) return false
  return isMembershipActive(data.status, data.expires_at)
}

export async function countTodayScriptGenerations(
  supabaseAdmin: SupabaseClient,
  userId: string,
): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from(DB.generationLogs)
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('action', GENERATION_ACTION_SCRIPT)
    .gte('created_at', getTodayStartIso())

  if (error) {
    console.error('统计生成次数失败:', error)
    throw new Error(error.message)
  }

  return count ?? 0
}

export async function getGenerationQuota(
  supabaseAdmin: SupabaseClient,
  userId: string,
) {
  await ensureSiteSettingsHydrated(supabaseAdmin)

  const isMember = await getUserMembershipActive(supabaseAdmin, userId)
  const settings = getSiteSettings()
  const dailyLimit = isMember
    ? settings.memberGenerations.daily
    : settings.freeGenerations.daily
  const used = await countTodayScriptGenerations(supabaseAdmin, userId)
  const remaining = Math.max(0, dailyLimit - used)

  return {
    isMember,
    dailyLimit,
    used,
    remaining,
  }
}

export async function consumeScriptGenerationQuota(
  supabaseAdmin: SupabaseClient,
  userId: string,
) {
  const quota = await getGenerationQuota(supabaseAdmin, userId)

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

  const { data, error } = await supabaseAdmin
    .from(DB.generationLogs)
    .insert({
      user_id: userId,
      action: GENERATION_ACTION_SCRIPT,
    })
    .select('id')
    .single()

  if (error || !data) {
    console.error('写入生成记录失败:', error)
    return {
      success: false as const,
      message: `扣减额度失败：${error?.message || '未知错误'}`,
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
    logId: data.id as string,
  }
}

/** 生成失败时退还已扣减的额度（删除对应 generation_logs 记录） */
export async function refundScriptGenerationQuota(
  supabaseAdmin: SupabaseClient,
  userId: string,
  logId: string,
): Promise<{ refunded: boolean; quota?: Awaited<ReturnType<typeof getGenerationQuota>> }> {
  const { error, count } = await supabaseAdmin
    .from(DB.generationLogs)
    .delete({ count: 'exact' })
    .eq('id', logId)
    .eq('user_id', userId)

  if (error) {
    console.error('退还额度失败:', error)
    return { refunded: false }
  }

  if (!count) {
    return { refunded: false }
  }

  const quota = await getGenerationQuota(supabaseAdmin, userId)
  return { refunded: true, quota }
}
