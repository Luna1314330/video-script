'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function LoginPage() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  // 错误提示状态
  const [phoneError, setPhoneError] = useState('')
  const [passwordError, setPasswordError] = useState('')

  // 验证手机号格式
  const validatePhone = (value: string) => {
    if (!value) {
      setPhoneError('请输入手机号')
      return false
    }
    if (!/^1[3-9]\d{9}$/.test(value)) {
      setPhoneError('请输入正确的手机号格式')
      return false
    }
    setPhoneError('')
    return true
  }

  // 验证密码
  const validatePassword = (value: string) => {
    if (!value) {
      setPasswordError('请输入密码')
      return false
    }
    setPasswordError('')
    return true
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    // 验证所有字段
    const isPhoneValid = validatePhone(phone)
    const isPasswordValid = validatePassword(password)

    if (!isPhoneValid || !isPasswordValid) {
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setPhoneError(data.error || '登录失败')
        return
      }

      // 保存 token
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      
      // 跳转首页
      router.push('/')
    } catch {
      setPhoneError('网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">登录</CardTitle>
          <CardDescription className="text-center">
            输入手机号和密码登录
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            
            <div className="space-y-2">
              <label className="text-sm font-medium">手机号</label>
              <Input
                type="tel"
                placeholder="请输入手机号"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value)
                  if (phoneError) validatePhone(e.target.value)
                }}
                onBlur={() => validatePhone(phone)}
                maxLength={11}
              />
              {phoneError && (
                <p className="text-red-500 text-xs">{phoneError}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">密码</label>
              <Input
                type="password"
                placeholder="请输入密码"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (passwordError) validatePassword(e.target.value)
                }}
                onBlur={() => validatePassword(password)}
              />
              {passwordError && (
                <p className="text-red-500 text-xs">{passwordError}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '登录中...' : '登录'}
            </Button>

            <div className="text-center text-sm">
              还没有账号？{' '}
              <a href="/register" className="text-blue-600 hover:underline">
                立即注册
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
