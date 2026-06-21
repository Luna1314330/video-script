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
