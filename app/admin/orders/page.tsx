'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  Search,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const ITEMS_PER_PAGE = 10

const membershipTypeMap: Record<string, string> = {
  monthly: '月卡',
  quarterly: '季卡',
  yearly: '年卡',
}

const statusMap: Record<string, { label: string; className: string }> = {
  pending: { label: '待支付', className: 'bg-yellow-100 text-yellow-800' },
  paid: { label: '已支付', className: 'bg-green-100 text-green-800' },
  refunded: { label: '已退款', className: 'bg-red-100 text-red-800' },
  cancelled: { label: '已取消', className: 'bg-gray-100 text-gray-800' },
}

interface Order {
  id: string
  orderNo: string
  userId: string
  phone: string
  nickname: string
  type: string
  amount: number
  paymentMethod: string
  status: string
  createdAt: string
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/orders')
      const data = await res.json()
      if (data.success) {
        setOrders(data.data)
      }
    } catch (error) {
      console.error('获取订单失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const matchesSearch =
        searchQuery === '' ||
        o.phone.includes(searchQuery) ||
        o.orderNo.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = statusFilter === 'all' || o.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [orders, searchQuery, statusFilter])

  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE)
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  )

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1)
  }

  const handleStatusFilter = (value: string) => {
    setStatusFilter(value)
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
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="搜索订单号/手机号"
                  value={searchQuery}
                  onChange={handleSearch}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={handleStatusFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="筛选状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="pending">待支付</SelectItem>
                  <SelectItem value="paid">已支付</SelectItem>
                  <SelectItem value="refunded">已退款</SelectItem>
                  <SelectItem value="cancelled">已取消</SelectItem>
                </SelectContent>
              </Select>
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
                <TableHead>套餐</TableHead>
                <TableHead>金额</TableHead>
                <TableHead>支付方式</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>时间</TableHead>
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
                    <TableCell>
                      <Badge variant="outline">
                        {membershipTypeMap[order.type] || order.type}
                      </Badge>
                    </TableCell>
                    <TableCell>¥{order.amount}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {order.paymentMethod === 'wechat' ? '微信' : order.paymentMethod === 'alipay' ? '支付宝' : '-'}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${statusMap[order.status]?.className || 'bg-gray-100 text-gray-800'}`}>
                        {statusMap[order.status]?.label || order.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {order.createdAt}
                    </TableCell>
                    <TableCell className="text-right">
                      {order.status === 'paid' && (
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

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                第 {currentPage} / {totalPages} 页
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
