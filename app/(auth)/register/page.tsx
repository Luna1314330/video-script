'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function RegisterPage() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)

  // 错误提示状态
  const [phoneError, setPhoneError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [confirmPasswordError, setConfirmPasswordError] = useState('')

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
    } else if (password.length < 6 || password.length > 18) {
      setPasswordError('密码长度需为6-18位')
    } else {
      setPasswordError('')
    }
  }

  // 验证确认密码
  const handleConfirmBlur = () => {
    if (!confirmPassword) {
      setConfirmPasswordError('请再次输入密码')
    } else if (confirmPassword !== password) {
      setConfirmPasswordError('两次密码输入不一致')
    } else {
      setConfirmPasswordError('')
    }
  }

  // 提交时验证所有字段
  const handleRegister = async (e: React.FormEvent) => {
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
    } else if (password.length < 6 || password.length > 18) {
      setPasswordError('密码长度需为6-18位')
      hasError = true
    }

    if (!confirmPassword) {
      setConfirmPasswordError('请再次输入密码')
      hasError = true
    } else if (confirmPassword !== password) {
      setConfirmPasswordError('两次密码输入不一致')
      hasError = true
    }

    if (hasError) return

    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setPhoneError(data.error || '注册失败')
        setLoading(false)
        return
      }

      // 注册成功，跳转到登录页
      router.push('/login?registered=true')
    } catch {
      setPhoneError('网络错误，请重试')
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
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="phone" className="text-sm font-medium">手机号</label>
              <Input
                id="phone"
                type="tel"
                placeholder="请输入手机号"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value)
                  setPhoneError('') // 输入时清除错误
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
                placeholder="请输入密码（6-18位）"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setPasswordError('') // 输入时清除错误
                }}
                onBlur={handlePasswordBlur}
                className="h-11"
              />
              {passwordError && (
                <p className="text-red-500 text-sm">{passwordError}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium">确认密码</label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="请再次输入密码"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  setConfirmPasswordError('') // 输入时清除错误
                }}
                onBlur={handleConfirmBlur}
                className="h-11"
              />
              {confirmPasswordError && (
                <p className="text-red-500 text-sm">{confirmPasswordError}</p>
              )}
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
