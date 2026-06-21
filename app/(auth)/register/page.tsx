'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function RegisterPage() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{
    phone?: string
    password?: string
    confirmPassword?: string
  }>({})

  const validatePhone = (value: string): boolean => {
    if (!value) {
      setErrors(prev => ({ ...prev, phone: '请输入手机号' }))
      return false
    }
    if (!/^1[3-9]\d{9}$/.test(value)) {
      setErrors(prev => ({ ...prev, phone: '请输入正确的手机号格式' }))
      return false
    }
    setErrors(prev => ({ ...prev, phone: undefined }))
    return true
  }

  const validatePassword = (value: string): boolean => {
    if (!value) {
      setErrors(prev => ({ ...prev, password: '请输入密码' }))
      return false
    }
    if (value.length < 6 || value.length > 18) {
      setErrors(prev => ({ ...prev, password: '密码长度需为6-18位' }))
      return false
    }
    setErrors(prev => ({ ...prev, password: undefined }))
    return true
  }

  const validateConfirmPassword = (value: string): boolean => {
    if (!value) {
      setErrors(prev => ({ ...prev, confirmPassword: '请再次输入密码' }))
      return false
    }
    if (value !== password) {
      setErrors(prev => ({ ...prev, confirmPassword: '两次密码输入不一致' }))
      return false
    }
    setErrors(prev => ({ ...prev, confirmPassword: undefined }))
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const isPhoneValid = validatePhone(phone)
    const isPasswordValid = validatePassword(password)
    const isConfirmValid = validateConfirmPassword(confirmPassword)

    if (!isPhoneValid || !isPasswordValid || !isConfirmValid) {
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setErrors({ phone: data.error || '注册失败' })
        setLoading(false)
        return
      }

      router.push('/login?registered=true')
    } catch {
      setErrors({ phone: '网络错误，请重试' })
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">注册</CardTitle>
          <CardDescription className="text-center">输入手机号和密码注册账号</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium">手机号</label>
              <input
                id="phone"
                type="tel"
                placeholder="请输入手机号"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                onFocus={() => setErrors(prev => ({ ...prev, phone: undefined }))}
                onBlur={(e) => validatePhone(e.target.value)}
                className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <p style={{ color: 'red', fontSize: '14px', margin: 0 }}>{errors.phone || ''}</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">密码</label>
              <input
                id="password"
                type="password"
                placeholder="请输入密码（6-18位）"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setErrors(prev => ({ ...prev, password: undefined }))}
                onBlur={(e) => validatePassword(e.target.value)}
                className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <p style={{ color: 'red', fontSize: '14px', margin: 0 }}>{errors.password || ''}</p>
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium">确认密码</label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="请再次输入密码"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onFocus={() => setErrors(prev => ({ ...prev, confirmPassword: undefined }))}
                onBlur={(e) => validateConfirmPassword(e.target.value)}
                className="flex h-11 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
              <p style={{ color: 'red', fontSize: '14px', margin: 0 }}>{errors.confirmPassword || ''}</p>
            </div>

            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? '注册中...' : '注册'}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm">
            已有账号？<Link href="/login" className="text-blue-600 hover:underline">立即登录</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
