"use client"

import { useEffect, useState } from 'react'
import { getAccessToken, getAuthHeaders, isLoggedIn } from '@/lib/auth-client'
import {
  fetchCurrentUser,
  getMembershipActionLabel,
  getMembershipPurchaseLabel,
  isActiveMembership,
} from '@/lib/profile/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { WeChatPayDialog } from '@/components/payment/WeChatPayDialog'

interface MembershipPlan {
  id: string
  name: string
  price: number
  originalPrice: number
  features: string[]
  recommended?: boolean
}

type PendingPayment = {
  orderId: string
  amount: number
}

function formatPrice(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, '')
}

export default function MembershipPurchasePage() {
  const router = useRouter()
  const [authReady, setAuthReady] = useState(false)
  const [plans, setPlans] = useState<MembershipPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const [isActiveMember, setIsActiveMember] = useState(false)
  const [pendingPayment, setPendingPayment] = useState<PendingPayment | null>(null)

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const res = await fetch('/api/site/public')
        const data = await res.json()
        if (data.success && !data.membershipPurchaseEnabled) {
          router.replace('/membership')
          return
        }
      } catch {
        router.replace('/membership')
        return
      }

      if (!isLoggedIn()) {
        router.replace('/login?redirect=/membership/purchase')
        return
      }
      setAuthReady(true)
    }

    void checkAccess()
  }, [router])

  useEffect(() => {
    if (!authReady) return

    const loadUser = async () => {
      try {
        const user = await fetchCurrentUser()
        setIsActiveMember(isActiveMembership(user.membership))
      } catch {
        setIsActiveMember(false)
      }
    }

    void loadUser()
  }, [authReady])

  useEffect(() => {
    if (!authReady) return

    const loadPlans = async () => {
      try {
        const res = await fetch('/api/memberships/plans')
        const data = await res.json()
        if (data.success && Array.isArray(data.data)) {
          setPlans(data.data)
        }
      } catch {
        setPlans([])
      } finally {
        setLoading(false)
      }
    }
    void loadPlans()
  }, [authReady])

  const handlePurchase = async (planId: string) => {
    if (!getAccessToken()) {
      router.replace('/login?redirect=/membership/purchase')
      return
    }

    setPurchasing(planId)

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          plan_id: planId,
          payment_method: 'wechat',
        }),
      })

      const data = await res.json()

      if (data.success && data.order?.id) {
        setPendingPayment({
          orderId: data.order.id,
          amount: Number(data.order.amount),
        })
      } else {
        alert(data.error || '创建订单失败，请重试')
      }
    } catch {
      alert('网络错误，请重试')
    } finally {
      setPurchasing(null)
    }
  }

  const handlePaymentSuccess = () => {
    setPendingPayment(null)
    alert(isActiveMember ? '会员续费成功！' : '会员开通成功！')
    router.push('/profile')
  }

  if (!authReady) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">加载中...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <WeChatPayDialog
        open={Boolean(pendingPayment)}
        orderId={pendingPayment?.orderId ?? ''}
        amount={pendingPayment?.amount ?? 0}
        onClose={() => setPendingPayment(null)}
        onSuccess={handlePaymentSuccess}
      />

      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-gray-900">脚本工坊</Link>
          <Link href="/profile" className="text-sm text-blue-600 hover:text-blue-800">
            个人中心
          </Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">
            {getMembershipActionLabel(isActiveMember)}
          </h2>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">加载中...</div>
        ) : plans.length === 0 ? (
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
                      <span className="text-3xl font-bold text-gray-900">¥{formatPrice(plan.price)}</span>
                      {plan.originalPrice > plan.price && (
                        <span className="text-gray-400 line-through ml-2">
                          ¥{formatPrice(plan.originalPrice)}
                        </span>
                      )}
                    </div>
                    <ul className="space-y-2 mb-6">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-center">
                          <svg className="w-4 h-4 text-green-500 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <button
                      onClick={() => void handlePurchase(plan.id)}
                      disabled={purchasing !== null}
                      className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
                        plan.recommended
                          ? 'bg-blue-500 text-white hover:bg-blue-600'
                          : 'bg-gray-900 text-white hover:bg-gray-800'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {purchasing === plan.id ? '处理中...' : getMembershipPurchaseLabel(isActiveMember)}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-center mt-10">
          <p className="text-sm text-gray-500">
            遇到问题？联系客服 <span className="text-blue-600">support@example.com</span>
          </p>
        </div>
      </div>
    </div>
  )
}
