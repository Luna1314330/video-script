import { authFetch, getAuthHeaders, isLoggedIn } from '@/lib/auth-client'

export type GenerationQuotaInfo = {
  isMember: boolean
  dailyLimit: number
  used: number
  remaining: number
  membershipPurchaseEnabled: boolean
}

export function getQuotaExhaustedMessage(quota: GenerationQuotaInfo): string {
  if (quota.isMember) {
    return `今日脚本生成次数已用完（${quota.dailyLimit} 次/天）`
  }
  if (!quota.membershipPurchaseEnabled) {
    return `今日免费体验次数已用完（${quota.dailyLimit} 次/天），请明日再试`
  }
  return `今日免费生成次数已用完（${quota.dailyLimit} 次/天），开通会员可获得更多额度`
}

export async function fetchGenerationQuota(): Promise<GenerationQuotaInfo> {
  const res = await authFetch('/api/generation/quota', { headers: getAuthHeaders() })
  const data = await res.json()

  if (!res.ok || !data.quota) {
    throw new Error(data.error || '获取额度失败')
  }

  const quota = data.quota as Omit<GenerationQuotaInfo, 'membershipPurchaseEnabled'>
  return {
    ...quota,
    membershipPurchaseEnabled: Boolean(data.membershipPurchaseEnabled),
  }
}

export function notifyQuotaUpdated() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('quota-updated'))
}

export function formatQuotaSummary(quota: GenerationQuotaInfo): string {
  const label = quota.isMember ? '会员' : '免费体验'
  return `${label}额度 今日剩余 ${quota.remaining}/${quota.dailyLimit} 次`
}
