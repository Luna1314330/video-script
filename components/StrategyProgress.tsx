'use client'

import { WorkflowProgress } from '@/components/WorkflowProgress'
import { STRATEGY_LOADING_TIPS, STRATEGY_PROGRESS_PHASES } from '@/lib/types'

interface StrategyProgressProps {
  currentPhase: number
  isComplete?: boolean
}

export function StrategyProgress({ currentPhase, isComplete }: StrategyProgressProps) {
  return (
    <WorkflowProgress
      title="内容策略生成中"
      phases={STRATEGY_PROGRESS_PHASES}
      currentPhase={currentPhase}
      isComplete={isComplete}
      tips={STRATEGY_LOADING_TIPS}
    />
  )
}
