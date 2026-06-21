'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
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

  // 验证密码格式（6-18位）
  const validatePassword = (value: string) => {
    if (!value) {
      setPasswordError('请输入密码')
      return false
    }
    if (value.length < 6 || value.length > 18) {
      setPasswordError('密码长度需为6-18位')
      return false
    }
    setPasswordError('')
    return true
  }

  // 验证确认密码
  const validateConfirmPassword = (value: string) => {
    if (!value) {
      setConfirmPasswordError('请再次输入密码')
      return false
    }
    if (value !== password) {
      setConfirmPasswordError('两次密码输入不一致')
      return false
    }
    setConfirmPasswordError('')
    return true
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    // 验证所有字段
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
        setPhoneError(data.error || '注册失败')
        return
      }

      // 注册成功，跳转登录
      alert('注册成功，请登录')
      router.push('/login')
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
          <CardTitle className="text-2xl font-bold text-center">注册</CardTitle>
          <CardDescription className="text-center">
            输入手机号和密码注册账号
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            
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
                onBlur={(e) => validatePhone(e.target.value)}
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
                placeholder="请输入密码（6-18位）"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (passwordError) validatePassword(e.target.value)
                }}
                onBlur={(e) => validatePassword(e.target.value)}
              />
              {passwordError && (
                <p className="text-red-500 text-xs">{passwordError}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">确认密码</label>
              <Input
                type="password"
                placeholder="请再次输入密码"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  if (confirmPasswordError) validateConfirmPassword(e.target.value)
                }}
                onBlur={(e) => validateConfirmPassword(e.target.value)}
              />
              {confirmPasswordError && (
                <p className="text-red-500 text-xs">{confirmPasswordError}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? '注册中...' : '注册'}
            </Button>

            <div className="text-center text-sm">
              已有账号？{' '}
              <a href="/login" className="text-blue-600 hover:underline">
                立即登录
              </a>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
