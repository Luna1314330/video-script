'use client'

import { Button } from '@/components/ui/button'

interface GenerationErrorPanelProps {
  onRetry: () => void
  detail?: string | null
}

export function GenerationErrorPanel({ onRetry, detail }: GenerationErrorPanelProps) {
  return (
    <div className="text-center py-14 px-6 rounded-xl border border-border/80 bg-card/60">
      <p className="font-heading text-lg text-foreground mb-2">
        抱歉，生成过程中遇到一些问题，请重试。
      </p>
      <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
        可能是网络波动或服务暂时繁忙，点击下方按钮即可重新生成。
      </p>
      {detail && (
        <p className="text-xs text-muted-foreground/60 mb-6 max-w-md mx-auto break-words">
          {detail}
        </p>
      )}
      <Button size="lg" onClick={onRetry} className="min-w-[200px] h-11 text-base">
        重试一下
      </Button>
    </div>
  )
}
