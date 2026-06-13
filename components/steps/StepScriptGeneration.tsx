'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Copy, Check, RefreshCw, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GenerationErrorPanel } from '@/components/GenerationErrorPanel'
import { ResultCard, StepHeader } from '@/components/StepLayout'
import { WorkflowProgress } from '@/components/WorkflowProgress'
import { useAppStore } from '@/lib/store'
import {
  DEFAULT_PLATFORM_ID,
  SCRIPT_LOADING_TIPS,
  SCRIPT_PROGRESS_PHASES,
  type GeneratedScript,
} from '@/lib/types'
import { toast } from 'sonner'

const PHASE_INTERVAL_MS = 1200

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

  const generate = useCallback(async () => {
    if (!contentStrategy || !selectedTopic) return
    setLoadingStep(3)
    setError(null)
    setScript(null)
    startProgressTimer()

    try {
      const res = await fetch('/api/workflow/script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          basicInput,
          contentStrategy,
          selectedTopic,
          platformId: DEFAULT_PLATFORM_ID,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      stopProgressTimer()
      setScriptProgressPhase(SCRIPT_PROGRESS_PHASES.length)
      setScript(data.script as GeneratedScript)
    } catch (err) {
      stopProgressTimer()
      const msg = err instanceof Error ? err.message : '生成失败'
      setError(msg)
    } finally {
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
      generate()
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
        <GenerationErrorPanel onRetry={generate} detail={error} />
      )}

      {script && !loading && (
        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-end">
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

function ScriptCard({ script }: { script: GeneratedScript }) {
  const [copied, setCopied] = useState(false)

  const formatted = `【${script.title}】

🎬 包装方式：${script.packagingType}

🪝 开头钩子
${script.hook}

📐 分镜脚本
${script.sections.map((s) => `${s.timestamp}\n旁白：${s.narration}\n画面：${s.visual}`).join('\n\n')}

✍️ 完整文案
${script.fullText}

🏷️ 话题标签
${script.hashtags.join(' ')}

🎯 行动号召
${script.cta}`

  const handleCopy = async () => {
    await navigator.clipboard.writeText(formatted)
    setCopied(true)
    toast.success('已复制到剪贴板')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="text-xs px-2 py-0.5 rounded bg-muted/60 text-muted-foreground">
            {script.packagingType}
          </span>
          <h3 className="font-heading text-lg mt-2">{script.title}</h3>
        </div>
        <Button variant="outline" size="sm" onClick={handleCopy} className="gap-2 shrink-0">
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              已复制
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              复制脚本
            </>
          )}
        </Button>
      </div>

      <ResultCard title="开头钩子">
        <p className="font-medium">{script.hook}</p>
      </ResultCard>

      <ResultCard title="分镜结构">
        <div className="space-y-4">
          {script.sections.map((section) => (
            <div key={section.timestamp} className="border-l-2 border-border pl-4">
              <span className="text-xs text-muted-foreground">{section.timestamp}</span>
              <p className="text-sm mt-1">{section.narration}</p>
              <p className="text-xs text-muted-foreground mt-1">画面：{section.visual}</p>
            </div>
          ))}
        </div>
      </ResultCard>

      <ResultCard title="完整文案">
        <p className="whitespace-pre-line">{script.fullText}</p>
      </ResultCard>

      <div className="grid md:grid-cols-2 gap-4">
        <ResultCard title="话题标签">
          <div className="flex flex-wrap gap-2">
            {script.hashtags.map((tag) => (
              <span key={tag} className="text-xs">
                {tag}
              </span>
            ))}
          </div>
        </ResultCard>
        <ResultCard title="行动号召">
          <p>{script.cta}</p>
        </ResultCard>
      </div>
    </div>
  )
}
