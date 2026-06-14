'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ResultCard } from '@/components/StepLayout'
import type { GeneratedScript } from '@/lib/types'
import { toast } from 'sonner'

export function formatScriptText(script: GeneratedScript): string {
  return `【${script.title}】

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
}

export function ScriptCard({ script }: { script: GeneratedScript }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(formatScriptText(script))
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
