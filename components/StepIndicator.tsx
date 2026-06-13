'use client'

import { cn } from '@/lib/utils'
import { STEP_LABELS, TOTAL_STEPS } from '@/lib/types'

interface StepIndicatorProps {
  currentStep: number
}

export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="flex items-start justify-between max-w-md mx-auto px-2">
        {STEP_LABELS.map((label, index) => {
          const step = index + 1
          const isActive = step === currentStep
          const isCompleted = step < currentStep

          return (
            <div key={label} className="flex flex-1 items-start">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300 border',
                    isActive && 'bg-foreground text-background border-foreground',
                    isCompleted && 'bg-foreground/10 text-foreground border-foreground/30',
                    !isActive && !isCompleted && 'bg-transparent text-muted-foreground border-border'
                  )}
                >
                  {isCompleted ? (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    step
                  )}
                </div>
                <span
                  className={cn(
                    'text-[11px] mt-2 text-center leading-tight max-w-[80px]',
                    isActive && 'text-foreground font-medium',
                    isCompleted && 'text-foreground/70',
                    !isActive && !isCompleted && 'text-muted-foreground'
                  )}
                >
                  {label}
                </span>
              </div>
              {step < TOTAL_STEPS && (
                <div
                  className={cn(
                    'h-px flex-1 mt-4 mx-1',
                    isCompleted ? 'bg-foreground/30' : 'bg-border'
                  )}
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
