'use client'

import { useState, useEffect } from 'react'
import { Save } from 'lucide-react'
import { toast } from 'sonner'
import {
  INITIAL_SITE_SETTINGS,
  LOCKED_OFF_PLANS,
  PAYMENT_LOCKS,
  siteSettingsToUiState,
} from '@/lib/site-settings'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

type SystemSettings = ReturnType<typeof siteSettingsToUiState>

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>(
    siteSettingsToUiState(INITIAL_SITE_SETTINGS),
  )
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/settings')
      const data = await res.json()
      if (data.success) {
        const payload = data.data
        setSettings({
          membership: payload.membership_pricing || settings.membership,
          freeGenerations: {
            daily: payload.site_settings?.free_generations ?? 1,
          },
          memberGenerations: {
            daily: payload.site_settings?.member_generations ?? 20,
          },
          paymentMethods: payload.site_settings?.payment_methods || {
            wechat: true,
            alipay: false,
          },
          smsNotification: payload.site_settings?.sms_notification ?? false,
          customerServiceWechat: payload.site_settings?.customer_service_wechat ?? '',
          membershipPurchaseEnabled:
            payload.site_settings?.membership_purchase_enabled ?? false,
        })
      }
    } catch (error) {
      console.error('获取设置失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const parsePlanAmount = (value: string) => {
    const num = parseFloat(value)
    return Number.isFinite(num) && num >= 0 ? num : null
  }

  const handleMembershipPriceChange = (
    type: 'monthly' | 'quarterly' | 'yearly',
    value: string
  ) => {
    const numValue = parsePlanAmount(value)
    if (numValue === null) return
    setSettings((prev) => ({
      ...prev,
      membership: {
        ...prev.membership,
        [type]: {
          ...(prev.membership?.[type] || { price: 0, originalPrice: 0, enabled: true }),
          price: numValue,
        },
      },
    }))
  }

  const handleMembershipOriginalPriceChange = (
    type: 'monthly' | 'quarterly' | 'yearly',
    value: string
  ) => {
    const numValue = parsePlanAmount(value)
    if (numValue === null) return
    setSettings((prev) => ({
      ...prev,
      membership: {
        ...prev.membership,
        [type]: {
          ...(prev.membership?.[type] || { price: 0, originalPrice: 0, enabled: true }),
          originalPrice: numValue,
        },
      },
    }))
  }

  const handleMembershipEnabledChange = (
    type: 'monthly' | 'quarterly' | 'yearly',
    enabled: boolean
  ) => {
    if (type === 'monthly' || (LOCKED_OFF_PLANS as readonly string[]).includes(type)) return
    setSettings((prev) => ({
      ...prev,
      membership: {
        ...prev.membership,
        [type]: {
          ...(prev.membership?.[type] || { price: 0, originalPrice: 0, enabled: true }),
          enabled,
        },
      },
    }))
  }

  const handleFreeGenerationsChange = (value: string) => {
    const numValue = parseInt(value, 10)
    if (!isNaN(numValue) && numValue >= 0) {
      setSettings((prev) => ({
        ...prev,
        freeGenerations: {
          daily: numValue,
        },
      }))
    }
  }

  const handleMemberGenerationsChange = (value: string) => {
    const numValue = parseInt(value, 10)
    if (!isNaN(numValue) && numValue >= 0) {
      setSettings((prev) => ({
        ...prev,
        memberGenerations: {
          daily: numValue,
        },
      }))
    }
  }

  const handleMembershipPurchaseEnabledChange = (enabled: boolean) => {
    setSettings((prev) => ({
      ...prev,
      membershipPurchaseEnabled: enabled,
    }))
  }

  const handlePaymentMethodChange = (method: 'wechat' | 'alipay', enabled: boolean) => {
    if (method === 'wechat' && PAYMENT_LOCKS.wechatRequiredWhenPurchaseOpen) return
    if (method === 'alipay' && PAYMENT_LOCKS.alipayLockedOff) return
    setSettings((prev) => ({
      ...prev,
      paymentMethods: {
        ...prev.paymentMethods,
        [method]: enabled,
      },
    }))
  }

  const handleSmsNotificationChange = (enabled: boolean) => {
    setSettings((prev) => ({
      ...prev,
      smsNotification: enabled,
    }))
  }

  const handleCustomerServiceWechatChange = (value: string) => {
    setSettings((prev) => ({
      ...prev,
      customerServiceWechat: value,
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // 构建保存的数据
      const saveData = {
        membership_pricing: settings.membership,
        site_settings: {
          free_generations: settings.freeGenerations?.daily || 1,
          member_generations: settings.memberGenerations?.daily ?? 20,
          payment_methods: settings.paymentMethods,
          sms_notification: settings.smsNotification,
          customer_service_wechat: settings.customerServiceWechat?.trim() ?? '',
          membership_purchase_enabled: settings.membershipPurchaseEnabled ?? false,
        },
      }
      
      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saveData),
      })
      const data = await res.json()
      
      if (data.success) {
        toast.success('设置已保存')
      } else {
        toast.error(data.error || '保存失败')
      }
    } catch (error) {
      console.error('保存设置失败:', error)
      toast.error('保存失败，请重试')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-bold">系统设置</h1>
            <p className="text-sm text-muted-foreground">配置系统参数和价格</p>
          </div>
        </div>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl font-bold">系统设置</h1>
          <p className="text-sm text-muted-foreground">配置系统参数和价格</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            '保存中...'
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              保存设置
            </>
          )}
        </Button>
      </div>

      {/* Generation Quota */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">免费体验额度</CardTitle>
          <CardDescription>
            推广期用户登录后，每日可免费生成脚本的次数（按自然日重置）
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium whitespace-nowrap w-28">每日免费</label>
            <Input
              type="number"
              min="0"
              value={settings.freeGenerations?.daily ?? 1}
              onChange={(e) => handleFreeGenerationsChange(e.target.value)}
              className="w-32"
            />
            <span className="text-sm text-muted-foreground">次/天（登录用户）</span>
          </div>
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium whitespace-nowrap w-28">会员每日</label>
            <Input
              type="number"
              min="0"
              value={settings.memberGenerations?.daily ?? 20}
              onChange={(e) => handleMemberGenerationsChange(e.target.value)}
              className="w-32"
            />
            <span className="text-sm text-muted-foreground">次/天（有效会员，后台手动开通）</span>
          </div>
        </CardContent>
      </Card>

      {/* Promo / Purchase */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">会员购买</CardTitle>
          <CardDescription>
            关闭时用户仅可使用免费体验额度；开启后显示购买页并允许在线下单
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">开放用户在线购买会员</span>
            <Switch
              checked={settings.membershipPurchaseEnabled ?? false}
              onCheckedChange={handleMembershipPurchaseEnabledChange}
            />
          </div>
        </CardContent>
      </Card>

      {/* Membership Pricing */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">会员价格配置</CardTitle>
          <CardDescription>
            设置各套餐原价与优惠价（优惠价为用户实际支付金额；季卡、年卡暂未开放）
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-3">
            {/* 月卡 */}
            <div className={`space-y-3 ${!settings.membership?.monthly?.enabled ? 'opacity-50' : ''}`}>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">月卡</label>
                <Switch
                  checked={settings.membership?.monthly?.enabled ?? true}
                  disabled
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">原价</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">¥</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={settings.membership?.monthly?.originalPrice ?? 29}
                    onChange={(e) => handleMembershipOriginalPriceChange('monthly', e.target.value)}
                    className="pl-7"
                    disabled={!settings.membership?.monthly?.enabled}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">优惠价</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">¥</span>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={settings.membership?.monthly?.price ?? 9.9}
                    onChange={(e) => handleMembershipPriceChange('monthly', e.target.value)}
                    className="pl-7"
                    disabled={!settings.membership?.monthly?.enabled}
                  />
                </div>
              </div>
            </div>

            {/* 季卡 */}
            <div className={`space-y-3 ${!settings.membership?.quarterly?.enabled ? 'opacity-50' : ''}`}>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">季卡</label>
                <Switch checked={false} disabled />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">原价</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">¥</span>
                  <Input type="number" min="0" step="0.01" value={settings.membership?.quarterly?.originalPrice ?? 99} className="pl-7" disabled />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">优惠价</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">¥</span>
                  <Input type="number" min="0" step="0.01" value={settings.membership?.quarterly?.price ?? 99} className="pl-7" disabled />
                </div>
              </div>
            </div>

            {/* 年卡 */}
            <div className={`space-y-3 ${!settings.membership?.yearly?.enabled ? 'opacity-50' : ''}`}>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">年卡</label>
                <Switch checked={false} disabled />
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">原价</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">¥</span>
                  <Input type="number" min="0" step="0.01" value={settings.membership?.yearly?.originalPrice ?? 299} className="pl-7" disabled />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs text-muted-foreground">优惠价</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">¥</span>
                  <Input type="number" min="0" step="0.01" value={settings.membership?.yearly?.price ?? 299} className="pl-7" disabled />
                </div>
              </div>
            </div>
          </div>

          {/* 状态表格 */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left py-2 px-4 font-medium">套餐类型</th>
                  <th className="text-left py-2 px-4 font-medium">原价</th>
                  <th className="text-left py-2 px-4 font-medium">优惠价</th>
                  <th className="text-left py-2 px-4 font-medium">状态</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="py-2 px-4">月卡</td>
                  <td className="py-2 px-4">¥{settings.membership?.monthly?.originalPrice ?? 29}</td>
                  <td className="py-2 px-4">¥{settings.membership?.monthly?.price ?? 9.9}</td>
                  <td className="py-2 px-4">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      settings.membership?.monthly?.enabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {settings.membership?.monthly?.enabled ? '已启用' : '已禁用'}
                    </span>
                  </td>
                </tr>
                <tr className="border-t">
                  <td className="py-2 px-4">季卡</td>
                  <td className="py-2 px-4">¥{settings.membership?.quarterly?.originalPrice ?? 99}</td>
                  <td className="py-2 px-4">¥{settings.membership?.quarterly?.price ?? 99}</td>
                  <td className="py-2 px-4">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      settings.membership?.quarterly?.enabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {!settings.membership?.quarterly?.enabled ? '暂未开放' : '已启用'}
                    </span>
                  </td>
                </tr>
                <tr className="border-t">
                  <td className="py-2 px-4">年卡</td>
                  <td className="py-2 px-4">¥{settings.membership?.yearly?.originalPrice ?? 299}</td>
                  <td className="py-2 px-4">¥{settings.membership?.yearly?.price ?? 299}</td>
                  <td className="py-2 px-4">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      settings.membership?.yearly?.enabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {!settings.membership?.yearly?.enabled ? '暂未开放' : '已启用'}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      {settings.membershipPurchaseEnabled && (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">支付方式配置</CardTitle>
          <CardDescription>启用或禁用支持的支付方式（当前仅开放微信支付）</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">微信支付</span>
            </div>
            <Switch
              checked={settings.paymentMethods?.wechat ?? true}
              disabled={PAYMENT_LOCKS.wechatRequiredWhenPurchaseOpen}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">支付宝</span>
            </div>
            <Switch
              checked={false}
              disabled={PAYMENT_LOCKS.alipayLockedOff}
            />
          </div>
        </CardContent>
      </Card>
      )}

      {/* Customer Service */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">专属客服配置</CardTitle>
          <CardDescription>
            设置会员在个人中心「专属客服」中看到的微信号
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <label className="text-sm font-medium">客服微信号</label>
          <Input
            value={settings.customerServiceWechat ?? ''}
            onChange={(e) => handleCustomerServiceWechatChange(e.target.value)}
            placeholder="例如：script_service_01"
            className="max-w-md"
          />
          <p className="text-xs text-muted-foreground">
            仅有效会员可在个人中心查看；留空时会员端会提示暂未配置
          </p>
        </CardContent>
      </Card>

      {/* SMS Notification */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">短信通知</CardTitle>
          <CardDescription>开启后，会员到期前将发送短信提醒</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">会员到期提醒</span>
            <Switch
              checked={settings.smsNotification ?? true}
              onCheckedChange={handleSmsNotificationChange}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
