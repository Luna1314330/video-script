'use client'

import { useEffect, useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface WorkflowProgressProps {
  title: string
  phases: readonly string[]
  currentPhase: number
  isComplete?: boolean
  tips?: readonly string[]
}

const TIP_INTERVAL_MS = 4500

export function WorkflowProgress({
  title,
  phases,
  currentPhase,
  isComplete,
  tips,
}: WorkflowProgressProps) {
  const [tipIndex, setTipIndex] = useState(0)

  useEffect(() => {
    if (!tips?.length || isComplete) return

    const timer = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % tips.length)
    }, TIP_INTERVAL_MS)

    return () => clearInterval(timer)
  }, [tips, isComplete])

  const activeTip = tips?.[tipIndex]

  return (
    <div className="rounded-xl border border-border/80 bg-card p-6 space-y-5">
      <div>
        <p className="font-heading text-base text-foreground">{title}</p>
        {activeTip && (
          <p
            key={activeTip}
            className="text-sm text-muted-foreground mt-2 leading-relaxed animate-fade-in"
          >
            {activeTip}
          </p>
        )}
      </div>

      <ul className="space-y-3">
        {phases.map((label, index) => {
          const isDone = isComplete || index < currentPhase
          const isActive = !isComplete && index === currentPhase

          return (
            <li
              key={label}
              className={cn(
                'flex items-center gap-3 text-sm transition-all duration-300',
                isDone && 'text-foreground',
                isActive && 'text-foreground font-medium',
                !isDone && !isActive && 'text-muted-foreground/50'
              )}
            >
              <span
                className={cn(
                  'w-5 h-5 rounded-full flex items-center justify-center shrink-0 border transition-all',
                  isDone && 'bg-foreground border-foreground text-background',
                  isActive && 'border-foreground bg-foreground/5',
                  !isDone && !isActive && 'border-border'
                )}
              >
                {isDone ? (
                  <Check className="w-3 h-3" />
                ) : isActive ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-border" />
                )}
              </span>
              {label}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
