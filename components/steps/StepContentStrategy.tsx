'use client'

import { useCallback, useEffect, useRef } from 'react'
import { RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GenerationErrorPanel } from '@/components/GenerationErrorPanel'
import { StrategyProgress } from '@/components/StrategyProgress'
import { StrategyResults } from '@/components/StrategyResults'
import { StepHeader, StepNav } from '@/components/StepLayout'
import { pollWorkflowApi } from '@/lib/workflow/poll-api'
import { useAppStore } from '@/lib/store'
import { STRATEGY_PROGRESS_PHASES, type ContentStrategyResult } from '@/lib/types'

const PHASE_INTERVAL_MS = 1200

export function StepContentStrategy() {
  const {
    basicInput,
    contentStrategy,
    selectedTopic,
    loadingStep,
    strategyProgressPhase,
    error,
    setContentStrategy,
    setSelectedTopic,
    setStrategyProgressPhase,
    setScript,
    setScriptProgressPhase,
    setLoadingStep,
    setError,
    nextStep,
    prevStep,
  } = useAppStore()

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopProgressTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const startProgressTimer = useCallback(() => {
    stopProgressTimer()
    setStrategyProgressPhase(0)
    timerRef.current = setInterval(() => {
      const current = useAppStore.getState().strategyProgressPhase
      if (current < STRATEGY_PROGRESS_PHASES.length - 1) {
        setStrategyProgressPhase(current + 1)
      }
    }, PHASE_INTERVAL_MS)
  }, [setStrategyProgressPhase, stopProgressTimer])

  const generate = useCallback(async () => {
    setLoadingStep(2)
    setError(null)
    setContentStrategy(null)
    setSelectedTopic(null)
    startProgressTimer()

    try {
      const contentStrategy = await pollWorkflowApi<ContentStrategyResult>({
        url: '/api/workflow/content-strategy',
        startBody: { basicInput },
        pollBody: () => ({}),
        resultKey: 'contentStrategy',
      })

      stopProgressTimer()
      setStrategyProgressPhase(STRATEGY_PROGRESS_PHASES.length)
      setContentStrategy(contentStrategy)
    } catch (err) {
      stopProgressTimer()
      const msg = err instanceof Error ? err.message : '生成失败'
      setError(msg)
    } finally {
      setLoadingStep(null)
    }
  }, [
    basicInput,
    setContentStrategy,
    setSelectedTopic,
    setLoadingStep,
    setError,
    startProgressTimer,
    stopProgressTimer,
    setStrategyProgressPhase,
  ])

  useEffect(() => {
    if (!contentStrategy) {
      generate()
    }
    return () => stopProgressTimer()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loading = loadingStep === 2
  const showProgress = loading
  const showRetry = !loading && !contentStrategy && error

  return (
    <div className="animate-fade-in max-w-6xl mx-auto">
      <StepHeader
        title="内容策略"
        description="基于行业与产品，生成用户画像、内容地图与选题，选择 1 个进入脚本创作。"
      />

      {showProgress && (
        <StrategyProgress currentPhase={strategyProgressPhase} />
      )}

      {showRetry && (
        <GenerationErrorPanel onRetry={generate} detail={error} />
      )}

      {contentStrategy && !loading && (
        <div className="mt-8 space-y-6">
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={generate}
              className="gap-1.5 text-muted-foreground"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              重新生成
            </Button>
          </div>
          <StrategyResults
            strategy={contentStrategy}
            selectedTopicId={selectedTopic?.id}
            onSelectTopic={setSelectedTopic}
          />
        </div>
      )}

      <StepNav
        onBack={prevStep}
        onNext={() => {
          setScript(null)
          setScriptProgressPhase(0)
          nextStep()
        }}
        nextDisabled={!selectedTopic || loading}
        nextLabel="下一步：生成脚本"
      />
    </div>
  )
}
