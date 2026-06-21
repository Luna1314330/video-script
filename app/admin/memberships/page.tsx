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

const ITEMS_PER_PAGE = 10

const membershipTypeMap: Record<string, string> = {
  monthly: '月卡',
  quarterly: '季卡',
  yearly: '年卡',
}

const statusMap: Record<string, { label: string; className: string }> = {
  active: { label: '有效', className: 'bg-green-100 text-green-800' },
  expired: { label: '已过期', className: 'bg-gray-100 text-gray-800' },
  cancelled: { label: '已取消', className: 'bg-gray-100 text-gray-800' },
}

interface Membership {
  id: string
  userId: string
  phone: string
  nickname: string
  type: string
  startDate: string
  expireDate: string
  status: string
  createdAt: string
}

interface Settings {
  membership?: {
    monthly?: { price: number; enabled: boolean }
    quarterly?: { price: number; enabled: boolean }
    yearly?: { price: number; enabled: boolean }
  }
}

function ActivateMembershipDialog({
  open,
  onClose,
  onSuccess,
  settings,
}: {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  settings: Settings
}) {
  const [searchPhone, setSearchPhone] = useState('')
  const [membershipType, setMembershipType] = useState('monthly')
  const [foundUser, setFoundUser] = useState<{ id: string; phone: string; nickname: string } | null>(null)
  const [searching, setSearching] = useState(false)

  const getMembershipLabel = (type: string) => {
    const prices = settings?.membership || {}
    switch (type) {
      case 'monthly': return `月度 - ¥${prices.monthly?.price || 39}`
      case 'quarterly': return `季度 - ¥${prices.quarterly?.price || 99}`
      case 'yearly': return `年度 - ¥${prices.yearly?.price || 299}`
      default: return type
    }
  }

  // 获取可选的会员类型
  const availableTypes = useMemo(() => {
    const prices = settings?.membership || {}
    return Object.entries(prices)
      .filter(([_, config]: [string, any]) => config.enabled !== false)
      .map(([key]) => key)
  }, [settings])

  // 搜索用户
  useEffect(() => {
    if (!searchPhone || searchPhone.length < 11) {
      setFoundUser(null)
      return
    }

    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch('/api/admin/users')
        const data = await res.json()
        if (data.success) {
          const user = data.data.find((u: any) => 
            u.phone === searchPhone || u.phone.includes(searchPhone)
          )
          setFoundUser(user ? { id: user.id, phone: user.phone, nickname: user.nickname } : null)
        }
      } catch (error) {
        console.error('搜索用户失败:', error)
        setFoundUser(null)
      } finally {
        setSearching(false)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [searchPhone])

  const handleSubmit = async () => {
    if (!foundUser) {
      toast.error('请输入正确的手机号')
      return
    }

    try {
      const res = await fetch('/api/admin/memberships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: foundUser.id, type: membershipType }),
      })
      const data = await res.json()
      if (data.success) {
        toast.success(`用户 ${foundUser.nickname} 的${membershipTypeMap[membershipType]}已开通`)
        setSearchPhone('')
        setMembershipType('monthly')
        onClose()
        onSuccess()
      } else {
        toast.error(data.error || '开通失败')
      }
    } catch (error) {
      console.error('开通会员失败:', error)
      toast.error('开通失败，请重试')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>开通会员</DialogTitle>
          <DialogDescription>为用户手动开通会员服务</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">搜索用户</label>
            <Input
              placeholder="输入手机号搜索"
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value)}
            />
            {searching && <p className="text-sm text-muted-foreground">搜索中...</p>}
            {foundUser && (
              <p className="text-sm text-green-600">
                找到用户：{foundUser.nickname || foundUser.phone}
              </p>
            )}
            {!searching && searchPhone.length >= 11 && !foundUser && (
              <p className="text-sm text-red-500">未找到该用户</p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">会员类型</label>
            <Select value={membershipType} onValueChange={setMembershipType}>
              <SelectTrigger className="w-full">
                <SelectValue>{getMembershipLabel(membershipType)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {availableTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {getMembershipLabel(type)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>取消</Button>
          <Button onClick={handleSubmit} disabled={!foundUser}>确认开通</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function MembershipsPage() {
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [settings, setSettings] = useState<Settings>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [activateDialogOpen, setActivateDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [membershipsRes, settingsRes] = await Promise.all([
        fetch('/api/admin/memberships'),
        fetch('/api/admin/settings'),
      ])
      const membershipsData = await membershipsRes.json()
      const settingsData = await settingsRes.json()
      
      if (membershipsData.success) {
        setMemberships(membershipsData.data)
      }
      if (settingsData.success) {
        setSettings(settingsData.data)
      }
    } catch (error) {
      console.error('获取数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredMemberships = useMemo(() => {
    return memberships.filter((m) => {
      const matchesSearch =
        searchQuery === '' ||
        m.phone.includes(searchQuery) ||
        m.nickname.toLowerCase().includes(searchQuery.toLowerCase())

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

  const handleToggleMembership = async (membership: Membership) => {
    const newStatus = membership.status === 'active' ? 'cancelled' : 'active'
    const action = newStatus === 'cancelled' ? '关闭' : '开通'

    try {
      const res = await fetch('/api/admin/memberships', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: membership.id, status: newStatus }),
      })
      const data = await res.json()
      if (data.success) {
        setMemberships((prev) =>
          prev.map((m) =>
            m.id === membership.id ? { ...m, status: newStatus } : m
          )
        )
        toast.success(`用户 ${membership.nickname} 的会员已${action}`)
      }
    } catch (error) {
      console.error('更新会员状态失败:', error)
      toast.error('操作失败，请重试')
    }
  }

  const isExpiringSoon = (expireDate: string) => {
    const expire = new Date(expireDate)
    const now = new Date()
    const diffDays = Math.ceil((expire.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return diffDays <= 7 && diffDays > 0
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
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    加载中...
                  </TableCell>
                </TableRow>
              ) : paginatedMemberships.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <p className="text-muted-foreground">暂无数据</p>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedMemberships.map((membership) => (
                  <TableRow key={membership.id}>
                    <TableCell className="font-medium">{membership.nickname}</TableCell>
                    <TableCell>{membership.phone}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{membershipTypeMap[membership.type]}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{membership.startDate}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span>{membership.expireDate}</span>
                        {membership.status === 'active' && isExpiringSoon(membership.expireDate) && (
                          <AlertTriangle className="h-4 w-4 text-amber-500" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${statusMap[membership.status]?.className || 'bg-gray-100 text-gray-800'}`}>
                        {statusMap[membership.status]?.label || membership.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleMembership(membership)}
                        className={membership.status === 'active' ? 'text-red-600' : 'text-green-600'}
                      >
                        {membership.status === 'active' ? (
                          <>
                            <PowerOff className="h-4 w-4 mr-1" />
                            关闭
                          </>
                        ) : (
                          <>
                            <Power className="h-4 w-4 mr-1" />
                            开通
                          </>
                        )}
                      </Button>
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

      <ActivateMembershipDialog
        open={activateDialogOpen}
        onClose={() => setActivateDialogOpen(false)}
        onSuccess={fetchData}
        settings={settings}
      />
    </div>
  )
}
