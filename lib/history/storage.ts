import type { BasicInput, GeneratedScript, GenerationHistoryEntry, StrategyTopicItem } from '@/lib/types'

const STORAGE_KEY = 'script-workshop-history'
export const HISTORY_MAX_ITEMS = 20

export function loadHistory(): GenerationHistoryEntry[] {
  if (typeof window === 'undefined') return []

  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as GenerationHistoryEntry[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function persistHistory(items: GenerationHistoryEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, HISTORY_MAX_ITEMS)))
}

export function saveHistoryEntry(input: {
  basicInput: BasicInput
  selectedTopic: StrategyTopicItem
  script: GeneratedScript
}): GenerationHistoryEntry {
  const existing = loadHistory()
  const duplicate = existing.find((item) => item.script.id === input.script.id)
  if (duplicate) {
    return duplicate
  }

  const entry: GenerationHistoryEntry = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    basicInput: input.basicInput,
    selectedTopic: input.selectedTopic,
    script: input.script,
  }

  persistHistory([entry, ...loadHistory()])
  window.dispatchEvent(new CustomEvent('history-updated'))
  return entry
}

export function removeHistoryEntry(id: string) {
  persistHistory(loadHistory().filter((item) => item.id !== id))
  window.dispatchEvent(new CustomEvent('history-updated'))
}

export function clearHistory() {
  localStorage.removeItem(STORAGE_KEY)
  window.dispatchEvent(new CustomEvent('history-updated'))
}

export function formatHistoryTime(iso: string): string {
  return new Date(iso).toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
