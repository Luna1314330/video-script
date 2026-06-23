"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useAdminStore } from '@/lib/admin-store'

export default function LoginPage() {
  const router = useRouter()
  const { isAuthenticated, login, restoreSession } = useAdminStore()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    const checkSession = async () => {
      if (isAuthenticated) {
        router.replace('/admin')
        return
      }

      try {
        const res = await fetch('/api/admin/login')
        if (res.ok) {
          const data = await res.json()
          if (!cancelled && data.authenticated) {
            restoreSession(data.username || 'admin')
            router.replace('/admin')
            return
          }
        }
      } catch {
        // 忽略
      } finally {
        if (!cancelled) setChecking(false)
      }
    }

    void checkSession()
    return () => {
      cancelled = true
    }
  }, [isAuthenticated, restoreSession, router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!username.trim()) {
      setError('请输入用户名')
      return
    }
    if (!password) {
      setError('请输入密码')
      return
    }

    setLoading(true)

    try {
      const ok = await login(username.trim(), password)
      if (ok) {
        router.replace('/admin')
      } else {
        setError('用户名或密码错误')
      }
    } catch {
      setError('登录失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-black" />
      </div>
    )
  }

  return (
    <>
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-black mx-auto" />
            <p className="text-lg font-medium">验证中...</p>
          </div>
        </div>
      )}

      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <div className="w-full max-w-md px-4">
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">脚本工坊</CardTitle>
              <CardDescription>后台管理系统</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-center text-sm text-muted-foreground">
                管理员登录，请输入管理员账号密码登录系统
              </p>
              <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">用户名</label>
                  <Input
                    type="text"
                    placeholder="请输入用户名"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={loading}
                    autoComplete="username"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">密码</label>
                  <Input
                    type="password"
                    placeholder="请输入密码"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    autoComplete="current-password"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-500 text-center">{error}</p>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? '验证中...' : '登录'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
