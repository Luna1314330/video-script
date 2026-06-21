'use client'

import { useState, useMemo } from 'react'
import { Search, Ban, Unlock, Eye, ChevronLeft, ChevronRight } from 'lucide-react'
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
} from '@/components/ui/dialog'
import { mockUsers, type User } from '@/lib/admin-data'

const ITEMS_PER_PAGE = 10

const membershipTypeMap = {
  monthly: '月卡',
  quarterly: '季卡',
  yearly: '年卡',
}

const statusMap = {
  active: { label: '正常', variant: 'default' as const },
  banned: { label: '已封禁', variant: 'destructive' as const },
}

const membershipStatusMap = {
  active: { label: '有效', variant: 'default' as const },
  expired: { label: '已过期', variant: 'secondary' as const },
  cancelled: { label: '已取消', variant: 'secondary' as const },
}

function UserDetailDialog({
  user,
  open,
  onClose,
}: {
  user: User | null
  open: boolean
  onClose: () => void
}) {
  if (!user) return null

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>用户详情</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">用户ID</p>
              <p className="font-medium">{user.id}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">状态</p>
              <Badge variant={statusMap[user.status].variant}>
                {statusMap[user.status].label}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">手机号</p>
              <p className="font-medium">{user.phone}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">昵称</p>
              <p className="font-medium">{user.nickname}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">注册时间</p>
              <p className="font-medium">{user.createdAt}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">最后登录</p>
              <p className="font-medium">{user.lastLoginAt}</p>
            </div>
          </div>

          {user.membership && (
            <div className="rounded-lg bg-muted/50 p-4">
              <p className="mb-2 text-sm font-medium">会员信息</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">套餐类型：</span>
                  <span>{membershipTypeMap[user.membership.type]}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">到期时间：</span>
                  <span>{user.membership.expireAt}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">状态：</span>
                  <Badge variant={membershipStatusMap[user.membership.status].variant}>
                    {membershipStatusMap[user.membership.status].label}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function UsersPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [users, setUsers] = useState(mockUsers)

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        searchQuery === '' ||
        user.phone.includes(searchQuery) ||
        user.nickname.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = statusFilter === 'all' || user.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [users, searchQuery, statusFilter])

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE)
  const paginatedUsers = filteredUsers.slice(
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

  const handleToggleBan = (user: User) => {
    const newStatus = user.status === 'active' ? 'banned' : 'active'
    const action = newStatus === 'banned' ? '封禁' : '解封'

    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u))
    )
    toast.success(`${user.nickname} 已${action}`)
  }

  const handleViewDetail = (user: User) => {
    setSelectedUser(user)
    setDetailDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">用户管理</h1>
        <p className="text-sm text-muted-foreground">管理平台注册用户</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base">用户列表</CardTitle>
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
                  <SelectItem value="active">正常</SelectItem>
                  <SelectItem value="banned">已封禁</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>用户ID</TableHead>
                <TableHead>手机号</TableHead>
                <TableHead>昵称</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>会员</TableHead>
                <TableHead>注册时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <p className="text-muted-foreground">暂无数据</p>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-mono text-xs">{user.id}</TableCell>
                    <TableCell>{user.phone}</TableCell>
                    <TableCell>{user.nickname}</TableCell>
                    <TableCell>
                      <Badge variant={statusMap[user.status].variant}>
                        {statusMap[user.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {user.membership ? (
                        <Badge variant="outline">
                          {membershipTypeMap[user.membership.type]}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {user.createdAt}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => handleViewDetail(user)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => handleToggleBan(user)}
                        >
                          {user.status === 'active' ? (
                            <Ban className="h-4 w-4 text-destructive" />
                          ) : (
                            <Unlock className="h-4 w-4 text-green-600" />
                          )}
                        </Button>
                      </div>
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
                共 {filteredUsers.length} 条记录，第 {currentPage}/{totalPages} 页
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

      <UserDetailDialog
        user={selectedUser}
        open={detailDialogOpen}
        onClose={() => setDetailDialogOpen(false)}
      />
    </div>
  )
}
