'use client'

import { useState, useEffect } from 'react'
import { Save } from 'lucide-react'
import { toast } from 'sonner'
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

interface SystemSettings {
  membership?: {
    monthly?: { price: number; enabled: boolean }
    quarterly?: { price: number; enabled: boolean }
    yearly?: { price: number; enabled: boolean }
  }
  freeGenerations?: {
    daily?: number
  }
  paymentMethods?: {
    wechat?: boolean
    alipay?: boolean
  }
  smsNotification?: boolean
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>({
    membership: {
      monthly: { price: 39, enabled: true },
      quarterly: { price: 99, enabled: true },
      yearly: { price: 299, enabled: true },
    },
    freeGenerations: { daily: 3 },
    paymentMethods: { wechat: true, alipay: true },
    smsNotification: true,
  })
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
        // 合并默认设置和数据库设置
        setSettings({
          membership: data.data.membership_pricing || settings.membership,
          freeGenerations: data.data.site_settings?.free_generations 
            ? { daily: data.data.site_settings.free_generations }
            : settings.freeGenerations,
        })
      }
    } catch (error) {
      console.error('获取设置失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMembershipPriceChange = (
    type: 'monthly' | 'quarterly' | 'yearly',
    value: string
  ) => {
    const numValue = parseInt(value, 10)
    if (!isNaN(numValue) && numValue >= 0) {
      setSettings((prev) => ({
        ...prev,
        membership: {
          ...prev.membership,
          [type]: {
            ...(prev.membership?.[type] || { price: 0, enabled: true }),
            price: numValue,
          },
        },
      }))
    }
  }

  const handleMembershipEnabledChange = (
    type: 'monthly' | 'quarterly' | 'yearly',
    enabled: boolean
  ) => {
    setSettings((prev) => ({
      ...prev,
      membership: {
        ...prev.membership,
        [type]: {
          ...(prev.membership?.[type] || { price: 0, enabled: true }),
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

  const handlePaymentMethodChange = (method: 'wechat' | 'alipay', enabled: boolean) => {
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

  const handleSave = async () => {
    setSaving(true)
    try {
      // 构建保存的数据
      const saveData = {
        membership_pricing: settings.membership,
        site_settings: {
          free_generations: settings.freeGenerations?.daily || 3,
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

      {/* Membership Pricing */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">会员价格配置</CardTitle>
          <CardDescription>设置各类型会员套餐的价格和启用状态</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-3">
            {/* 月卡 */}
            <div className={`space-y-2 ${!settings.membership?.monthly?.enabled ? 'opacity-50' : ''}`}>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">月卡价格</label>
                <Switch
                  checked={settings.membership?.monthly?.enabled ?? true}
                  onCheckedChange={(checked) => handleMembershipEnabledChange('monthly', checked)}
                />
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">¥</span>
                <Input
                  type="number"
                  min="0"
                  value={settings.membership?.monthly?.price ?? 39}
                  onChange={(e) => handleMembershipPriceChange('monthly', e.target.value)}
                  className="pl-7"
                  disabled={!settings.membership?.monthly?.enabled}
                />
              </div>
            </div>

            {/* 季卡 */}
            <div className={`space-y-2 ${!settings.membership?.quarterly?.enabled ? 'opacity-50' : ''}`}>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">季卡价格</label>
                <Switch
                  checked={settings.membership?.quarterly?.enabled ?? true}
                  onCheckedChange={(checked) => handleMembershipEnabledChange('quarterly', checked)}
                />
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">¥</span>
                <Input
                  type="number"
                  min="0"
                  value={settings.membership?.quarterly?.price ?? 99}
                  onChange={(e) => handleMembershipPriceChange('quarterly', e.target.value)}
                  className="pl-7"
                  disabled={!settings.membership?.quarterly?.enabled}
                />
              </div>
            </div>

            {/* 年卡 */}
            <div className={`space-y-2 ${!settings.membership?.yearly?.enabled ? 'opacity-50' : ''}`}>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">年卡价格</label>
                <Switch
                  checked={settings.membership?.yearly?.enabled ?? true}
                  onCheckedChange={(checked) => handleMembershipEnabledChange('yearly', checked)}
                />
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">¥</span>
                <Input
                  type="number"
                  min="0"
                  value={settings.membership?.yearly?.price ?? 299}
                  onChange={(e) => handleMembershipPriceChange('yearly', e.target.value)}
                  className="pl-7"
                  disabled={!settings.membership?.yearly?.enabled}
                />
              </div>
            </div>
          </div>

          {/* 状态表格 */}
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left py-2 px-4 font-medium">套餐类型</th>
                  <th className="text-left py-2 px-4 font-medium">价格</th>
                  <th className="text-left py-2 px-4 font-medium">状态</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t">
                  <td className="py-2 px-4">月卡</td>
                  <td className="py-2 px-4">¥{settings.membership?.monthly?.price ?? 39}</td>
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
                  <td className="py-2 px-4">¥{settings.membership?.quarterly?.price ?? 99}</td>
                  <td className="py-2 px-4">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      settings.membership?.quarterly?.enabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {settings.membership?.quarterly?.enabled ? '已启用' : '已禁用'}
                    </span>
                  </td>
                </tr>
                <tr className="border-t">
                  <td className="py-2 px-4">年卡</td>
                  <td className="py-2 px-4">¥{settings.membership?.yearly?.price ?? 299}</td>
                  <td className="py-2 px-4">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      settings.membership?.yearly?.enabled ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {settings.membership?.yearly?.enabled ? '已启用' : '已禁用'}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Free Generations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">免费次数配置</CardTitle>
          <CardDescription>设置非会员用户的每日免费生成次数</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium whitespace-nowrap">每日免费次数</label>
            <Input
              type="number"
              min="0"
              value={settings.freeGenerations?.daily ?? 3}
              onChange={(e) => handleFreeGenerationsChange(e.target.value)}
              className="w-32"
            />
            <span className="text-sm text-muted-foreground">次/天</span>
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">支付方式配置</CardTitle>
          <CardDescription>启用或禁用支持的支付方式</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">微信支付</span>
            </div>
            <Switch
              checked={settings.paymentMethods?.wechat ?? true}
              onCheckedChange={(checked) => handlePaymentMethodChange('wechat', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">支付宝</span>
            </div>
            <Switch
              checked={settings.paymentMethods?.alipay ?? true}
              onCheckedChange={(checked) => handlePaymentMethodChange('alipay', checked)}
            />
          </div>
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
