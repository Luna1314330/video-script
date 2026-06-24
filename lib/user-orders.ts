import { count, desc, eq } from 'drizzle-orm'
import type { AppDb } from '@/lib/db/index'
import { orders } from '@/lib/db/schema'
import {
  formatDateTime,
  isManualOrder,
  type OrderStatus,
} from '@/lib/db/tables'

const PAYMENT_LABELS: Record<string, string> = {
  wechat: '微信支付',
  alipay: '支付宝',
  manual: '手动开通',
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: '待支付',
  paid: '已完成',
  failed: '支付失败',
  refunded: '已退款',
}

export type UserOrderItem = {
  id: string
  orderNo: string
  title: string
  amount: number
  paymentMethod: string
  paymentLabel: string
  status: OrderStatus
  statusLabel: string
  isManualOrder: boolean
  createdAt: string
  paidAt: string | null
}

function mapUserOrder(row: {
  id: string
  orderNo: string
  amount: string | number
  paymentMethod: string
  status: string
  paidAt: string | null
  createdAt: string
}): UserOrderItem {
  const manual = isManualOrder({
    payment_method: row.paymentMethod,
    order_no: row.orderNo,
  })
  const status = row.status as OrderStatus

  return {
    id: row.id,
    orderNo: row.orderNo,
    title: manual ? '管理员开通会员' : '会员购买',
    amount: Number(row.amount ?? 0),
    paymentMethod: row.paymentMethod,
    paymentLabel: PAYMENT_LABELS[row.paymentMethod] || row.paymentMethod,
    status,
    statusLabel: STATUS_LABELS[status] || row.status,
    isManualOrder: manual,
    createdAt: formatDateTime(row.createdAt),
    paidAt: row.paidAt ? formatDateTime(row.paidAt) : null,
  }
}

export async function listUserOrders(
  db: AppDb,
  userId: string,
  options: { page?: number; pageSize?: number } = {},
): Promise<{ items: UserOrderItem[]; total: number; page: number; pageSize: number }> {
  const page = Math.max(1, options.page ?? 1)
  const pageSize = Math.min(50, Math.max(1, options.pageSize ?? 20))
  const offset = (page - 1) * pageSize

  const whereClause = eq(orders.userId, userId)

  const [countRows, rows] = await Promise.all([
    db.select({ value: count() }).from(orders).where(whereClause),
    db
      .select()
      .from(orders)
      .where(whereClause)
      .orderBy(desc(orders.createdAt))
      .limit(pageSize)
      .offset(offset),
  ])

  return {
    items: rows.map(mapUserOrder),
    total: Number(countRows[0]?.value ?? 0),
    page,
    pageSize,
  }
}
