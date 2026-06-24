import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchUserOrders } from '@/lib/orders/client'

vi.mock('@/lib/auth-client', () => ({
  authFetch: vi.fn(),
  getAuthHeaders: vi.fn(() => ({ Authorization: 'Bearer test' })),
}))

import { authFetch } from '@/lib/auth-client'

describe('fetchUserOrders', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('解析用户订单列表', async () => {
    vi.mocked(authFetch).mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          items: [
            {
              id: 'o1',
              orderNo: 'ORD001',
              title: '会员购买',
              amount: 6.9,
              paymentLabel: '微信支付',
              status: 'paid',
              statusLabel: '已完成',
              createdAt: '2026-06-23 10:16:18',
              paidAt: '2026-06-23 10:16:18',
            },
          ],
          total: 1,
          page: 1,
          pageSize: 10,
        }),
        { status: 200 },
      ),
    )

    const result = await fetchUserOrders({ page: 1, pageSize: 10 })

    expect(result.items).toHaveLength(1)
    expect(result.pagination.total).toBe(1)
  })
})
