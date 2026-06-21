'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface MembershipPlan {
  id: string
  name: string
  price: number
  originalPrice: number
  features: string[]
  recommended?: boolean
  enabled: boolean
}

export default function MembershipPage() {
  const router = useRouter()
  const [plans, setPlans] = useState<MembershipPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [purchasing, setPurchasing] = useState<string | null>(null)

  useEffect(() => {
    // 检查登录状态
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }
    fetchSettings()
  }, [router])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/settings')
      const data = await res.json()
      
      if (data.success && data.data) {
        const pricing = data.data.membership_pricing || {
          monthly: { price: 39, enabled: true },
          quarterly: { price: 99, enabled: true },
          yearly: { price: 299, enabled: true }
        }

        const enabledPlans: MembershipPlan[] = []

        if (pricing.monthly?.enabled) {
          enabledPlans.push({
            id: 'monthly',
            name: '月度会员',
            price: pricing.monthly.price,
            originalPrice: 39,
            features: ['每日生成 10 次', '优先使用 AI', '专属客服支持']
          })
        }

        if (pricing.quarterly?.enabled) {
          enabledPlans.push({
            id: 'quarterly',
            name: '季度会员',
            price: pricing.quarterly.price,
            originalPrice: 99,
            features: ['每日生成 20 次', '优先使用 AI', '专属客服支持', '赠送 50 次'],
            recommended: true
          })
        }

        if (pricing.yearly?.enabled) {
          enabledPlans.push({
            id: 'yearly',
            name: '年度会员',
            price: pricing.yearly.price,
            originalPrice: 299,
            features: ['每日生成 50 次', '优先使用 AI', '专属客服支持', '赠送 200 次', '专属活动参与权']
          })
        }

        setPlans(enabledPlans)
      }
    } catch {
      // 使用默认套餐
      setPlans([
        { id: 'monthly', name: '月度会员', price: 39, originalPrice: 39, features: ['每日生成 10 次', '优先使用 AI', '专属客服支持'] },
        { id: 'quarterly', name: '季度会员', price: 99, originalPrice: 99, features: ['每日生成 20 次', '优先使用 AI', '专属客服支持', '赠送 50 次'], recommended: true },
        { id: 'yearly', name: '年度会员', price: 299, originalPrice: 299, features: ['每日生成 50 次', '优先使用 AI', '专属客服支持', '赠送 200 次', '专属活动参与权'] }
      ])
    }
    setLoading(false)
  }

  const handlePurchase = async (planId: string, price: number) => {
    const token = localStorage.getItem('token')
    if (!token) {
      router.push('/login')
      return
    }

    setPurchasing(planId)

    try {
      // 调用订单 API 购买会员
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

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p>加载中...</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '40px 16px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', marginBottom: '12px' }}>选择适合您的会员套餐</h1>
          <p style={{ color: '#64748b', fontSize: '16px' }}>解锁更多生成次数，畅享专属权益</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
          {plans.map((plan) => (
            <div
              key={plan.id}
              style={{
                background: plan.recommended ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' : 'white',
                borderRadius: '16px',
                padding: '32px',
                position: 'relative',
                boxShadow: plan.recommended ? '0 20px 25px -5px rgb(0 0 0 / 0.1)' : '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                border: plan.recommended ? 'none' : '1px solid #e2e8f0'
              }}
            >
              {plan.recommended && (
                <div style={{
                  position: 'absolute',
                  top: '-12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: '#f59e0b',
                  color: 'white',
                  padding: '4px 16px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '600'
                }}>
                  推荐
                </div>
              )}

              <h3 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: plan.recommended ? 'white' : '#1e293b',
                marginBottom: '16px'
              }}>
                {plan.name}
              </h3>

              <div style={{ marginBottom: '24px' }}>
                <span style={{
                  fontSize: '40px',
                  fontWeight: 'bold',
                  color: plan.recommended ? 'white' : '#1e293b'
                }}>
                  ¥{plan.price}
                </span>
              </div>

              <ul style={{ listStyle: 'none', padding: 0, marginBottom: '32px' }}>
                {plan.features.map((feature, index) => (
                  <li
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '12px',
                      color: plan.recommended ? '#e2e8f0' : '#64748b',
                      fontSize: '14px'
                    }}
                  >
                    <span style={{ color: plan.recommended ? '#4ade80' : '#22c55e' }}>✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handlePurchase(plan.id, plan.price)}
                disabled={purchasing === plan.id}
                style={{
                  width: '100%',
                  height: '48px',
                  background: plan.recommended ? 'white' : '#1e293b',
                  color: plan.recommended ? '#1e293b' : 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: purchasing === plan.id ? 'not-allowed' : 'pointer',
                  opacity: purchasing === plan.id ? 0.7 : 1
                }}
              >
                {purchasing === plan.id ? '开通中...' : `立即开通 ¥${plan.price}`}
              </button>
            </div>
          ))}
        </div>

        <p style={{ textAlign: 'center', marginTop: '32px', color: '#94a3b8', fontSize: '14px' }}>
          登录后即可购买会员 • 如有问题请联系客服
        </p>
      </div>
    </div>
  )
}
