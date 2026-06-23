'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  Plus,
  Search,
  AlertTriangle,
  PowerOff,
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
import { INITIAL_SITE_SETTINGS } from '@/lib/site-settings'
import { AdminTablePagination } from '@/components/admin/AdminTablePagination'
import { paginateArray } from '@/lib/admin-pagination'

const membershipTypeMap: Record<string, string> = {
  monthly: '月卡',
  quarterly: '季卡',
  yearly: '年卡',
}

const statusMap: Record<string, { label: string; className: string }> = {
  free: { label: '免费', className: 'bg-blue-100 text-blue-800' },
  active: { label: '有效', className: 'bg-green-100 text-green-800' },
  expired: { label: '已过期', className: 'bg-gray-100 text-gray-800' },
  cancelled: { label: '已取消', className: 'bg-gray-100 text-gray-800' },
}

interface Membership {
  id: string
  userId: string
  phone: string
  nickname: string
  planType?: string | null
  planLabel: string
  startDate: string
  expireDate: string
  status: string
}

interface Settings {
  membership?: {
    monthly?: { price: number; originalPrice?: number; enabled: boolean }
    quarterly?: { price: number; originalPrice?: number; enabled: boolean }
    yearly?: { price: number; originalPrice?: number; enabled: boolean }
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
  const [submitting, setSubmitting] = useState(false)

  const getMembershipLabel = (type: string) => {
    const prices = settings?.membership || {}
    const format = (plan?: { price?: number; originalPrice?: number }) => {
      if (!plan) return ''
      const sale = plan.price ?? 0
      const orig = plan.originalPrice ?? sale
      return orig > sale ? `¥${sale}（原价 ¥${orig}）` : `¥${sale}`
    }
    switch (type) {
      case 'monthly': return `月度 - ${format(prices.monthly) || '¥9.9'}`
      case 'quarterly': return `季度 - ${format(prices.quarterly) || '¥99'}`
      case 'yearly': return `年度 - ${format(prices.yearly) || '¥299'}`
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

    setSubmitting(true)
    try {
      const res = await fetch('/api/admin/memberships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: foundUser.id, type: membershipType }),
      })
      const data = await res.json()
      if (data.success) {
        const expireText = data.data?.expiresAt
          ? new Date(data.data.expiresAt).toLocaleString('zh-CN', { hour12: false })
          : ''
        const orderText = data.data?.orderNo ? `，订单号 ${data.data.orderNo}` : ''
        toast.success(
          `已为 ${foundUser.nickname || foundUser.phone} 开通${membershipTypeMap[membershipType]}${expireText ? `，到期 ${expireText}` : ''}${orderText}`,
        )
        setSearchPhone('')
        setFoundUser(null)
        setMembershipType('monthly')
        onClose()
        onSuccess()
      } else {
        toast.error(data.error || '开通失败')
      }
    } catch (error) {
      console.error('开通会员失败:', error)
      toast.error('开通失败，请重试')
    } finally {
      setSubmitting(false)
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
          <Button variant="outline" onClick={onClose} disabled={submitting}>取消</Button>
          <Button onClick={handleSubmit} disabled={!foundUser || submitting}>
            {submitting ? '开通中...' : '确认开通'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function MembershipsPage() {
  const [memberships, setMemberships] = useState<Membership[]>([])
  const [settings, setSettings] = useState<Settings>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [activateDialogOpen, setActivateDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  // Mock数据
  const mockMemberships: Membership[] = [
    { id: '1', userId: '1', phone: '13800138001', nickname: '张三', planLabel: '年卡', startDate: '2024-01-15', expireDate: '2025-01-15', status: 'active' },
    { id: '2', userId: '2', phone: '13800138002', nickname: '李四', planLabel: '月卡', startDate: '2024-02-01', expireDate: '2024-05-01', status: 'active' },
    { id: '3', userId: '3', phone: '13800138003', nickname: '王五', planLabel: '—', startDate: '2024-03-01', expireDate: '2024-04-01', status: 'expired' },
  ]
  const mockSettings: Settings = {
    membership: INITIAL_SITE_SETTINGS.membership,
  }

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
      } else {
        setMemberships(mockMemberships)
      }
      if (settingsData.success) {
        setSettings({ membership: settingsData.data.membership_pricing })
      } else {
        setSettings(mockSettings)
      }
    } catch {
      setMemberships(mockMemberships)
      setSettings(mockSettings)
    } finally {
      setLoading(false)
    }
  }

  const filteredMemberships = useMemo(() => {
    return memberships.filter((m) => {
      return (
        searchQuery === '' ||
        m.phone.includes(searchQuery) ||
        m.nickname.toLowerCase().includes(searchQuery.toLowerCase())
      )
    })
  }, [memberships, searchQuery])

  const { items: paginatedMemberships, total, totalPages } = useMemo(
    () => paginateArray(filteredMemberships, currentPage),
    [filteredMemberships, currentPage],
  )

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1)
  }

  const handleToggleMembership = async (membership: Membership) => {
    if (membership.status !== 'active') {
      toast.info('请使用「手动开通」为该用户开通会员')
      return
    }

    try {
      const res = await fetch('/api/admin/memberships', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: membership.id, status: 'cancelled' }),
      })
      const data = await res.json()
      if (data.success) {
        setMemberships((prev) =>
          prev.map((m) =>
            m.id === membership.id ? { ...m, status: 'cancelled' } : m
          )
        )
        toast.success(`用户 ${membership.nickname} 的会员已关闭`)
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
            <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="搜索手机号/昵称"
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
                      {membership.planLabel && membership.planLabel !== '—' ? (
                        <Badge variant="outline">{membership.planLabel}</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
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
                      {membership.status === 'active' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleMembership(membership)}
                          className="text-red-600"
                        >
                          <PowerOff className="h-4 w-4 mr-1" />
                          关闭
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

      <ActivateMembershipDialog
        open={activateDialogOpen}
        onClose={() => setActivateDialogOpen(false)}
        onSuccess={fetchData}
        settings={settings}
      />
    </div>
  )
}
