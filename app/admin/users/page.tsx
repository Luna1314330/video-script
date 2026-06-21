'use client'

import { useState, useMemo } from 'react'
import { Search, Ban, Unlock, Eye, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [newPhone, setNewPhone] = useState('')
  const [newNickname, setNewNickname] = useState('')
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

  const handleAddUser = () => {
    if (!newPhone.trim()) {
      toast.error('请输入手机号')
      return
    }
    if (!/^1[3-9]\d{9}$/.test(newPhone)) {
      toast.error('请输入正确的手机号')
      return
    }

    // 检查手机号是否已存在
    if (users.some(u => u.phone === newPhone)) {
      toast.error('该手机号已注册')
      return
    }

    const newUser: User = {
      id: `U${Date.now()}`,
      phone: newPhone,
      nickname: newNickname.trim() || `用户${newPhone.slice(-4)}`,
      status: 'active',
      membership: null,
      createdAt: new Date().toLocaleString('zh-CN'),
      lastLogin: new Date().toLocaleString('zh-CN'),
    }

    setUsers(prev => [newUser, ...prev])
    setAddDialogOpen(false)
    setNewPhone('')
    setNewNickname('')
    toast.success('用户添加成功')
  }

  const openAddDialog = () => {
    setNewPhone('')
    setNewNickname('')
    setAddDialogOpen(true)
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
              <Button onClick={openAddDialog} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                添加用户
              </Button>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="搜索手机号/昵称"
                  value={searchQuery}
                  onChange={handleSearch}
                  className="pl-9"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilter(e.target.value)}
                className="h-9 w-[120px] rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              >
                <option value="all">全部状态</option>
                <option value="active">正常</option>
                <option value="banned">已封禁</option>
              </select>
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

      {/* 添加用户对话框 */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>添加用户</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="phone">手机号 <span className="text-destructive">*</span></Label>
              <Input
                id="phone"
                placeholder="请输入手机号"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                maxLength={11}
              />
              <p className="text-xs text-muted-foreground">用户使用手机号登录</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="nickname">昵称</Label>
              <Input
                id="nickname"
                placeholder="请输入昵称（选填）"
                value={newNickname}
                onChange={(e) => setNewNickname(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">不填则自动生成</p>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleAddUser}>
                添加
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
