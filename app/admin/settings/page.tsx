'use client'

import { useState } from 'react'
import { Save } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { mockSystemSettings, type SystemSettings } from '@/lib/admin-data'

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>(mockSystemSettings)
  const [saving, setSaving] = useState(false)

  const handleMembershipPriceChange = (
    type: keyof typeof settings.membership,
    value: string
  ) => {
    const numValue = parseInt(value, 10)
    if (!isNaN(numValue) && numValue >= 0) {
      setSettings((prev) => ({
        ...prev,
        membership: {
          ...prev.membership,
          [type]: numValue,
        },
      }))
    }
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
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 500))
    setSaving(false)
    toast.success('设置已保存')
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
          <CardDescription>设置各类型会员套餐的价格</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="space-y-2">
              <label htmlFor="monthly-price" className="text-sm font-medium">
                月卡价格
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  ¥
                </span>
                <Input
                  id="monthly-price"
                  type="number"
                  min="0"
                  value={settings.membership.monthly}
                  onChange={(e) =>
                    handleMembershipPriceChange('monthly', e.target.value)
                  }
                  className="pl-7"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                有效期 30 天
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="quarterly-price" className="text-sm font-medium">
                季卡价格
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  ¥
                </span>
                <Input
                  id="quarterly-price"
                  type="number"
                  min="0"
                  value={settings.membership.quarterly}
                  onChange={(e) =>
                    handleMembershipPriceChange('quarterly', e.target.value)
                  }
                  className="pl-7"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                有效期 90 天
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="yearly-price" className="text-sm font-medium">
                年卡价格
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  ¥
                </span>
                <Input
                  id="yearly-price"
                  type="number"
                  min="0"
                  value={settings.membership.yearly}
                  onChange={(e) =>
                    handleMembershipPriceChange('yearly', e.target.value)
                  }
                  className="pl-7"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                有效期 365 天
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Free Generations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">免费次数配置</CardTitle>
          <CardDescription>设置非会员用户每天可使用的免费生成次数</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <label htmlFor="free-generations" className="text-sm font-medium">
              每日免费生成次数
            </label>
            <div className="flex items-center gap-4">
              <Input
                id="free-generations"
                type="number"
                min="0"
                max="100"
                value={settings.freeGenerations.daily}
                onChange={(e) => handleFreeGenerationsChange(e.target.value)}
                className="w-32"
              />
              <span className="text-sm text-muted-foreground">次/天</span>
            </div>
            <p className="text-xs text-muted-foreground">
              设置为 0 则不提供免费次数
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">支付方式</CardTitle>
          <CardDescription>选择支持的支付方式</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center text-white font-bold">
                  W
                </div>
                <div>
                  <p className="font-medium">微信支付</p>
                  <p className="text-xs text-muted-foreground">微信安全支付</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handlePaymentMethodChange('wechat', !settings.paymentMethods.wechat)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings.paymentMethods.wechat ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    settings.paymentMethods.wechat ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">
                  Z
                </div>
                <div>
                  <p className="font-medium">支付宝</p>
                  <p className="text-xs text-muted-foreground">支付宝安全支付</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handlePaymentMethodChange('alipay', !settings.paymentMethods.alipay)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings.paymentMethods.alipay ? 'bg-green-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    settings.paymentMethods.alipay ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">通知设置</CardTitle>
          <CardDescription>系统通知相关配置</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">短信通知</p>
              <p className="text-sm text-muted-foreground">会员到期前发送短信提醒</p>
            </div>
            <button
              type="button"
              onClick={() => handleSmsNotificationChange(!settings.smsNotification)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                settings.smsNotification ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  settings.smsNotification ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Price Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">价格预览</CardTitle>
          <CardDescription>当前设置下的价格对比</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-3 text-left text-sm font-medium">套餐类型</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">价格</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">有效期</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">日均价格</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="px-4 py-3 text-sm">月卡</td>
                  <td className="px-4 py-3 text-sm font-medium">¥{settings.membership.monthly}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">30 天</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    ¥{(settings.membership.monthly / 30).toFixed(2)}
                  </td>
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-3 text-sm">季卡</td>
                  <td className="px-4 py-3 text-sm font-medium">¥{settings.membership.quarterly}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">90 天</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    ¥{(settings.membership.quarterly / 90).toFixed(2)}
                  </td>
                </tr>
                <tr>
                  <td className="px-4 py-3 text-sm">年卡</td>
                  <td className="px-4 py-3 text-sm font-medium">¥{settings.membership.yearly}</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">365 天</td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    ¥{(settings.membership.yearly / 365).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
