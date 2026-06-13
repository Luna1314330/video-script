'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Settings, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'

export function CozeSettings() {
  const { cozeConfig, setCozeConfig } = useAppStore()
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  const workflowFields = [
    { key: 'contentStrategy' as const, label: '内容策略工作流 ID' },
    { key: 'script' as const, label: '脚本生成工作流 ID' },
  ]

  const configuredCount = workflowFields.filter(
    (f) => cozeConfig.workflowIds[f.key]
  ).length

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2 border-border/60 text-muted-foreground hover:text-foreground"
      >
        <Settings className="w-3.5 h-3.5" />
        Coze 配置
        {configuredCount > 0 && (
          <span className="text-[10px] bg-foreground/10 px-1.5 py-0.5 rounded-full">
            {configuredCount}/2
          </span>
        )}
      </Button>

      {open &&
        mounted &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="coze-settings-title"
          >
            <div
              className="fixed inset-0 bg-black/25 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <div className="relative z-10 w-full max-w-lg max-h-[min(90vh,720px)] flex flex-col bg-background border border-border rounded-2xl shadow-2xl animate-fade-in">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
                <div>
                  <h2 id="coze-settings-title" className="font-heading text-lg text-foreground">
                    Coze 工作流配置
                  </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  已接入 Coze 工作流。可在下方填写配置，或在 .env.local 中设置环境变量。
                </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1 min-h-0">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    API Token
                  </label>
                  <Input
                    type="password"
                    placeholder="pat_xxxxxxxx"
                    value={cozeConfig.apiToken}
                    onChange={(e) => setCozeConfig({ apiToken: e.target.value })}
                    className="h-10"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    API Base URL
                  </label>
                  <Input
                    placeholder="https://api.coze.cn"
                    value={cozeConfig.baseUrl}
                    onChange={(e) => setCozeConfig({ baseUrl: e.target.value })}
                    className="h-10"
                  />
                </div>

                <div className="border-t border-border pt-4 space-y-3">
                  {workflowFields.map(({ key, label }) => (
                    <div key={key} className="space-y-1.5">
                      <label className="text-sm text-foreground/80">{label}</label>
                      <Input
                        placeholder={`输入 ${label}`}
                        value={cozeConfig.workflowIds[key]}
                        onChange={(e) =>
                          setCozeConfig({
                            workflowIds: { ...cozeConfig.workflowIds, [key]: e.target.value },
                          })
                        }
                        className={cn('h-10 text-sm', cozeConfig.workflowIds[key] && 'border-foreground/15')}
                      />
                    </div>
                  ))}
                </div>

              <div className="rounded-xl bg-muted/40 p-4 text-xs text-muted-foreground leading-relaxed space-y-2">
                <p className="font-medium text-foreground/70">环境变量（可选）</p>
                <p>
                  也可在 <code className="bg-muted px-1 rounded">.env.local</code> 中配置，优先级与下方表单合并。
                  设置 <code className="bg-muted px-1 rounded">USE_MOCK_DATA=true</code> 可切回静态演示数据。
                </p>
                <pre className="text-[10px] bg-muted p-2 rounded overflow-x-auto">
                  {`USE_MOCK_DATA=false
COZE_API_TOKEN=
COZE_WORKFLOW_CONTENT_STRATEGY=
COZE_WORKFLOW_SCRIPT=`}
                </pre>
              </div>
              </div>

              <div className="px-6 py-4 border-t border-border flex justify-end shrink-0">
                <Button onClick={() => setOpen(false)}>保存并关闭</Button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  )
}
