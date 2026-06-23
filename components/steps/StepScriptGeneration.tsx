'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { RefreshCw, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GenerationErrorPanel } from '@/components/GenerationErrorPanel'
import { ScriptCard } from '@/components/ScriptCard'
import { StepHeader, AiGenerationTip } from '@/components/StepLayout'
import { WorkflowProgress } from '@/components/WorkflowProgress'
import { isLoggedIn } from '@/lib/auth-client'
import { notifyQuotaUpdated } from '@/lib/generation/client'
import {
  getQuotaExhaustedMessage,
  isQuotaExhaustedError,
  useGenerationQuota,
} from '@/lib/generation/use-generation-quota'
import { getMembershipActionLabel } from '@/lib/profile/client'
import { notifyHistoryUpdated } from '@/lib/history/client'
import { pollWorkflowApi } from '@/lib/workflow/poll-api'
import { useAppStore } from '@/lib/store'
import {
  DEFAULT_PLATFORM_ID,
  SCRIPT_LOADING_TIPS,
  SCRIPT_PROGRESS_PHASES,
  type GeneratedScript,
} from '@/lib/types'

const PHASE_INTERVAL_MS = 1200

/** 防止 React Strict Mode 下自动触发生成两次 */
const autoScriptGenerationLock = {
  topicId: '',
  running: false,
}

export function StepScriptGeneration() {
  const {
    basicInput,
    contentStrategy,
    selectedTopic,
    script,
    loadingStep,
    scriptProgressPhase,
    error,
    setScript,
    setScriptProgressPhase,
    setLoadingStep,
    setError,
    prevStep,
    reset,
  } = useAppStore()

  const [authReady, setAuthReady] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)
  const { quota, loading: quotaLoading, refresh: loadQuota, noQuotaLeft } = useGenerationQuota()

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    setLoggedIn(isLoggedIn())
    setAuthReady(true)
  }, [])

  const stopProgressTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const startProgressTimer = useCallback(() => {
    stopProgressTimer()
    setScriptProgressPhase(0)
    timerRef.current = setInterval(() => {
      const current = useAppStore.getState().scriptProgressPhase
      if (current < SCRIPT_PROGRESS_PHASES.length - 1) {
        setScriptProgressPhase(current + 1)
      }
    }, PHASE_INTERVAL_MS)
  }, [setScriptProgressPhase, stopProgressTimer])

  const generate = useCallback(async (trigger: 'auto' | 'manual' = 'manual') => {
    if (!contentStrategy || !selectedTopic) return

    if (!isLoggedIn()) {
      setError('请先登录后再生成脚本')
      return
    }

    if (quota !== null && quota.remaining <= 0) {
      return
    }

    if (trigger === 'auto') {
      if (
        autoScriptGenerationLock.running &&
        autoScriptGenerationLock.topicId === selectedTopic.id
      ) {
        return
      }
      autoScriptGenerationLock.topicId = selectedTopic.id
      autoScriptGenerationLock.running = true
    }

    setLoadingStep(3)
    setError(null)
    setScript(null)
    startProgressTimer()

    try {
      const generatedScript = await pollWorkflowApi<GeneratedScript>({
        url: '/api/workflow/script',
        startBody: {
          basicInput,
          contentStrategy,
          selectedTopic,
          platformId: DEFAULT_PLATFORM_ID,
        },
        pollBody: () => ({
          basicInput,
          selectedTopic,
          platformId: DEFAULT_PLATFORM_ID,
        }),
        resultKey: 'script',
        refundOnFailure: true,
      })

      stopProgressTimer()
      setScriptProgressPhase(SCRIPT_PROGRESS_PHASES.length)
      setScript(generatedScript)
      notifyHistoryUpdated()
      await loadQuota({ silent: true })
      notifyQuotaUpdated()
    } catch (err) {
      stopProgressTimer()
      const msg = err instanceof Error ? err.message : '生成失败'
      if (isQuotaExhaustedError(msg)) {
        await loadQuota({ silent: true })
        notifyQuotaUpdated()
        return
      }
      setError(msg)
      await loadQuota({ silent: true })
      notifyQuotaUpdated()
    } finally {
      if (trigger === 'auto') {
        autoScriptGenerationLock.running = false
      }
      setLoadingStep(null)
    }
  }, [
    basicInput,
    contentStrategy,
    selectedTopic,
    setScript,
    setLoadingStep,
    setError,
    startProgressTimer,
    stopProgressTimer,
    setScriptProgressPhase,
    loadQuota,
    quota,
  ])

  useEffect(() => {
    if (!authReady || !loggedIn) return
    if (quotaLoading) return
    if (quota !== null && noQuotaLeft) return
    if (!contentStrategy || !selectedTopic) return
    const needsGenerate = !script || script.contentItemId !== selectedTopic.id
    if (needsGenerate) {
      void generate('auto')
    }
    return () => stopProgressTimer()
  }, [authReady, loggedIn, quotaLoading, quota, noQuotaLeft]) // eslint-disable-line react-hooks/exhaustive-deps

  const loading = loadingStep === 3
  const showProgress = loading
  const showQuotaExhausted = !loading && !script && (noQuotaLeft || isQuotaExhaustedError(error))
  const showRetry =
    !loading && !script && Boolean(error) && !noQuotaLeft && !isQuotaExhaustedError(error)
  const showStart =
    !loading &&
    !script &&
    !error &&
    !noQuotaLeft &&
    Boolean(selectedTopic) &&
    !isQuotaExhaustedError(error)

  if (!authReady) {
    return null
  }

  if (!loggedIn) {
    return (
      <div className="animate-fade-in max-w-3xl mx-auto">
        <StepHeader
          title="生成脚本"
          description="根据选定选题，生成短视频脚本。"
        />

        <AiGenerationTip />

        <div className="rounded-xl border border-border/80 bg-card/60 p-8 text-center space-y-4">
          <p className="text-muted-foreground">生成脚本需要先登录账号</p>
          <div className="flex items-center justify-center gap-3">
            <Button asChild>
              <Link href="/login?redirect=/">去登录</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/register">注册账号</Link>
            </Button>
          </div>
        </div>
        <div className="flex items-center justify-between pt-8 border-t border-border/60 mt-8">
          <Button variant="ghost" onClick={prevStep}>
            上一步
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      <StepHeader
        title="生成脚本"
        description="根据选定选题，生成短视频脚本。"
      />

      <AiGenerationTip />

      {quota && (
        <p className="text-xs text-muted-foreground mb-4">
          {quota.isMember ? '会员' : '免费'}额度：今日剩余 {quota.remaining} / {quota.dailyLimit} 次
        </p>
      )}

      {showQuotaExhausted && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-8 text-center space-y-4 mb-6">
          <p className="text-sm font-medium text-amber-900">今日生成额度已用完</p>
          <p className="text-sm text-amber-800">
            {quota
              ? getQuotaExhaustedMessage(quota)
              : error && isQuotaExhaustedError(error)
                ? error
                : '今日脚本生成次数已用完，请明天再试'}
          </p>
          <Button asChild variant="outline" className="border-amber-300">
            <Link href="/membership">
              {quota ? getMembershipActionLabel(quota.isMember) : '开通会员'}
            </Link>
          </Button>
        </div>
      )}

      {selectedTopic && (
        <div className="rounded-xl border border-border/80 bg-card/60 p-4 mb-6 text-sm space-y-2">
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <span>{selectedTopic.personaTitle}</span>
            <span>·</span>
            <span>{selectedTopic.contentMapTitle}</span>
            <span>·</span>
            <span>{selectedTopic.packagingType}</span>
          </div>
          <p className="leading-relaxed">{selectedTopic.topic}</p>
        </div>
      )}

      {showProgress && (
        <WorkflowProgress
          title="脚本生成中"
          phases={SCRIPT_PROGRESS_PHASES}
          currentPhase={scriptProgressPhase}
          tips={SCRIPT_LOADING_TIPS}
        />
      )}

      {showStart && (
        <div className="rounded-xl border border-border/80 bg-card/60 p-8 text-center space-y-4 mb-6">
          <p className="text-sm text-muted-foreground">已选定选题，点击下方按钮开始生成脚本</p>
          <Button onClick={() => void generate('manual')} disabled={noQuotaLeft}>
            生成脚本
          </Button>
        </div>
      )}

      {showRetry && (
        <GenerationErrorPanel onRetry={() => void generate('manual')} detail={error} />
      )}

      {script && !loading && (
        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void generate('manual')}
              className="gap-1.5 text-muted-foreground"
              disabled={noQuotaLeft}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              重新生成
            </Button>
          </div>
          <ScriptCard script={script} />
        </div>
      )}

      <div className="flex items-center justify-between pt-8 border-t border-border/60 mt-8">
        <Button variant="ghost" onClick={prevStep} disabled={loading}>
          上一步
        </Button>
        <Button variant="outline" onClick={reset} className="gap-2" disabled={loading}>
          <RotateCcw className="w-3.5 h-3.5" />
          重新开始
        </Button>
      </div>
    </div>
  )
}
