'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function LoginPage() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [phoneError, setPhoneError] = useState('')
  const [passwordError, setPasswordError] = useState('')

  // 验证手机号
  const handlePhoneBlur = () => {
    if (!phone) {
      setPhoneError('请输入手机号')
    } else if (!/^1[3-9]\d{9}$/.test(phone)) {
      setPhoneError('请输入正确的手机号格式')
    } else {
      setPhoneError('')
    }
  }

  // 验证密码
  const handlePasswordBlur = () => {
    if (!password) {
      setPasswordError('请输入密码')
    } else {
      setPasswordError('')
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    // 验证所有字段
    let hasError = false

    if (!phone) {
      setPhoneError('请输入手机号')
      hasError = true
    } else if (!/^1[3-9]\d{9}$/.test(phone)) {
      setPhoneError('请输入正确的手机号格式')
      hasError = true
    }

    if (!password) {
      setPasswordError('请输入密码')
      hasError = true
    }

    if (hasError) return

    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.error?.includes('密码')) {
          setPasswordError(data.error)
        } else {
          setPhoneError(data.error || '登录失败')
        }
        setLoading(false)
        return
      }

      // 登录成功，保存 token 并跳转
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      router.push('/dashboard')
    } catch {
      setPhoneError('网络错误，请重试')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">登录</CardTitle>
          <CardDescription className="text-center">输入手机号和密码登录</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium">手机号</label>
              <Input
                id="phone"
                type="tel"
                placeholder="请输入手机号"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value)
                  setPhoneError('')
                }}
                onBlur={handlePhoneBlur}
                className="h-11"
              />
              {phoneError && (
                <p className="text-red-500 text-sm">{phoneError}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">密码</label>
              <Input
                id="password"
                type="password"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setPasswordError('')
                }}
                onBlur={handlePasswordBlur}
                className="h-11"
              />
              {passwordError && (
                <p className="text-red-500 text-sm">{passwordError}</p>
              )}
            </div>

            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? '登录中...' : '登录'}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm">
            还没有账号？<Link href="/register" className="text-blue-600 hover:underline">立即注册</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
