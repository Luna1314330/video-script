'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  Search,
  RotateCcw,
} from 'lucide-react'
import { AdminTablePagination } from '@/components/admin/AdminTablePagination'
import { paginateArray } from '@/lib/admin-pagination'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const statusMap: Record<string, { label: string; className: string }> = {
  pending: { label: '待支付', className: 'bg-yellow-100 text-yellow-800' },
  paid: { label: '已支付', className: 'bg-green-100 text-green-800' },
  failed: { label: '支付失败', className: 'bg-red-100 text-red-800' },
  refunded: { label: '已退款', className: 'bg-red-100 text-red-800' },
}

interface Order {
  id: string
  orderNo: string
  userId: string
  phone: string
  nickname: string
  amount: number
  paymentMethod: string
  isManualOrder?: boolean
  status: string
  paidAt: string
  createdAt: string
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/orders', { credentials: 'include' })
      const data = await res.json()
      if (data.success) {
        setOrders(data.data)
      } else {
        setOrders([])
        toast.error(data.error || '获取订单列表失败')
      }
    } catch {
      setOrders([])
      toast.error('获取订单列表失败')
    } finally {
      setLoading(false)
    }
  }

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      return (
        searchQuery === '' ||
        o.phone.includes(searchQuery) ||
        o.orderNo.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })
  }, [orders, searchQuery])

  const { items: paginatedOrders, total, totalPages } = useMemo(
    () => paginateArray(filteredOrders, currentPage),
    [filteredOrders, currentPage],
  )

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1)
  }

  const handleRefund = async (order: Order) => {
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: order.id, status: 'refunded' }),
      })
      const data = await res.json()
      if (data.success) {
        setOrders((prev) =>
          prev.map((o) =>
            o.id === order.id ? { ...o, status: 'refunded' } : o
          )
        )
        toast.success(`订单 ${order.orderNo} 已退款`)
      }
    } catch (error) {
      console.error('退款失败:', error)
      toast.error('退款失败，请重试')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">订单管理</h1>
        <p className="text-sm text-muted-foreground">管理平台订单记录</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">订单列表</CardTitle>
            <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="搜索订单号/手机号"
                  value={searchQuery}
                  onChange={handleSearch}
                  className="pl-9"
                />
              </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>订单号</TableHead>
                <TableHead>用户</TableHead>
                <TableHead>手机号</TableHead>
                <TableHead>金额</TableHead>
                <TableHead>支付方式</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>支付时间</TableHead>
                <TableHead>创建时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    加载中...
                  </TableCell>
                </TableRow>
              ) : paginatedOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <p className="text-muted-foreground">暂无数据</p>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-sm">{order.orderNo}</TableCell>
                    <TableCell>{order.nickname || '-'}</TableCell>
                    <TableCell>{order.phone || '-'}</TableCell>
                    <TableCell>¥{order.amount}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {order.paymentMethod || '-'}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${statusMap[order.status]?.className || 'bg-gray-100 text-gray-800'}`}>
                        {statusMap[order.status]?.label || order.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {order.paidAt}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {order.createdAt}
                    </TableCell>
                    <TableCell className="text-right">
                      {order.status === 'paid' && !order.isManualOrder && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRefund(order)}
                          className="text-red-600"
                        >
                          <RotateCcw className="h-4 w-4 mr-1" />
                          退款
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <AdminTablePagination
            page={currentPage}
            totalPages={totalPages}
            total={total}
            onPageChange={setCurrentPage}
          />
        </CardContent>
      </Card>
    </div>
  )
}
