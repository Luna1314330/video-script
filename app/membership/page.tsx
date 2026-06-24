"use client"

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { isLoggedIn } from '@/lib/auth-client'

type PublicSiteConfig = {
  membershipPurchaseEnabled: boolean
  freeDailyGenerations: number
}

export default function MembershipPage() {
  const router = useRouter()
  const [config, setConfig] = useState<PublicSiteConfig | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/site/public')
        const data = await res.json()
        if (data.success) {
          if (data.membershipPurchaseEnabled) {
            router.replace('/membership/purchase')
            return
          }
          setConfig({
            membershipPurchaseEnabled: false,
            freeDailyGenerations: Number(data.freeDailyGenerations) || 1,
          })
        }
      } catch {
        setConfig({ membershipPurchaseEnabled: false, freeDailyGenerations: 1 })
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">加载中...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900">脚本工坊</Link>
          <Link href="/" className="text-sm text-blue-600 hover:text-blue-800">
            返回首页
          </Link>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-3">免费体验中</h1>
        <p className="text-gray-600 mb-6 leading-relaxed">
          当前为推广期，暂不开放在线购买会员。
          <br />
          注册登录后，每日可免费生成脚本 {config?.freeDailyGenerations ?? 1} 次。
        </p>
        {isLoggedIn() ? (
          <Link
            href="/"
            className="inline-block bg-blue-500 text-white px-6 py-2.5 rounded-lg hover:bg-blue-600"
          >
            去生成脚本
          </Link>
        ) : (
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/register"
              className="bg-blue-500 text-white px-6 py-2.5 rounded-lg hover:bg-blue-600"
            >
              免费注册
            </Link>
            <Link
              href="/login?redirect=/"
              className="border border-gray-300 text-gray-700 px-6 py-2.5 rounded-lg hover:bg-gray-50"
            >
              登录
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
