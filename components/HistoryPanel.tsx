'use client'

import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, Clock, History, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ScriptCard } from '@/components/ScriptCard'
import {
  clearHistory,
  formatHistoryTime,
  loadHistory,
  removeHistoryEntry,
} from '@/lib/history/storage'
import type { GenerationHistoryEntry } from '@/lib/types'
import { cn } from '@/lib/utils'

export function HistoryPanel() {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [items, setItems] = useState<GenerationHistoryEntry[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const refresh = useCallback(() => {
    setItems(loadHistory())
  }, [])

  useEffect(() => {
    setMounted(true)
    refresh()
  }, [refresh])

  useEffect(() => {
    const onUpdate = () => refresh()
    window.addEventListener('history-updated', onUpdate)
    return () => window.removeEventListener('history-updated', onUpdate)
  }, [refresh])

  useEffect(() => {
    if (!open) return
    refresh()
    setSelectedId(null)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open, refresh])

  const selected = items.find((item) => item.id === selectedId)

  const handleDelete = (id: string) => {
    removeHistoryEntry(id)
    if (selectedId === id) setSelectedId(null)
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2 border-border/60 text-muted-foreground hover:text-foreground"
      >
        <History className="w-3.5 h-3.5" />
        历史记录
        {items.length > 0 && (
          <span className="text-[10px] bg-foreground/10 px-1.5 py-0.5 rounded-full">
            {items.length}
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
            aria-labelledby="history-panel-title"
          >
            <div
              className="fixed inset-0 bg-black/25 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <div className="relative z-10 w-full max-w-2xl max-h-[min(90vh,800px)] flex flex-col bg-background border border-border rounded-2xl shadow-2xl animate-fade-in">
              <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  {selected && (
                    <button
                      type="button"
                      onClick={() => setSelectedId(null)}
                      className="p-1.5 rounded-lg hover:bg-muted transition-colors shrink-0"
                      aria-label="返回列表"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                  )}
                  <div className="min-w-0">
                    <h2 id="history-panel-title" className="font-heading text-lg text-foreground">
                      {selected ? '脚本详情' : '历史记录'}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {selected
                        ? `${selected.basicInput.product} · ${formatHistoryTime(selected.createdAt)}`
                        : '仅保存在本浏览器，最多保留 20 条'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="px-6 py-5 overflow-y-auto flex-1 min-h-0">
                {selected ? (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-border/80 bg-card/60 p-4 text-sm space-y-2">
                      <div className="flex flex-wrap gap-x-2 gap-y-1 text-xs text-muted-foreground">
                        <span>{selected.basicInput.industry}</span>
                        <span>·</span>
                        <span>{selected.basicInput.product}</span>
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span>{selected.selectedTopic.personaTitle}</span>
                        <span>·</span>
                        <span>{selected.selectedTopic.packagingType}</span>
                      </div>
                      <p className="leading-relaxed text-foreground/90">{selected.selectedTopic.topic}</p>
                    </div>
                    <ScriptCard script={selected.script} />
                  </div>
                ) : items.length === 0 ? (
                  <div className="py-16 text-center text-sm text-muted-foreground">
                    <Clock className="w-8 h-8 mx-auto mb-3 opacity-40" />
                    <p>还没有生成记录</p>
                    <p className="text-xs mt-1">完成一次脚本生成后会自动保存在这里</p>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {items.map((item) => (
                      <li key={item.id}>
                        <div
                          className={cn(
                            'group flex items-start gap-2 rounded-xl border border-border/80 bg-card/40',
                            'hover:border-foreground/15 hover:bg-card/70 transition-colors'
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => setSelectedId(item.id)}
                            className="flex-1 text-left px-4 py-3 min-w-0"
                          >
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <span className="text-sm font-medium text-foreground truncate">
                                {item.basicInput.product}
                              </span>
                              <span className="text-[11px] text-muted-foreground shrink-0">
                                {formatHistoryTime(item.createdAt)}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                              {item.selectedTopic.topic}
                            </p>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground">
                                {item.selectedTopic.packagingType}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground truncate max-w-[140px]">
                                {item.basicInput.industry}
                              </span>
                            </div>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            className="p-3 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                            aria-label="删除记录"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {!selected && items.length > 0 && (
                <div className="px-6 py-4 border-t border-border flex justify-between shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => {
                      if (window.confirm('确定清空全部历史记录？')) {
                        clearHistory()
                        setSelectedId(null)
                      }
                    }}
                  >
                    清空全部
                  </Button>
                  <Button onClick={() => setOpen(false)}>关闭</Button>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}
    </>
  )
}
