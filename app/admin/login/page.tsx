"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

export default function LoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // 检查是否已登录
  useEffect(() => {
    const isLoggedIn = localStorage.getItem('admin_logged_in')
    if (isLoggedIn === 'true') {
      window.location.href = '/admin'
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!username || !password) {
      setError('请输入用户名和密码')
      return
    }

    setLoading(true)
    
    // 模拟验证延迟
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Mock 验证
    if (username === 'admin' && password === 'admin1991') {
      localStorage.setItem('admin_logged_in', 'true')
      localStorage.setItem('admin_user', username)
      window.location.href = '/admin'
    } else {
      setError('用户名或密码错误')
      setLoading(false)
    }
  }

  return (
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
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">用户名</Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="请输入用户名"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="请输入密码"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>
              
              {error && (
                <p className="text-sm text-red-500">{error}</p>
              )}
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? '验证中...' : '登录'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Loading 遮罩 */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="rounded-xl bg-white p-8 shadow-lg">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-black border-t-transparent" />
            <p className="mt-4 text-center font-medium text-black">验证中...</p>
          </div>
        </div>
      )}
    </div>
  )
}
