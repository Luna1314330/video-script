'use client'

import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface StepNavProps {
  onBack?: () => void
  onNext?: () => void
  nextLabel?: string
  nextDisabled?: boolean
  loading?: boolean
  showBack?: boolean
}

export function StepNav({
  onBack,
  onNext,
  nextLabel = '下一步',
  nextDisabled = false,
  loading = false,
  showBack = true,
}: StepNavProps) {
  return (
    <div className="flex items-center justify-between pt-8 border-t border-border/60 mt-8">
      {showBack && onBack ? (
        <Button variant="ghost" onClick={onBack} disabled={loading}>
          上一步
        </Button>
      ) : (
        <div />
      )}
      {onNext && (
        <Button
          onClick={onNext}
          disabled={nextDisabled || loading}
          className={cn('min-w-[120px] gap-2', loading && 'opacity-80')}
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {nextLabel}
        </Button>
      )}
    </div>
  )
}

interface LoadingStateProps {
  message?: string
}

export function LoadingState({ message = '正在生成...' }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}

interface StepHeaderProps {
  title: string
  description: string
}

export function StepHeader({ title, description }: StepHeaderProps) {
  return (
    <div className="mb-8">
      <h2 className="font-heading text-2xl md:text-3xl text-foreground mb-2">{title}</h2>
      <p className="text-muted-foreground text-sm md:text-base leading-relaxed">{description}</p>
    </div>
  )
}

interface ResultCardProps {
  title: string
  children: React.ReactNode
  className?: string
}

export function ResultCard({ title, children, className }: ResultCardProps) {
  return (
    <div className={cn('rounded-xl border border-border/80 bg-card p-5', className)}>
      <h3 className="font-heading text-base text-foreground mb-3">{title}</h3>
      <div className="text-sm text-foreground/80 leading-relaxed">{children}</div>
    </div>
  )
}

interface TagListProps {
  items: string[]
}

export function TagList({ items }: TagListProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className="inline-flex px-2.5 py-1 rounded-md bg-muted/60 text-xs text-foreground/70"
        >
          {item}
        </span>
      ))}
    </div>
  )
}
