import { authFetch, getAuthHeaders, isLoggedIn } from '@/lib/auth-client'

export type GenerationQuotaInfo = {
  isMember: boolean
  dailyLimit: number
  used: number
  remaining: number
}

export async function fetchGenerationQuota(): Promise<GenerationQuotaInfo> {
  const res = await authFetch('/api/generation/quota', { headers: getAuthHeaders() })
  const data = await res.json()

  if (!res.ok || !data.data) {
    throw new Error(data.error || '获取额度失败')
  }

  return data.data as GenerationQuotaInfo
}

export function notifyQuotaUpdated() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('quota-updated'))
}

export function formatQuotaSummary(quota: GenerationQuotaInfo): string {
  const label = quota.isMember ? '会员' : '免费'
  return `${label}额度 今日剩余 ${quota.remaining}/${quota.dailyLimit} 次`
}
