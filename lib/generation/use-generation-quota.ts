'use client'

import { useCallback, useEffect, useState } from 'react'
import { isLoggedIn } from '@/lib/auth-client'
import {
  fetchGenerationQuota,
  type GenerationQuotaInfo,
} from '@/lib/generation/client'

export function getQuotaExhaustedMessage(quota: GenerationQuotaInfo): string {
  return quota.isMember
    ? `今日脚本生成次数已用完（${quota.dailyLimit} 次/天）`
    : `今日免费生成次数已用完（${quota.dailyLimit} 次/天），开通会员可获得更多额度`
}

/** 是否为额度用尽类错误（API 或前端校验返回的文案） */
export function isQuotaExhaustedError(message: string | null | undefined): boolean {
  if (!message?.trim()) return false
  return (
    message.includes('次数已用完') ||
    message.includes('免费生成次数') ||
    message.includes('开通会员可获得更多额度')
  )
}

export function isQuotaBlocked(
  quota: GenerationQuotaInfo | null,
  error?: string | null,
): boolean {
  if (quota !== null && quota.remaining <= 0) return true
  return isQuotaExhaustedError(error)
}

export function useGenerationQuota() {
  const [quota, setQuota] = useState<GenerationQuotaInfo | null>(null)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async (options?: { silent?: boolean }) => {
    if (!isLoggedIn()) {
      setQuota(null)
      setLoading(false)
      return
    }

    if (!options?.silent) {
      setLoading(true)
    }

    try {
      setQuota(await fetchGenerationQuota())
    } catch {
      if (!options?.silent) {
        setQuota(null)
      }
    } finally {
      if (!options?.silent) {
        setLoading(false)
      }
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    const onUpdate = () => void refresh({ silent: true })
    window.addEventListener('quota-updated', onUpdate)
    return () => window.removeEventListener('quota-updated', onUpdate)
  }, [refresh])

  const noQuotaLeft = quota !== null && quota.remaining <= 0

  return { quota, loading, refresh, noQuotaLeft }
}
