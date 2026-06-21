'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const router = useRouter()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [phoneError, setPhoneError] = useState('')
  const [passwordError, setPasswordError] = useState('')

  // 验证手机号
  const validatePhone = (value: string) => {
    if (!value) {
      setPhoneError('请输入手机号')
    } else if (!/^1[3-9]\d{9}$/.test(value)) {
      setPhoneError('请输入正确的手机号格式')
    } else {
      setPhoneError('')
    }
  }

  // 验证密码
  const validatePassword = (value: string) => {
    if (!value) {
      setPasswordError('请输入密码')
    } else {
      setPasswordError('')
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    // 验证所有字段
    validatePhone(phone)
    validatePassword(password)

    if (phoneError || passwordError) return
    if (!phone || !password) return

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

      // 登录成功
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))
      router.push('/dashboard')
    } catch {
      setPhoneError('网络错误，请重试')
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom, #f8fafc, #f1f5f9)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ background: 'white', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', padding: '32px', width: '100%', maxWidth: '420px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', textAlign: 'center', marginBottom: '8px' }}>登录</h1>
        <p style={{ color: '#64748b', textAlign: 'center', marginBottom: '24px' }}>输入手机号和密码登录</p>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '14px', fontWeight: '500' }}>手机号</label>
            <input
              type="tel"
              placeholder="请输入手机号"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onFocus={() => setPhoneError('')}
              onBlur={(e) => validatePhone(e.target.value)}
              style={{ height: '44px', padding: '0 12px', border: phoneError ? '1px solid #ef4444' : '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
            />
            {phoneError && <span style={{ color: 'red', fontSize: '14px' }}>{phoneError}</span>}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '14px', fontWeight: '500' }}>密码</label>
            <input
              type="password"
              placeholder="请输入密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setPasswordError('')}
              onBlur={(e) => validatePassword(e.target.value)}
              style={{ height: '44px', padding: '0 12px', border: passwordError ? '1px solid #ef4444' : '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', outline: 'none' }}
            />
            {passwordError && <span style={{ color: 'red', fontSize: '14px' }}>{passwordError}</span>}
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ height: '44px', background: loading ? '#94a3b8' : 'black', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '500', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '8px' }}
          >
            {loading ? '登录中...' : '登录'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '24px', color: '#64748b', fontSize: '14px' }}>
          还没有账号？<Link href="/register" style={{ color: '#3b82f6', fontWeight: '500' }}>立即注册</Link>
        </p>
      </div>
    </div>
  )
}
