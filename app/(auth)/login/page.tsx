"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function LoginPage() {
  const router = useRouter()
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [phoneError, setPhoneError] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [loading, setLoading] = useState(false)

  const validatePhone = (value: string) => {
    if (!value) {
      setPhoneError("请输入手机号")
      return false
    }
    if (!/^1[3-9]\d{9}$/.test(value)) {
      setPhoneError("请输入正确的手机号格式")
      return false
    }
    setPhoneError("")
    return true
  }

  const validatePassword = (value: string) => {
    if (!value) {
      setPasswordError("请输入密码")
      return false
    }
    if (value.length < 6 || value.length > 18) {
      setPasswordError("密码长度需为6-18位")
      return false
    }
    setPasswordError("")
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 验证所有字段
    const phoneValid = validatePhone(phone)
    const passwordValid = validatePassword(password)
    
    if (!phoneValid || !passwordValid) {
      return
    }
    
    setLoading(true)
    
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      })
      
      const data = await res.json()
      
      if (res.ok) {
        localStorage.setItem("user", JSON.stringify(data.user))
        router.push("/")
      } else {
        alert(data.error || "登录失败")
      }
    } catch (error) {
      alert("登录失败，请重试")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold text-center mb-2">登录</h1>
        <p className="text-gray-500 text-center mb-6">输入手机号和密码登录</p>
        
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* 手机号 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">手机号</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onBlur={(e) => validatePhone(e.target.value)}
              placeholder="请输入手机号"
              className="w-full h-11 px-4 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            {phoneError && (
              <p className="mt-1 text-sm text-red-500">{phoneError}</p>
            )}
          </div>
          
          {/* 密码 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">密码</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={(e) => validatePassword(e.target.value)}
              placeholder="请输入密码"
              className="w-full h-11 px-4 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            {passwordError && (
              <p className="mt-1 text-sm text-red-500">{passwordError}</p>
            )}
          </div>
          
          {/* 登录按钮 */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "登录中..." : "登录"}
          </button>
        </form>
        
        <p className="mt-6 text-center text-sm text-gray-500">
          还没有账号？{" "}
          <Link href="/register" className="text-blue-500 hover:underline">
            立即注册
          </Link>
        </p>
      </div>
    </div>
  )
}
