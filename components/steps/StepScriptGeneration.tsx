'use client'

import { useCallback, useEffect, useRef } from 'react'
import { RefreshCw, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GenerationErrorPanel } from '@/components/GenerationErrorPanel'
import { ScriptCard } from '@/components/ScriptCard'
import { StepHeader } from '@/components/StepLayout'
import { WorkflowProgress } from '@/components/WorkflowProgress'
import { saveHistoryEntry } from '@/lib/history/storage'
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

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

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
          selectedTopic,
          platformId: DEFAULT_PLATFORM_ID,
        }),
        resultKey: 'script',
      })

      stopProgressTimer()
      setScriptProgressPhase(SCRIPT_PROGRESS_PHASES.length)
      setScript(generatedScript)
      saveHistoryEntry({
        basicInput,
        selectedTopic,
        script: generatedScript,
      })
    } catch (err) {
      stopProgressTimer()
      const msg = err instanceof Error ? err.message : '生成失败'
      setError(msg)
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
  ])

  useEffect(() => {
    if (!contentStrategy || !selectedTopic) return
    const needsGenerate = !script || script.contentItemId !== selectedTopic.id
    if (needsGenerate) {
      void generate('auto')
    }
    return () => stopProgressTimer()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loading = loadingStep === 3
  const showProgress = loading
  const showRetry = !loading && !script && error

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      <StepHeader
        title="生成脚本"
        description="根据选定选题，生成短视频脚本。"
      />

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
