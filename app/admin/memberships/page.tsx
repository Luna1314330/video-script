'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  Plus,
  Search,
  AlertTriangle,
  Power,
  PowerOff,
  ChevronLeft,
  ChevronRight,
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
import { mockMemberships, mockUsers, type Membership, type User } from '@/lib/admin-data'

const ITEMS_PER_PAGE = 10

const membershipTypeMap = {
  monthly: '月卡',
  quarterly: '季卡',
  yearly: '年卡',
}

const membershipTypePriceMap = {
  monthly: 39,
  quarterly: 99,
  yearly: 299,
}

const statusMap = {
  active: { label: '有效', variant: 'default' as const, className: 'bg-green-100 text-green-800' },
  expired: { label: '已过期', variant: 'secondary' as const, className: 'bg-gray-100 text-gray-800' },
  cancelled: { label: '已取消', variant: 'secondary' as const, className: 'bg-gray-100 text-gray-800' },
}

function ActivateMembershipDialog({
  open,
  onClose,
  onSuccess,
}: {
  open: boolean
  onClose: () => void
  onSuccess: (userId: string, type: Membership['type']) => void
}) {
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [membershipType, setMembershipType] = useState<Membership['type']>('monthly')

  const availableUsers = mockUsers.filter(
    (u) => u.status === 'active' && !u.membership?.status === 'active'
  )

  const handleSubmit = () => {
    if (!selectedUserId) {
      toast.error('请选择用户')
      return
    }
    onSuccess(selectedUserId, membershipType)
    setSelectedUserId('')
    setMembershipType('monthly')
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>开通会员</DialogTitle>
          <DialogDescription>为用户手动开通会员服务</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">选择用户</label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="请选择用户" />
              </SelectTrigger>
              <SelectContent>
                {mockUsers
                  .filter((u) => u.status === 'active')
                  .map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.nickname} ({user.phone})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">会员类型</label>
            <Select
              value={membershipType}
              onValueChange={(v) => setMembershipType(v as Membership['type'])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">
                  月卡 - ¥{membershipTypePriceMap.monthly}
                </SelectItem>
                <SelectItem value="quarterly">
                  季卡 - ¥{membershipTypePriceMap.quarterly}
                </SelectItem>
                <SelectItem value="yearly">
                  年卡 - ¥{membershipTypePriceMap.yearly}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSubmit}>确认开通</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function MembershipsPage() {
  const [mounted, setMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [activateDialogOpen, setActivateDialogOpen] = useState(false)
  const [memberships, setMemberships] = useState(mockMemberships)

  useEffect(() => {
    setMounted(true)
  }, [])

  const filteredMemberships = useMemo(() => {
    return memberships.filter((m) => {
      const matchesSearch =
        searchQuery === '' ||
        m.userPhone.includes(searchQuery) ||
        m.userNickname.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = statusFilter === 'all' || m.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [memberships, searchQuery, statusFilter])

  const totalPages = Math.ceil(filteredMemberships.length / ITEMS_PER_PAGE)
  const paginatedMemberships = filteredMemberships.slice(
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

  const handleToggleMembership = (membership: Membership) => {
    const newStatus = membership.status === 'active' ? 'cancelled' : 'active'
    const action = newStatus === 'cancelled' ? '关闭' : '开通'

    setMemberships((prev) =>
      prev.map((m) =>
        m.id === membership.id ? { ...m, status: newStatus } : m
      )
    )
    toast.success(`用户 ${membership.userNickname} 的会员已${action}`)
  }

  const handleActivateMembership = (userId: string, type: Membership['type']) => {
    const user = mockUsers.find((u) => u.id === userId)
    if (!user) return

    const now = new Date()
    const expireDate = new Date()
    if (type === 'monthly') {
      expireDate.setMonth(expireDate.getMonth() + 1)
    } else if (type === 'quarterly') {
      expireDate.setMonth(expireDate.getMonth() + 3)
    } else {
      expireDate.setFullYear(expireDate.getFullYear() + 1)
    }

    const newMembership: Membership = {
      id: `MB${Date.now()}`,
      userId,
      userPhone: user.phone,
      userNickname: user.nickname,
      type,
      price: membershipTypePriceMap[type],
      startAt: now.toISOString().split('T')[0],
      expireAt: expireDate.toISOString().split('T')[0],
      status: 'active',
      autoRenew: false,
    }

    setMemberships((prev) => [...prev, newMembership])
    toast.success(`用户 ${user.nickname} 的${membershipTypeMap[type]}已开通`)
  }

  const isExpiringSoon = (expireAt: string) => {
    const expire = new Date(expireAt)
    const now = new Date()
    const diffDays = Math.ceil((expire.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays <= 7 && diffDays > 0
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">会员管理</h1>
          <p className="text-sm text-muted-foreground">管理平台会员服务</p>
        </div>
        <Button onClick={() => setActivateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          手动开通
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">会员列表</CardTitle>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="搜索手机号/昵称"
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
                  <SelectItem value="active">有效</SelectItem>
                  <SelectItem value="expired">已过期</SelectItem>
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
                <TableHead>用户</TableHead>
                <TableHead>手机号</TableHead>
                <TableHead>套餐</TableHead>
                <TableHead>开始时间</TableHead>
                <TableHead>到期时间</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedMemberships.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <p className="text-muted-foreground">暂无数据</p>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedMemberships.map((membership) => (
                  <TableRow key={membership.id}>
                    <TableCell className="font-medium">
                      {membership.userNickname}
                    </TableCell>
                    <TableCell>{membership.userPhone}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {membershipTypeMap[membership.type]}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          ¥{membership.price}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {membership.startAt}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{membership.expireAt}</span>
                        {membership.status === 'active' &&
                          isExpiringSoon(membership.expireAt) && (
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                          )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={statusMap[membership.status].variant}
                        className={statusMap[membership.status].className}
                      >
                        {statusMap[membership.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon-xs"
                        onClick={() => handleToggleMembership(membership)}
                      >
                        {membership.status === 'active' ? (
                          <PowerOff className="h-4 w-4 text-destructive" />
                        ) : (
                          <Power className="h-4 w-4 text-green-600" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                共 {filteredMemberships.length} 条记录，第 {currentPage}/{totalPages} 页
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

      <ActivateMembershipDialog
        open={activateDialogOpen}
        onClose={() => setActivateDialogOpen(false)}
        onSuccess={handleActivateMembership}
      />
    </div>
  )
}
