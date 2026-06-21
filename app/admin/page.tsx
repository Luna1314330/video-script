'use client'

import {
  Users,
  ShoppingCart,
  TrendingUp,
  UserCheck,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { mockDashboardStats } from '@/lib/admin-data'

// Simple bar chart component
function BarChart({
  data,
  maxValue,
}: {
  data: { label: string; value: number }[]
  maxValue: number
}) {
  return (
    <div className="flex h-40 items-end gap-2">
      {data.map((item, i) => {
        const height = maxValue > 0 ? (item.value / maxValue) * 100 : 0
        return (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <div className="w-full rounded-t bg-primary/80 transition-all hover:bg-primary">
              <div
                className="rounded-t bg-primary"
                style={{ height: `${Math.max(height, 4)}%` }}
              />
            </div>
            <span className="text-xs text-muted-foreground">{item.label}</span>
          </div>
        )
      })}
    </div>
  )
}

// Simple line chart component
function LineChart({
  data,
  maxValue,
}: {
  data: { label: string; value: number }[]
  maxValue: number
}) {
  const points = data.map((item, i) => {
    const x = (i / (data.length - 1)) * 100
    const y = 100 - (maxValue > 0 ? (item.value / maxValue) * 100 : 0)
    return `${x},${Math.max(y, 5)}`
  })

  return (
    <div className="relative h-40">
      <svg
        viewBox="0 0 100 100"
        className="h-full w-full"
        preserveAspectRatio="none"
      >
        {/* Grid lines */}
        <line
          x1="0"
          y1="25"
          x2="100"
          y2="25"
          stroke="currentColor"
          className="text-muted/30"
          strokeWidth="0.5"
        />
        <line
          x1="0"
          y1="50"
          x2="100"
          y2="50"
          stroke="currentColor"
          className="text-muted/30"
          strokeWidth="0.5"
        />
        <line
          x1="0"
          y1="75"
          x2="100"
          y2="75"
          stroke="currentColor"
          className="text-muted/30"
          strokeWidth="0.5"
        />
        {/* Area fill */}
        <polygon
          fill="currentColor"
          className="text-primary/20"
          points={`0,100 ${points.join(' ')} 100,100`}
        />
        {/* Line */}
        <polyline
          fill="none"
          stroke="currentColor"
          className="text-primary"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points.join(' ')}
        />
        {/* Points */}
        {data.map((item, i) => {
          const x = (i / (data.length - 1)) * 100
          const y = 100 - (maxValue > 0 ? (item.value / maxValue) * 100 : 0)
          return (
            <circle
              key={i}
              cx={x}
              cy={Math.max(y, 5)}
              r="2"
              fill="currentColor"
              className="text-primary"
            />
          )
        })}
      </svg>
      <div className="absolute inset-x-0 bottom-0 flex justify-between">
        {data.map((item, i) => (
          <span key={i} className="text-xs text-muted-foreground">
            {item.label}
          </span>
        ))}
      </div>
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string | number
  description: string
  icon: React.ElementType
  trend?: { value: number; positive: boolean }
}

function StatCard({ title, value, description, icon: Icon, trend }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-2">
              <p className="font-heading text-3xl font-bold">{value}</p>
              {trend && (
                <span
                  className={`flex items-center text-xs font-medium ${
                    trend.positive ? 'text-green-600' : 'text-red-600'
                  }`}
                >
                  <TrendingUp
                    className={`mr-0.5 h-3 w-3 ${!trend.positive && 'rotate-180'}`}
                  />
                  {trend.value}%
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          <div className="rounded-lg bg-primary/10 p-3">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const stats = mockDashboardStats

  const userChartData = stats.userGrowth.map((item) => ({
    label: item.date.slice(-2),
    value: item.count,
  }))

  const revenueChartData = stats.revenueGrowth.map((item) => ({
    label: item.date.slice(-2),
    value: item.amount,
  }))

  const maxUserCount = Math.max(...stats.userGrowth.map((item) => item.count))
  const maxRevenue = Math.max(...stats.revenueGrowth.map((item) => item.amount))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">工作台</h1>
        <p className="text-sm text-muted-foreground">欢迎回来，查看系统数据概览</p>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="今日新增用户"
          value={stats.todayNewUsers}
          description="较昨日 +12%"
          icon={Users}
          trend={{ value: 12, positive: true }}
        />
        <StatCard
          title="今日订单数"
          value={stats.todayOrders}
          description="较昨日 -5%"
          icon={ShoppingCart}
          trend={{ value: 5, positive: false }}
        />
        <StatCard
          title="今日收入"
          value={`¥${stats.todayRevenue}`}
          description="较昨日 +8%"
          icon={TrendingUp}
          trend={{ value: 8, positive: true }}
        />
        <StatCard
          title="总会员数"
          value={stats.totalMembers}
          description={`占总用户 ${((stats.totalMembers / stats.totalUsers) * 100).toFixed(1)}%`}
          icon={UserCheck}
        />
      </div>

      {/* Quick stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-4xl font-bold text-primary">{stats.totalUsers}</p>
              <p className="mt-1 text-sm text-muted-foreground">总用户数</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-4xl font-bold text-green-600">
                {stats.totalMembers}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">总会员数</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-4xl font-bold text-blue-600">
                ¥{stats.totalRevenue}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">总收入</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
