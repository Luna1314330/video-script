'use client'

import React, { useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  CreditCard,
  ShoppingCart,
  Settings,
  LogOut,
  ChevronRight,
  FileText,
} from 'lucide-react'
import { useAdminStore } from '@/lib/admin-store'
import { Button } from '@/components/ui/button'

const navItems = [
  { href: '/admin', label: '工作台', icon: LayoutDashboard },
  { href: '/admin/users', label: '用户管理', icon: Users },
  { href: '/admin/memberships', label: '会员管理', icon: CreditCard },
  { href: '/admin/orders', label: '订单管理', icon: ShoppingCart },
  { href: '/admin/scripts', label: '脚本历史', icon: FileText },
  { href: '/admin/settings', label: '系统设置', icon: Settings },
]

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { isAuthenticated, logout, admin } = useAdminStore()

  // Skip auth check for login page
  const isLoginPage = pathname === '/admin/login'

  // 暂时禁用认证检查，方便调试
  // useEffect(() => {
  //   if (!isLoginPage && !isAuthenticated) {
  //     router.push('/admin/login')
  //   }
  // }, [isLoginPage, isAuthenticated, router])

  const handleLogout = () => {
    logout()
    window.location.href = '/admin/login'
  }

  // Login page - no layout needed
  if (isLoginPage) {
    return <>{children}</>
  }

  // 暂时禁用认证检查，直接显示内容
  // if (!isAuthenticated) {
  //   return (
  //     <div className="flex h-screen items-center justify-center">
  //       <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  //     </div>
  //   )
  // }

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin'
    }
    return pathname.startsWith(href)
  }

  return (
    <div className="flex h-screen bg-muted/30">
      {/* Sidebar */}
      <aside className="flex w-64 flex-col border-r bg-card">
        {/* Logo */}
        <div className="flex h-16 items-center border-b px-4">
          <Link href="/admin" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <span className="text-sm font-bold">S</span>
            </div>
            <span className="font-heading text-lg font-semibold">后台管理</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
                {active && <ChevronRight className="ml-auto h-4 w-4" />}
              </Link>
            )
          })}
        </nav>

        {/* User info */}
        <div className="border-t p-3">
          <div className="mb-2 rounded-lg bg-muted/50 px-3 py-2">
            <p className="text-sm font-medium">{admin?.username}</p>
            <p className="text-xs text-muted-foreground">管理员</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4" />
            退出登录
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}

export function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminLayoutContent>{children}</AdminLayoutContent>
}
