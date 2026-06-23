"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { clearAuthSession, isAuthExpiredMessage, isLoggedIn } from '@/lib/auth-client'
import { fetchScriptHistory, formatHistoryTime, SCRIPT_HISTORY_PAGE_SIZE } from '@/lib/history/client'
import {
  changePassword,
  fetchCurrentUser,
  fetchCustomerServiceWechat,
  formatProfileDate,
  getMembershipStatusLabel,
  getPlanTypeLabel,
  type ProfileUser,
} from '@/lib/profile/client'
import { validateUserPassword } from '@/lib/auth-users'
import { ScriptCard } from '@/components/ScriptCard'
import { GenerationQuotaDisplay } from '@/components/GenerationQuotaDisplay'
import type { GenerationHistoryEntry } from '@/lib/types'

const baseMenuItems = [
  { key: "info", label: "用户信息" },
  { key: "scripts", label: "历史脚本" },
  { key: "orders", label: "订单信息" },
  { key: "support", label: "专属客服", memberOnly: true },
  { key: "password", label: "修改密码" },
] as const

export default function ProfileClient() {
  const [activeMenu, setActiveMenu] = useState<string>("info")
  const [isActiveMember, setIsActiveMember] = useState(false)
  const [membershipLoaded, setMembershipLoaded] = useState(false)

  useEffect(() => {
    let cancelled = false

    const loadMembership = async () => {
      try {
        const user = await fetchCurrentUser()
        if (!cancelled) {
          setIsActiveMember(user.membership.status === 'active')
        }
      } catch {
        if (!cancelled) setIsActiveMember(false)
      } finally {
        if (!cancelled) setMembershipLoaded(true)
      }
    }

    void loadMembership()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!membershipLoaded) return
    if (activeMenu === 'support' && !isActiveMember) {
      setActiveMenu('info')
    }
  }, [membershipLoaded, isActiveMember, activeMenu])

  const menuItems = baseMenuItems.filter(
    (item) => !('memberOnly' in item && item.memberOnly) || isActiveMember,
  )

  const handleLogout = async () => {
    try {
      const { supabase } = await import('@/lib/supabase')
      await supabase.auth.signOut()
      clearAuthSession()
      window.location.href = '/'
    } catch (e) {
      console.error('退出失败', e)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">个人中心</h1>
        <Link
          href="/"
          className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          ← 返回首页
        </Link>
      </div>
      <div className="flex">
        {/* 左侧菜单 */}
        <div className="w-64 bg-white min-h-[calc(100vh-57px)] shadow-sm flex flex-col border-r border-gray-100">
          <nav className="mt-4 flex-1">
            {menuItems.map((item) => (
              <div
                key={item.key}
                onClick={() => setActiveMenu(item.key)}
                className={`w-full text-left px-6 py-3 text-sm font-medium transition-colors cursor-pointer ${
                  activeMenu === item.key
                    ? "bg-blue-50 text-blue-600 border-r-2 border-blue-600"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {item.label}
              </div>
            ))}
          </nav>
          <div className="p-4 border-t mt-auto">
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="w-full bg-red-50 text-red-600 py-2.5 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium"
            >
              退出登录
            </button>
          </div>
        </div>

        {/* 右侧内容 */}
        <div className="flex-1 p-8">
          {activeMenu === "info" && <MemberInfo />}
          {activeMenu === "password" && <ChangePassword />}
          {activeMenu === "scripts" && <ScriptHistory />}
          {activeMenu === "orders" && <OrderCenter />}
          {activeMenu === "support" && isActiveMember && <ExclusiveCustomerService />}
        </div>
      </div>
    </div>
  )
}

function MemberInfo() {
  const [user, setUser] = useState<ProfileUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchCurrentUser()
        if (!cancelled) setUser(data)
      } catch (err) {
        if (!cancelled) {
          const msg = err instanceof Error ? err.message : '加载失败'
          if (isAuthExpiredMessage(msg) || !isLoggedIn()) {
            setError(null)
            setUser(null)
          } else {
            setError(msg)
            setUser(null)
          }
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">用户信息</h2>
        <div className="text-center text-gray-500 py-8">加载中...</div>
      </div>
    )
  }

  if (error || !user) {
    if (!error && !user) {
      return (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">用户信息</h2>
          <div className="text-center text-gray-500 py-8">正在跳转…</div>
        </div>
      )
    }

    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">用户信息</h2>
        <div className="text-center text-red-500 py-8">{error || '加载失败'}</div>
      </div>
    )
  }

  const membership = user.membership
  const isActiveMember = membership.status === 'active'

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">用户信息</h2>
      <div className="space-y-4">
        {user.nickname?.trim() && (
          <div className="flex items-center justify-between py-3 border-b">
            <span className="text-gray-600">昵称</span>
            <span className="text-gray-900">{user.nickname}</span>
          </div>
        )}
        <div className="flex items-center justify-between py-3 border-b">
          <span className="text-gray-600">手机号</span>
          <span className="text-gray-900">{user.phone || '—'}</span>
        </div>
        <div className="flex items-center justify-between py-3 border-b">
          <span className="text-gray-600">会员状态</span>
          <span className={isActiveMember ? 'text-red-500 font-medium' : 'text-gray-500'}>
            {getMembershipStatusLabel(membership.status)}
          </span>
        </div>
        {isActiveMember && (
          <>
            <div className="flex items-center justify-between py-3 border-b">
              <span className="text-gray-600">会员类型</span>
              <span className="text-gray-900">{getPlanTypeLabel(membership.plan_type)}</span>
            </div>
            <div className="flex items-center justify-between py-3 border-b">
              <span className="text-gray-600">开通时间</span>
              <span className="text-gray-900">{formatProfileDate(membership.starts_at)}</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <span className="text-gray-600">到期时间</span>
              <span className="text-gray-900">{formatProfileDate(membership.expires_at)}</span>
            </div>
          </>
        )}
        {membership.status === 'expired' && membership.expires_at && (
          <div className="flex items-center justify-between py-3 border-b">
            <span className="text-gray-600">到期时间</span>
            <span className="text-gray-900">{formatProfileDate(membership.expires_at)}</span>
          </div>
        )}
        <div className="pt-2">
          <GenerationQuotaDisplay variant="detail" />
        </div>
      </div>
    </div>
  )
}

function ChangePassword() {
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [errors, setErrors] = useState({ old: "", new: "", confirm: "" })
  const [formError, setFormError] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const validate = () => {
    const newErrors = { old: "", new: "", confirm: "" }
    let valid = true

    if (!oldPassword) {
      newErrors.old = "请输入旧密码"
      valid = false
    }

    const newPasswordError = validateUserPassword(newPassword)
    if (newPasswordError) {
      newErrors.new = newPasswordError === "请输入密码" ? "请输入新密码" : "密码长度需为6-12位"
      valid = false
    } else if (oldPassword && newPassword === oldPassword) {
      newErrors.new = "新密码不能与旧密码相同"
      valid = false
    }

    if (!confirmPassword) {
      newErrors.confirm = "请再次输入密码"
      valid = false
    } else if (confirmPassword !== newPassword) {
      newErrors.confirm = "两次密码输入不一致"
      valid = false
    }

    setErrors(newErrors)
    return valid
  }

  const handleSubmit = async () => {
    if (!validate()) return

    setSubmitting(true)
    setFormError("")

    try {
      await changePassword({ oldPassword, newPassword })

      clearAuthSession()
      try {
        const { supabase } = await import('@/lib/supabase')
        await supabase.auth.signOut()
      } catch {
        // 本地 session 已清除即可
      }

      window.location.href = '/login'
    } catch (err) {
      setFormError(err instanceof Error ? err.message : '修改密码失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 max-w-md">
      <h2 className="text-lg font-medium text-gray-900 mb-4">修改密码</h2>
      {formError && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm mb-4">{formError}</div>
      )}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">旧密码</label>
          <input
            type="password"
            value={oldPassword}
            disabled={submitting}
            onChange={(e) => {
              setOldPassword(e.target.value)
              setErrors({ ...errors, old: "" })
              setFormError("")
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            placeholder="请输入旧密码"
          />
          {errors.old && <p className="mt-1 text-sm text-red-500">{errors.old}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">新密码</label>
          <input
            type="password"
            value={newPassword}
            disabled={submitting}
            onChange={(e) => {
              setNewPassword(e.target.value)
              setErrors({ ...errors, new: "" })
              setFormError("")
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            placeholder="请输入新密码（6-12位）"
          />
          {errors.new && <p className="mt-1 text-sm text-red-500">{errors.new}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">确认密码</label>
          <input
            type="password"
            value={confirmPassword}
            disabled={submitting}
            onChange={(e) => {
              setConfirmPassword(e.target.value)
              setErrors({ ...errors, confirm: "" })
              setFormError("")
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            placeholder="请再次输入密码"
          />
          {errors.confirm && <p className="mt-1 text-sm text-red-500">{errors.confirm}</p>}
        </div>
        <button
          type="button"
          onClick={() => void handleSubmit()}
          disabled={submitting}
          className="w-full bg-black text-white py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? "提交中..." : "确认修改"}
        </button>
      </div>
    </div>
  )
}

function ScriptHistory() {
  const [scripts, setScripts] = useState<GenerationHistoryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedScript, setSelectedScript] = useState<GenerationHistoryEntry | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const result = await fetchScriptHistory({
          page,
          pageSize: SCRIPT_HISTORY_PAGE_SIZE,
        })
        if (!cancelled) {
          setScripts(result.items)
          setTotal(result.pagination.total)
          setTotalPages(result.pagination.totalPages)
          setSelectedScript(null)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '加载失败')
          setScripts([])
          setSelectedScript(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [page, refreshKey])

  useEffect(() => {
    const onUpdate = () => {
      setPage(1)
      setRefreshKey((k) => k + 1)
    }
    window.addEventListener('history-updated', onUpdate)
    return () => window.removeEventListener('history-updated', onUpdate)
  }, [])

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">历史脚本</h2>
        <div className="text-center text-gray-500 py-8">加载中...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">历史脚本</h2>
        <div className="text-center text-red-500 py-8">{error}</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">历史脚本</h2>
      {scripts.length === 0 ? (
        <div className="text-center text-gray-500 py-8">暂无脚本记录</div>
      ) : (
        <div className="space-y-3">
          {scripts.map((script) => (
            <div 
              key={script.id} 
              className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => setSelectedScript(script)}
            >
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">行业：{script.basicInput.industry}</span>
                  <span className="text-gray-300">|</span>
                  <span className="text-gray-900">产品：{script.basicInput.product}</span>
                </div>
                <span className="text-gray-400">日期：{formatHistoryTime(script.createdAt)}</span>
              </div>
              
              {script.basicInput.productDescription?.trim() && (
                <p className="mt-2 text-sm text-gray-600">描述：{script.basicInput.productDescription}</p>
              )}
              
              {script.basicInput.scene?.trim() && (
                <p className="mt-1 text-sm text-gray-600">场景：{script.basicInput.scene}</p>
              )}
              
              <p className="mt-2 text-sm font-medium text-gray-800">选题：{script.selectedTopic.topic}</p>
            </div>
          ))}
        </div>
      )}
      {total > 0 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
          <span className="text-sm text-gray-500">共 {total} 条</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              上一页
            </button>
            <span className="text-sm text-gray-600">
              第 {page} / {totalPages} 页
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              下一页
            </button>
          </div>
        </div>
      )}
      {selectedScript && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedScript(null)}>
          <div 
            className="bg-white rounded-lg w-full max-w-2xl max-h-[85vh] flex flex-col relative overflow-hidden" 
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setSelectedScript(null)} 
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors z-10"
            >
              ✕
            </button>
            
            <div className="p-6 border-b flex-shrink-0">
              <h3 className="text-lg font-medium text-gray-900 pr-10">{selectedScript.selectedTopic.topic}</h3>
              <p className="text-sm text-gray-500 mt-1">
                {selectedScript.basicInput.industry} | {selectedScript.basicInput.product} | {formatHistoryTime(selectedScript.createdAt)}
              </p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <ScriptCard script={selectedScript.script} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function OrderCenter() {
  const orders = [
    { id: "1", type: "月度会员", amount: 29, status: "completed", createdAt: "2024-03-15 10:00" },
    { id: "2", type: "月度会员", amount: 29, status: "pending", createdAt: "2024-02-15 10:00" },
  ]

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">订单信息</h2>
      {orders.length === 0 ? (
        <div className="text-center text-gray-500 py-8">暂无订单记录</div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-sm text-gray-900">{order.type}</span>
                  <span className="ml-4 text-sm text-gray-600">¥{order.amount}</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${order.status === "completed" ? "bg-green-100 text-green-600" : "bg-yellow-100 text-yellow-600"}`}>
                  {order.status === "completed" ? "已完成" : "待处理"}
                </span>
              </div>
              <p className="mt-2 text-xs text-gray-400">{order.createdAt}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ExclusiveCustomerService() {
  const [wechat, setWechat] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const id = await fetchCustomerServiceWechat()
        if (!cancelled) setWechat(id)
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '加载失败')
          setWechat(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const handleCopy = async () => {
    if (!wechat?.trim()) return
    try {
      await navigator.clipboard.writeText(wechat.trim())
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('复制失败，请手动复制微信号')
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 max-w-lg">
      <h2 className="text-lg font-medium text-gray-900 mb-2">专属客服</h2>
      <p className="text-sm text-gray-500 mb-6">
        添加下方微信号，享受会员专属一对一服务
      </p>

      {loading && (
        <div className="text-center text-gray-500 py-8">加载中...</div>
      )}

      {!loading && error && (
        <div className="text-center text-red-500 py-8">{error}</div>
      )}

      {!loading && !error && (
        <div className="rounded-xl border border-green-100 bg-green-50/50 p-6">
          {wechat?.trim() ? (
            <>
              <p className="text-sm text-gray-600 mb-2">客服微信号</p>
              <div className="flex items-center justify-between gap-4">
                <span className="text-2xl font-semibold text-gray-900 tracking-wide">
                  {wechat.trim()}
                </span>
                <button
                  type="button"
                  onClick={() => void handleCopy()}
                  className="shrink-0 px-4 py-2 text-sm font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
                >
                  {copied ? '已复制' : '复制微信号'}
                </button>
              </div>
              <p className="mt-4 text-xs text-gray-500">
                打开微信 → 添加朋友 → 搜索微信号 → 发送验证信息「会员咨询」
              </p>
            </>
          ) : (
            <div className="text-center text-gray-500 py-4">
              客服微信暂未配置，请稍后再试或联系平台管理员
            </div>
          )}
        </div>
      )}
    </div>
  )
}
