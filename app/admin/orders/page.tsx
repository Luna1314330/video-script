'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  Search,
  Eye,
  Undo2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Smartphone,
  Wallet,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { mockOrders, type Order } from '@/lib/admin-data'

const ITEMS_PER_PAGE = 10

const paymentMethodMap = {
  wechat: { label: '微信支付', icon: Smartphone, className: 'text-green-600' },
  alipay: { label: '支付宝', icon: CreditCard, className: 'text-blue-600' },
  card: { label: '银行卡', icon: Wallet, className: 'text-gray-600' },
}

const statusMap = {
  pending: { label: '待支付', variant: 'secondary' as const, className: 'bg-yellow-100 text-yellow-800' },
  paid: { label: '已支付', variant: 'default' as const, className: 'bg-green-100 text-green-800' },
  refunded: { label: '已退款', variant: 'secondary' as const, className: 'bg-gray-100 text-gray-800' },
  cancelled: { label: '已取消', variant: 'secondary' as const, className: 'bg-red-100 text-red-800' },
}

function OrderDetailDialog({
  order,
  open,
  onClose,
}: {
  order: Order | null
  open: boolean
  onClose: () => void
}) {
  if (!order) return null

  const PaymentIcon = paymentMethodMap[order.paymentMethod].icon

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>订单详情</DialogTitle>
          <DialogDescription>订单号：{order.id}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">商品名称</p>
              <p className="font-medium">{order.productName}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">订单金额</p>
              <p className="font-medium text-primary">¥{order.amount}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">用户手机号</p>
              <p className="font-medium">{order.userPhone}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">支付方式</p>
              <div className={`flex items-center gap-1 font-medium ${paymentMethodMap[order.paymentMethod].className}`}>
                <PaymentIcon className="h-4 w-4" />
                {paymentMethodMap[order.paymentMethod].label}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">订单状态</p>
              <Badge variant={statusMap[order.status].variant} className={statusMap[order.status].className}>
                {statusMap[order.status].label}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">下单时间</p>
              <p className="font-medium">{order.createdAt}</p>
            </div>
          </div>

          {order.paidAt && (
            <div>
              <p className="text-sm text-muted-foreground">支付时间</p>
              <p className="font-medium">{order.paidAt}</p>
            </div>
          )}

          {order.refundedAt && (
            <div>
              <p className="text-sm text-muted-foreground">退款时间</p>
              <p className="font-medium">{order.refundedAt}</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function RefundConfirmDialog({
  order,
  open,
  onClose,
  onConfirm,
}: {
  order: Order | null
  open: boolean
  onClose: () => void
  onConfirm: (orderId: string) => void
}) {
  if (!order) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>确认退款</DialogTitle>
          <DialogDescription>
            确定要为订单 {order.id} 进行退款吗？
          </DialogDescription>
        </DialogHeader>
        <div className="rounded-lg bg-muted/50 p-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-muted-foreground">商品：</span>
              <span>{order.productName}</span>
            </div>
            <div>
              <span className="text-muted-foreground">金额：</span>
              <span className="font-medium text-primary">¥{order.amount}</span>
            </div>
            <div>
              <span className="text-muted-foreground">用户：</span>
              <span>{order.userPhone}</span>
            </div>
            <div>
              <span className="text-muted-foreground">支付方式：</span>
              <span>{paymentMethodMap[order.paymentMethod].label}</span>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onConfirm(order.id)
              onClose()
            }}
          >
            确认退款
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function OrdersPage() {
  const [mounted, setMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [refundDialogOpen, setRefundDialogOpen] = useState(false)
  const [orders, setOrders] = useState(mockOrders)

  useEffect(() => {
    setMounted(true)
  }, [])

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        searchQuery === '' ||
        order.userPhone.includes(searchQuery) ||
        order.id.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = statusFilter === 'all' || order.status === statusFilter

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

  const handleViewDetail = (order: Order) => {
    setSelectedOrder(order)
    setDetailDialogOpen(true)
  }

  const handleRefund = (order: Order) => {
    setSelectedOrder(order)
    setRefundDialogOpen(true)
  }

  const handleConfirmRefund = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId
          ? { ...o, status: 'refunded' as const, refundedAt: new Date().toLocaleString() }
          : o
      )
    )
    toast.success('退款成功')
  }

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <span className="text-gray-500">加载中...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">订单管理</h1>
        <p className="text-sm text-muted-foreground">管理平台交易订单</p>
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
                <TableHead>商品</TableHead>
                <TableHead>金额</TableHead>
                <TableHead>支付方式</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>下单时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <p className="text-muted-foreground">暂无数据</p>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedOrders.map((order) => {
                  const PaymentIcon = paymentMethodMap[order.paymentMethod].icon
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs">{order.id}</TableCell>
                      <TableCell>{order.userPhone}</TableCell>
                      <TableCell>{order.productName}</TableCell>
                      <TableCell className="font-medium text-primary">
                        ¥{order.amount}
                      </TableCell>
                      <TableCell>
                        <div className={`flex items-center gap-1 ${paymentMethodMap[order.paymentMethod].className}`}>
                          <PaymentIcon className="h-4 w-4" />
                          <span className="text-sm">
                            {paymentMethodMap[order.paymentMethod].label}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={statusMap[order.status].variant}
                          className={statusMap[order.status].className}
                        >
                          {statusMap[order.status].label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {order.createdAt}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => handleViewDetail(order)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {order.status === 'paid' && (
                            <Button
                              variant="ghost"
                              size="icon-xs"
                              onClick={() => handleRefund(order)}
                            >
                              <Undo2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                共 {filteredOrders.length} 条记录，第 {currentPage}/{totalPages} 页
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <OrderDetailDialog
        order={selectedOrder}
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
      />

      <RefundConfirmDialog
        order={selectedOrder}
        open={refundDialogOpen}
        onClose={() => setRefundDialogOpen(false)}
        onConfirm={handleConfirmRefund}
      />
    </div>
  )
}
