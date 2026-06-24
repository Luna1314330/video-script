import { authFetch, getAuthHeaders } from '@/lib/auth-client'
import type { UserOrderItem } from '@/lib/user-orders'

export type UserOrdersPage = {
  items: UserOrderItem[]
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export async function fetchUserOrders(options?: {
  page?: number
  pageSize?: number
}): Promise<UserOrdersPage> {
  const page = options?.page ?? 1
  const pageSize = options?.pageSize ?? 20
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
  })

  const res = await authFetch(`/api/orders?${params}`, { headers: getAuthHeaders() })
  const data = await res.json()

  if (!res.ok || !data.success) {
    throw new Error(data.error || '获取订单失败')
  }

  const total = Number(data.total) || 0
  const pageNum = Number(data.page) || page
  const pageSizeNum = Number(data.pageSize) || pageSize

  return {
    items: (data.items ?? []) as UserOrderItem[],
    pagination: {
      page: pageNum,
      pageSize: pageSizeNum,
      total,
      totalPages: Math.max(1, Math.ceil(total / pageSizeNum)),
    },
  }
}
