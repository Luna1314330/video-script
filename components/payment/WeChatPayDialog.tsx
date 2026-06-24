"use client"

import { useCallback, useEffect, useRef, useState } from 'react'
import { getAuthHeaders } from '@/lib/auth-client'

type WeChatPayDialogProps = {
  open: boolean
  orderId: string
  amount: number
  onClose: () => void
  onSuccess: () => void
}

export function WeChatPayDialog({
  open,
  orderId,
  amount,
  onClose,
  onSuccess,
}: WeChatPayDialogProps) {
  const [codeUrl, setCodeUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mockMode, setMockMode] = useState(false)
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }, [])

  const checkOrderStatus = useCallback(async () => {
    const res = await fetch(`/api/orders/${orderId}`, {
      headers: getAuthHeaders(),
    })
    const data = await res.json()
    if (data.success && data.order?.status === 'paid') {
      stopPolling()
      onSuccess()
    }
  }, [orderId, onSuccess, stopPolling])

  const startPolling = useCallback(() => {
    stopPolling()
    pollingRef.current = setInterval(() => {
      void checkOrderStatus()
    }, 2500)
  }, [checkOrderStatus, stopPolling])

  const initPayment = useCallback(async () => {
    setLoading(true)
    setError(null)
    setCodeUrl(null)
    setMockMode(false)

    try {
      const res = await fetch('/api/payments/wechat/native', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ order_id: orderId }),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        setError(data.error || '发起支付失败')
        return
      }

      if (data.mock) {
        setMockMode(true)
        onSuccess()
        return
      }

      setCodeUrl(data.codeUrl)
      startPolling()
    } catch {
      setError('网络错误，请重试')
    } finally {
      setLoading(false)
    }
  }, [orderId, onSuccess, startPolling])

  useEffect(() => {
    if (!open || !orderId) return
    void initPayment()
    return () => stopPolling()
  }, [open, orderId, initPayment, stopPolling])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">微信扫码支付</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="关闭"
          >
            ✕
          </button>
        </div>

        <p className="mb-4 text-center text-2xl font-bold text-gray-900">¥{amount}</p>

        {loading && (
          <div className="py-10 text-center text-gray-500">正在生成付款码...</div>
        )}

        {error && (
          <div className="space-y-4">
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
            <button
              type="button"
              onClick={() => void initPayment()}
              className="w-full rounded-lg bg-blue-500 py-2 text-white hover:bg-blue-600"
            >
              重试
            </button>
          </div>
        )}

        {mockMode && !loading && (
          <p className="py-6 text-center text-sm text-green-600">模拟支付成功（开发模式）</p>
        )}

        {codeUrl && !loading && (
          <div className="flex flex-col items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(codeUrl)}`}
              alt="微信支付二维码"
              width={220}
              height={220}
              className="rounded-lg border border-gray-100"
            />
            <p className="text-center text-sm text-gray-500">
              请使用微信扫一扫完成支付
              <br />
              支付完成后会自动跳转
            </p>
            <button
              type="button"
              onClick={() => void checkOrderStatus()}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              我已支付，刷新状态
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
