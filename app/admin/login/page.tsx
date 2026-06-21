"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const isLoggedIn = localStorage.getItem('admin_logged_in')
    if (isLoggedIn === 'true') {
      window.location.href = '/admin'
    }
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!username.trim() || !password.trim()) {
      setError('请输入用户名和密码')
      return
    }

    setLoading(true)

    setTimeout(() => {
      if (username === 'admin' && password === 'admin1991') {
        localStorage.setItem('admin_logged_in', 'true')
        localStorage.setItem('admin_user', username)
        window.location.href = '/admin'
      } else {
        setError('用户名或密码错误')
        setLoading(false)
      }
    }, 1000)
  }

  return (
    <>
      {/* 遮罩层 */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-black mx-auto"></div>
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
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">用户名</label>
                  <Input
                    type="text"
                    placeholder="请输入用户名"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={loading}
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
      </div>
    </>
  )
}
