"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface MembershipPlan {
  id: string
  name: string
  price: number
  originalPrice: number
  features: string[]
  recommended?: boolean
}

// 默认套餐数据
const defaultPlans: MembershipPlan[] = [
  { id: 'monthly', name: '月度会员', price: 29, originalPrice: 39, features: ['每日生成 10 次', '优先使用 AI', '专属客服支持'] }
]

export default function MembershipPage() {
  const router = useRouter()
  const [plans] = useState<MembershipPlan[]>(defaultPlans)
  const [purchasing, setPurchasing] = useState<string | null>(null)

  const handlePurchase = async (planId: string, price: number) => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    setPurchasing(planId)

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          plan_id: planId,
          amount: price,
          payment_method: 'mock'
        })
      })

      const data = await res.json()

      if (data.success) {
        alert('会员开通成功！')
        router.push('/dashboard')
      } else {
        alert(data.error || '开通失败，请重试')
      }
    } catch {
      alert('网络错误，请重试')
    } finally {
      setPurchasing(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">脚本工坊</h1>
          <Link href="/login" className="text-sm text-blue-600 hover:text-blue-800">
            登录
          </Link>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">开通会员</h2>
          <p className="text-gray-600">选择适合您的会员套餐，解锁更多功能</p>
        </div>

        {plans.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">暂无可用的会员套餐</p>
          </div>
        ) : (
          <div className="flex justify-center">
          <div className="w-full max-w-sm">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`bg-white rounded-xl shadow-sm border-2 ${
                  plan.recommended ? 'border-blue-500 relative' : 'border-gray-100'
                }`}
              >
                {plan.recommended && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                      推荐
                    </span>
                  </div>
                )}
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="mb-4">
                    <span className="text-3xl font-bold text-gray-900">¥{plan.price}</span>
                    {plan.originalPrice > plan.price && (
                      <span className="text-gray-400 line-through ml-2">¥{plan.originalPrice}</span>
                    )}
                  </div>
                  <ul className="space-y-2 mb-6">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-center">
                        <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handlePurchase(plan.id, plan.price)}
                    disabled={purchasing !== null}
                    className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                      plan.recommended
                        ? 'bg-blue-500 text-white hover:bg-blue-600'
                        : 'bg-gray-900 text-white hover:bg-gray-800'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {purchasing === plan.id ? '处理中...' : '立即开通'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
        )}

        {/* Footer */}
        <div className="text-center mt-10">
          <p className="text-sm text-gray-500">
            遇到问题？联系客服 <span className="text-blue-600">support@example.com</span>
          </p>
        </div>
      </div>
    </div>
  )
}
