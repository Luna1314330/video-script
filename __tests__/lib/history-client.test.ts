import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchScriptHistory } from '@/lib/history/client'

vi.mock('@/lib/auth-client', () => ({
  authFetch: vi.fn(),
  getAuthHeaders: vi.fn(() => ({ Authorization: 'Bearer test' })),
  isLoggedIn: vi.fn(() => true),
}))

import { authFetch } from '@/lib/auth-client'

describe('fetchScriptHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('解析 API 返回的 items 与分页字段', async () => {
    vi.mocked(authFetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          items: [{ id: 'h1', createdAt: '2026-06-23 10:35:53' }],
          page: 1,
          pageSize: 5,
          total: 1,
        }),
        { status: 200 },
      ),
    )

    const result = await fetchScriptHistory({ page: 1, pageSize: 5 })

    expect(result.items).toHaveLength(1)
    expect(result.pagination).toEqual({
      page: 1,
      pageSize: 5,
      total: 1,
      totalPages: 1,
    })
  })
})
