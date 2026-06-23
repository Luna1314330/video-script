/** 与 Supabase 实际表结构对齐的常量与映射 */

import {
  getSiteSettings,
  toAdminApiPayload,
} from '@/lib/site-settings'
import { parseScriptHistoryPayload } from '@/lib/script-history'

export const DB = {
  userProfiles: 'user_profiles',
  memberships: 'memberships',
  orders: 'orders',
  scriptHistory: 'script_history',
  generationLogs: 'generation_logs',
} as const

export type MembershipStatus = 'free' | 'active' | 'expired' | 'cancelled'
export type MembershipPlanType = 'monthly' | 'quarterly' | 'yearly'
export type OrderStatus = 'pending' | 'paid' | 'failed' | 'refunded'

export const PLAN_TYPE_LABELS: Record<MembershipPlanType, string> = {
  monthly: '月卡',
  quarterly: '季卡',
  yearly: '年卡',
}

export function formatPlanType(
  planType: string | null | undefined,
): { planType: MembershipPlanType | null; planLabel: string } {
  if (!planType) return { planType: null, planLabel: '—' }
  if (planType === 'monthly' || planType === 'quarterly' || planType === 'yearly') {
    return { planType, planLabel: PLAN_TYPE_LABELS[planType] }
  }
  return { planType: null, planLabel: planType }
}

/** 关联 user_profiles 的 select 片段 */
export const USER_PROFILE_EMBED = `user_profiles (
  id,
  phone,
  nickname,
  created_at
)`

/** Supabase Auth 仍使用邮箱登录，由手机号转换 */
export function phoneToEmail(phone: string): string {
  const trimmed = phone.trim()
  if (trimmed.includes('@')) return trimmed
  return `${trimmed}@script-workshop.com`
}

/** 读取 user_profiles.phone 时去掉 Auth 邮箱后缀（兼容旧数据） */
export function normalizePhone(phone: string | null | undefined): string {
  if (!phone) return ''
  const trimmed = phone.trim()
  const suffix = '@script-workshop.com'
  if (trimmed.endsWith(suffix)) return trimmed.slice(0, -suffix.length)
  return trimmed
}

export function maskPhone(phone: string): string {
  if (/^\d{11}$/.test(phone)) {
    return `${phone.slice(0, 3)}****${phone.slice(-4)}`
  }
  return phone
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleString('zh-CN', { hour12: false })
}

export function isMembershipActive(
  status: string | null | undefined,
  expiresAt: string | null | undefined,
): boolean {
  if (status !== 'active') return false
  if (!expiresAt) return false
  return new Date(expiresAt) >= new Date()
}

export function inferMembershipTypeFromAmount(
  amount: number | string | null | undefined,
): 'monthly' | 'quarterly' | 'yearly' {
  const n = Number(amount)
  if (Number.isNaN(n)) return 'monthly'
  if (n >= 250) return 'yearly'
  if (n >= 70) return 'quarterly'
  return 'monthly'
}

export function generateOrderNo(): string {
  const ts = Date.now().toString(36).toUpperCase()
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase()
  return `ORD${ts}${rand}`
}

type UserProfileRow = {
  id: string
  phone?: string | null
  nickname?: string | null
  is_active?: boolean | null
  created_at?: string | null
}

type UserProfileEmbed = Pick<UserProfileRow, 'phone' | 'nickname'> | null | undefined

type MembershipRow = {
  id: string
  user_id: string
  status: string
  plan_type?: string | null
  starts_at?: string | null
  expires_at?: string | null
  user_profiles?: UserProfileEmbed
}

export function mapAdminUser(
  profile: UserProfileRow,
  membership?: Pick<MembershipRow, 'status' | 'expires_at' | 'plan_type'> | null,
) {
  const active = membership ? isMembershipActive(membership.status, membership.expires_at) : false
  const plan = formatPlanType(membership?.plan_type)
  return {
    id: profile.id,
    phone: normalizePhone(profile.phone),
    nickname: profile.nickname || '',
    status: profile.is_active === false ? ('banned' as const) : ('active' as const),
    membershipType: active ? (plan.planType || 'monthly') : ('none' as const),
    membershipPlanLabel: active ? plan.planLabel : '无',
    membershipStatus: (membership?.status || 'free') as MembershipStatus,
    createdAt: profile.created_at || '',
  }
}

export function mapAdminMembership(row: MembershipRow) {
  const profile = row.user_profiles
  const plan = formatPlanType(row.plan_type)
  return {
    id: row.id,
    userId: row.user_id,
    phone: normalizePhone(profile?.phone),
    nickname: profile?.nickname || '',
    planType: plan.planType,
    planLabel: plan.planLabel,
    startDate: formatDateTime(row.starts_at),
    expireDate: row.expires_at ? formatDateTime(row.expires_at) : '—',
    status: row.status as MembershipStatus,
  }
}

export function isManualOrder(row: {
  payment_method?: string | null
  order_no?: string | null
}): boolean {
  if (row.payment_method === 'manual') return true
  const orderNo = row.order_no || ''
  return orderNo.startsWith('MAN')
}

/** 是否计入后台收入统计 */
export function countsTowardRevenue(order: {
  status: string
  isManualOrder?: boolean
  payment_method?: string | null
  order_no?: string | null
  amount?: number | string | null
}): boolean {
  if (order.status !== 'paid') return false
  if (order.isManualOrder ?? isManualOrder(order)) return false
  return Number(order.amount ?? 0) > 0
}

export function mapAdminOrder(row: {
  id: string
  user_id: string
  order_no?: string | null
  amount?: number | string | null
  payment_method?: string | null
  status: string
  paid_at?: string | null
  created_at?: string | null
  user_profiles?: UserProfileEmbed
}) {
  const profile = row.user_profiles
  const paymentLabels: Record<string, string> = {
    wechat: '微信支付',
    alipay: '支付宝',
    manual: '手动开通',
  }
  return {
    id: row.id,
    orderNo: row.order_no || row.id,
    userId: row.user_id,
    phone: normalizePhone(profile?.phone),
    nickname: profile?.nickname || '',
    amount: Number(row.amount ?? 0),
    paymentMethod: paymentLabels[row.payment_method || ''] || row.payment_method || '',
    isManualOrder: isManualOrder(row),
    status: row.status as OrderStatus,
    paidAt: row.paid_at ? formatDateTime(row.paid_at) : '—',
    createdAt: formatDateTime(row.created_at),
  }
}

export function mapAdminScript(row: {
  id: string
  user_id: string
  industry: string
  product_name: string
  product_desc?: string | null
  shoot_scene?: string | null
  topic: string
  generated_script?: string | null
  created_at?: string | null
  user_profiles?: UserProfileEmbed
}) {
  const phone = normalizePhone(row.user_profiles?.phone)
  const { fullText } = parseScriptHistoryPayload(row.generated_script)
  return {
    id: row.id,
    userId: row.user_id,
    phone: maskPhone(phone),
    industry: row.industry,
    productName: row.product_name,
    productDesc: row.product_desc,
    shootScene: row.shoot_scene,
    topic: row.topic,
    generatedScript: fullText || row.generated_script,
    createdAt: row.created_at || '',
  }
}

export function defaultAdminSettingsPayload() {
  return toAdminApiPayload(getSiteSettings())
}
