import { authFetch, getAuthHeaders, isLoggedIn } from '@/lib/auth-client'
import type { GenerationHistoryEntry } from '@/lib/types'

export const SCRIPT_HISTORY_PAGE_SIZE = 5

export type ScriptHistoryPage = {
  items: GenerationHistoryEntry[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export function formatHistoryTime(iso: string): string {
  return new Date(iso).toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export async function fetchScriptHistory(options?: {
  page?: number
  pageSize?: number
}): Promise<ScriptHistoryPage> {
  if (!isLoggedIn()) {
    return {
      items: [],
      pagination: { page: 1, pageSize: options?.pageSize ?? 50, total: 0, totalPages: 1 },
    }
  }

  const page = options?.page ?? 1
  const pageSize = options?.pageSize ?? 50
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  })

  const res = await authFetch(`/api/scripts?${params}`, { headers: getAuthHeaders() })
  const data = await res.json()

  if (!res.ok || !data.success) {
    throw new Error(data.error || '获取历史脚本失败')
  }

  const pageNum = Number(data.page) || page
  const pageSizeNum = Number(data.pageSize) || pageSize
  const total = Number(data.total) || 0

  return {
    items: (data.items ?? []) as GenerationHistoryEntry[],
    pagination: {
      page: pageNum,
      pageSize: pageSizeNum,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSizeNum)),
    },
  }
}

export async function deleteScriptHistory(id: string): Promise<void> {
  const res = await authFetch(`/api/scripts/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  })
  const data = await res.json()

  if (!res.ok || !data.success) {
    throw new Error(data.error || '删除失败')
  }
}

export function notifyHistoryUpdated() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('history-updated'))
}
