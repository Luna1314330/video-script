'use client'

import { useCallback, useEffect, useState } from 'react'
import { isLoggedIn } from '@/lib/auth-client'
import {
  fetchGenerationQuota,
  formatQuotaSummary,
  type GenerationQuotaInfo,
} from '@/lib/generation/client'
import { MembershipLink } from '@/components/MembershipLink'
import { cn } from '@/lib/utils'

type GenerationQuotaDisplayProps = {
  variant?: 'compact' | 'detail'
  className?: string
}

export function GenerationQuotaDisplay({
  variant = 'compact',
  className,
}: GenerationQuotaDisplayProps) {
  const [quota, setQuota] = useState<GenerationQuotaInfo | null>(null)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async (options?: { silent?: boolean }) => {
    if (!isLoggedIn()) {
      setQuota(null)
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

  if (!isLoggedIn()) return null

  if (variant === 'compact') {
    if (loading && !quota) {
      return (
        <span className={cn('text-xs text-muted-foreground', className)}>额度加载中…</span>
      )
    }
    if (!quota) return null

    return (
      <span
        className={cn(
          'text-xs px-2.5 py-1 rounded-full bg-muted/60 text-muted-foreground whitespace-nowrap',
          quota.remaining === 0 && 'text-amber-700 bg-amber-50',
          className,
        )}
        title="每日脚本生成次数"
      >
        {formatQuotaSummary(quota)}
      </span>
    )
  }

  return (
    <div className={cn('rounded-lg border border-gray-100 bg-gray-50/80 p-4', className)}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-900">今日生成额度</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {quota?.isMember ? '会员每日额度' : '登录用户每日免费体验额度'}
          </p>
        </div>
        {loading && !quota ? (
          <span className="text-sm text-gray-400">加载中…</span>
        ) : quota ? (
          <div className="text-right">
            <p className={cn('text-lg font-semibold', quota.remaining === 0 ? 'text-amber-600' : 'text-gray-900')}>
              剩余 {quota.remaining} 次
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              已用 {quota.used} / 共 {quota.dailyLimit} 次
            </p>
          </div>
        ) : (
          <span className="text-sm text-gray-400">—</span>
        )}
      </div>
      {quota && quota.remaining === 0 && (
        <p className="text-xs text-amber-700 mt-3">
          今日{quota.isMember ? '会员' : '免费体验'}次数已用完。
          {quota.membershipPurchaseEnabled ? (
            <>
              {' '}
              <MembershipLink underline className="text-amber-700" />
              {!quota.isMember && ' 可获得更多额度'}
            </>
          ) : (
            ' 请明日再试'
          )}
        </p>
      )}
    </div>
  )
}
