import type { SupabaseClient } from '@supabase/supabase-js'

export type PlanConfig = {
  /** 优惠价（实际售价） */
  price: number
  /** 原价（划线价） */
  originalPrice: number
  enabled: boolean
}

export type SiteSettings = {
  membership: {
    monthly: PlanConfig
    quarterly: PlanConfig
    yearly: PlanConfig
  }
  freeGenerations: { daily: number }
  memberGenerations: { daily: number }
  paymentMethods: { wechat: boolean; alipay: boolean }
  smsNotification: boolean
  /** 会员专属客服微信号 */
  customerServiceWechat: string
}

export type AdminSettingsPayload = {
  membership_pricing?: SiteSettings['membership']
  site_settings?: {
    free_generations?: number
    member_generations?: number
    payment_methods?: SiteSettings['paymentMethods']
    sms_notification?: boolean
    customer_service_wechat?: string
  }
}

export type HydrateSiteSettingsResult = {
  settings: SiteSettings
  persisted: boolean
  tableReady: boolean
}

/** 当前暂未开放的套餐（后台开关不可点击） */
export const LOCKED_OFF_PLANS = ['quarterly', 'yearly'] as const

/** 当前暂未开放的支付方式 */
export const PAYMENT_LOCKS = {
  wechatRequired: true,
  alipayLockedOff: true,
} as const

export const SYSTEM_SETTINGS_TABLE = 'system_settings'

export const PLAN_DISPLAY_NAMES: Record<keyof SiteSettings['membership'], string> = {
  monthly: '月度会员',
  quarterly: '季度会员',
  yearly: '年度会员',
}

function normalizePlanConfig(
  partial: Partial<PlanConfig> | undefined,
  fallback: PlanConfig,
): PlanConfig {
  const price = partial?.price ?? fallback.price
  return {
    enabled: partial?.enabled ?? fallback.enabled,
    price,
    originalPrice: partial?.originalPrice ?? price,
  }
}

export const INITIAL_SITE_SETTINGS: SiteSettings = {
  membership: {
    monthly: { price: 9.9, originalPrice: 29, enabled: true },
    quarterly: { price: 99, originalPrice: 99, enabled: false },
    yearly: { price: 299, originalPrice: 299, enabled: false },
  },
  freeGenerations: { daily: 1 },
  memberGenerations: { daily: 20 },
  paymentMethods: { wechat: true, alipay: false },
  smsNotification: false,
  customerServiceWechat: '',
}

let runtimeSettings: SiteSettings = structuredClone(INITIAL_SITE_SETTINGS)
let settingsHydrated = false
let hydratePromise: Promise<HydrateSiteSettingsResult> | null = null

export function applyPolicyLocks(settings: SiteSettings): SiteSettings {
  const next = structuredClone(settings)

  next.membership.monthly.enabled = true

  for (const plan of LOCKED_OFF_PLANS) {
    next.membership[plan].enabled = false
  }

  if (PAYMENT_LOCKS.wechatRequired) {
    next.paymentMethods.wechat = true
  }
  if (PAYMENT_LOCKS.alipayLockedOff) {
    next.paymentMethods.alipay = false
  }

  return next
}

export function syncRuntimeSiteSettings(settings: SiteSettings): void {
  runtimeSettings = applyPolicyLocks(settings)
  settingsHydrated = true
}

function isMissingTableError(message: string): boolean {
  return (
    message.includes('Could not find the table') ||
    (message.includes('relation') && message.includes('does not exist'))
  )
}

function siteSettingsFromDbRows(rows: Array<{ id: string; value: unknown }>): SiteSettings {
  const byId = Object.fromEntries(rows.map((row) => [row.id, row.value]))
  const membership = byId.membership_pricing as SiteSettings['membership'] | undefined
  const site = byId.site_settings as AdminSettingsPayload['site_settings'] | undefined

  return applyPolicyLocks({
    membership: {
      monthly: normalizePlanConfig(membership?.monthly, INITIAL_SITE_SETTINGS.membership.monthly),
      quarterly: normalizePlanConfig(membership?.quarterly, INITIAL_SITE_SETTINGS.membership.quarterly),
      yearly: normalizePlanConfig(membership?.yearly, INITIAL_SITE_SETTINGS.membership.yearly),
    },
    freeGenerations: {
      daily: site?.free_generations ?? INITIAL_SITE_SETTINGS.freeGenerations.daily,
    },
    memberGenerations: {
      daily: site?.member_generations ?? INITIAL_SITE_SETTINGS.memberGenerations.daily,
    },
    paymentMethods: {
      ...INITIAL_SITE_SETTINGS.paymentMethods,
      ...site?.payment_methods,
    },
    smsNotification: site?.sms_notification ?? INITIAL_SITE_SETTINGS.smsNotification,
    customerServiceWechat:
      typeof site?.customer_service_wechat === 'string'
        ? site.customer_service_wechat
        : INITIAL_SITE_SETTINGS.customerServiceWechat,
  })
}

function siteSettingsToDbRows(settings: SiteSettings) {
  const locked = applyPolicyLocks(settings)
  const now = new Date().toISOString()

  return [
    {
      id: 'membership_pricing',
      value: locked.membership,
      updated_at: now,
    },
    {
      id: 'site_settings',
      value: {
        free_generations: locked.freeGenerations.daily,
        member_generations: locked.memberGenerations.daily,
        payment_methods: locked.paymentMethods,
        sms_notification: locked.smsNotification,
        customer_service_wechat: locked.customerServiceWechat,
      },
      updated_at: now,
    },
  ]
}

export async function persistSiteSettingsToDb(
  supabase: SupabaseClient,
  settings: SiteSettings,
): Promise<void> {
  const rows = siteSettingsToDbRows(settings)

  for (const row of rows) {
    const { error } = await supabase.from(SYSTEM_SETTINGS_TABLE).upsert(row, {
      onConflict: 'id',
    })

    if (error) {
      throw new Error(error.message)
    }
  }

  syncRuntimeSiteSettings(settings)
}

export async function hydrateSiteSettingsFromDb(
  supabase: SupabaseClient,
): Promise<HydrateSiteSettingsResult> {
  const { data, error } = await supabase
    .from(SYSTEM_SETTINGS_TABLE)
    .select('id, value')

  if (error) {
    if (isMissingTableError(error.message)) {
      syncRuntimeSiteSettings(structuredClone(INITIAL_SITE_SETTINGS))
      settingsHydrated = false
      return {
        settings: getSiteSettings(),
        persisted: false,
        tableReady: false,
      }
    }
    throw new Error(error.message)
  }

  if (!data?.length) {
    const defaults = applyPolicyLocks(structuredClone(INITIAL_SITE_SETTINGS))
    await persistSiteSettingsToDb(supabase, defaults)
    return {
      settings: getSiteSettings(),
      persisted: true,
      tableReady: true,
    }
  }

  syncRuntimeSiteSettings(siteSettingsFromDbRows(data))

  return {
    settings: getSiteSettings(),
    persisted: true,
    tableReady: true,
  }
}

export async function ensureSiteSettingsHydrated(
  supabase: SupabaseClient,
): Promise<HydrateSiteSettingsResult> {
  if (settingsHydrated) {
    return {
      settings: getSiteSettings(),
      persisted: true,
      tableReady: true,
    }
  }

  if (!hydratePromise) {
    hydratePromise = hydrateSiteSettingsFromDb(supabase).finally(() => {
      hydratePromise = null
    })
  }

  return hydratePromise
}

export function getSiteSettings(): SiteSettings {
  return structuredClone(runtimeSettings)
}

export function toAdminApiPayload(settings: SiteSettings = runtimeSettings) {
  return {
    membership_pricing: settings.membership,
    site_settings: {
      free_generations: settings.freeGenerations.daily,
      member_generations: settings.memberGenerations.daily,
      payment_methods: settings.paymentMethods,
      sms_notification: settings.smsNotification,
      customer_service_wechat: settings.customerServiceWechat,
    },
  }
}

export function updateSiteSettingsFromAdmin(payload: AdminSettingsPayload): SiteSettings {
  const current = getSiteSettings()

  const merged: SiteSettings = {
    membership: {
      monthly: {
        ...current.membership.monthly,
        ...payload.membership_pricing?.monthly,
        enabled: true,
      },
      quarterly: {
        ...current.membership.quarterly,
        ...payload.membership_pricing?.quarterly,
      },
      yearly: {
        ...current.membership.yearly,
        ...payload.membership_pricing?.yearly,
      },
    },
    freeGenerations: {
      daily: payload.site_settings?.free_generations ?? current.freeGenerations.daily,
    },
    memberGenerations: {
      daily: payload.site_settings?.member_generations ?? current.memberGenerations.daily,
    },
    paymentMethods: {
      ...current.paymentMethods,
      ...payload.site_settings?.payment_methods,
    },
    smsNotification:
      payload.site_settings?.sms_notification ?? current.smsNotification,
    customerServiceWechat:
      payload.site_settings?.customer_service_wechat ?? current.customerServiceWechat,
  }

  runtimeSettings = applyPolicyLocks(merged)
  return getSiteSettings()
}

export function isMembershipPlanEnabled(type: string): boolean {
  const plan = runtimeSettings.membership[type as keyof SiteSettings['membership']]
  return Boolean(plan?.enabled)
}

export function getMembershipPrice(type: string): number {
  const plan = runtimeSettings.membership[type as keyof SiteSettings['membership']]
  return plan?.price ?? 0
}

export function getMembershipOriginalPrice(type: string): number {
  const plan = runtimeSettings.membership[type as keyof SiteSettings['membership']]
  if (!plan) return 0
  return plan.originalPrice ?? plan.price
}

export function getEnabledMembershipPlans() {
  return Object.entries(runtimeSettings.membership)
    .filter(([, config]) => config.enabled)
    .map(([id, config]) => ({
      id: id as keyof SiteSettings['membership'],
      name: PLAN_DISPLAY_NAMES[id as keyof SiteSettings['membership']],
      ...config,
    }))
}

export function siteSettingsToUiState(settings: SiteSettings = runtimeSettings) {
  return {
    membership: settings.membership,
    freeGenerations: settings.freeGenerations,
    memberGenerations: settings.memberGenerations,
    paymentMethods: settings.paymentMethods,
    smsNotification: settings.smsNotification,
    customerServiceWechat: settings.customerServiceWechat,
  }
}

export function getCustomerServiceWechat(): string {
  return runtimeSettings.customerServiceWechat.trim()
}

runtimeSettings = applyPolicyLocks(runtimeSettings)
