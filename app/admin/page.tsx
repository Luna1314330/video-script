'use client'

import { useState, useEffect } from 'react'
import { Users, CreditCard, DollarSign, FileText } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

interface Stats {
  totalUsers: number
  totalMemberships: number
  totalRevenue: number
  totalScripts: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0,
    totalMemberships: 0,
    totalRevenue: 0,
    totalScripts: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const [usersRes, membershipsRes, ordersRes, scriptsRes] = await Promise.all([
        fetch('/api/admin/users'),
        fetch('/api/admin/memberships'),
        fetch('/api/admin/orders'),
        fetch('/api/admin/scripts'),
      ])

      const [usersData, membershipsData, ordersData, scriptsData] = await Promise.all([
        usersRes.json(),
        membershipsRes.json(),
        ordersRes.json(),
        scriptsRes.json(),
      ])

      // 计算总收入（已支付订单）
      const totalRevenue = (ordersData.data || [])
        .filter((o: any) => o.status === 'paid')
        .reduce((sum: number, o: any) => sum + (o.amount || 0), 0)

      setStats({
        totalUsers: usersData.data?.length || 0,
        totalMemberships: membershipsData.data?.length || 0,
        totalRevenue,
        totalScripts: scriptsData.data?.length || 0,
      })
    } catch (error) {
      console.error('获取统计数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">工作台</h1>
        <p className="text-sm text-muted-foreground">平台数据概览</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              总用户数
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-16 animate-pulse rounded bg-muted" />
            ) : (
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              会员总数
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-16 animate-pulse rounded bg-muted" />
            ) : (
              <div className="text-2xl font-bold">{stats.totalMemberships}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              总收入
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-20 animate-pulse rounded bg-muted" />
            ) : (
              <div className="text-2xl font-bold">
                ¥{stats.totalRevenue.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              生成脚本数
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="h-8 w-16 animate-pulse rounded bg-muted" />
            ) : (
              <div className="text-2xl font-bold">{stats.totalScripts}</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
