import { authFetch, getAuthHeaders } from '@/lib/auth-client'

export type ProfileMembership = {
  status: 'free' | 'active' | 'expired' | 'cancelled'
  plan_type: string | null
  starts_at?: string | null
  expires_at?: string | null
}

export type ProfileUser = {
  id: string
  phone: string
  nickname: string
  membership: ProfileMembership
}

export async function fetchCurrentUser(): Promise<ProfileUser> {
  const res = await authFetch('/api/auth/me', { headers: getAuthHeaders() })
  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || '获取用户信息失败')
  }

  return data.user as ProfileUser
}

export function formatProfileDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleDateString('zh-CN')
}

const MEMBERSHIP_STATUS_LABELS: Record<ProfileMembership['status'], string> = {
  free: '普通用户',
  active: 'VIP会员',
  expired: '会员已过期',
  cancelled: '会员已取消',
}

export function getMembershipStatusLabel(status: ProfileMembership['status']): string {
  return MEMBERSHIP_STATUS_LABELS[status] || '普通用户'
}

const PLAN_TYPE_DISPLAY: Record<string, string> = {
  monthly: '月度会员',
  quarterly: '季度会员',
  yearly: '年度会员',
}

export function getPlanTypeLabel(planType: string | null | undefined): string {
  if (!planType) return '—'
  return PLAN_TYPE_DISPLAY[planType] || planType
}

export function isActiveMembership(
  membership: ProfileMembership | null | undefined,
): boolean {
  return membership?.status === 'active'
}

export function getMembershipActionLabel(isActiveMember: boolean): string {
  return isActiveMember ? '会员续费' : '开通会员'
}

export function getMembershipPurchaseLabel(isActiveMember: boolean): string {
  return isActiveMember ? '立即续费' : '立即开通'
}

export async function changePassword(input: {
  oldPassword: string
  newPassword: string
}): Promise<void> {
  const res = await authFetch('/api/profile/password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(input),
  })
  const data = await res.json()

  if (!res.ok || !data.success) {
    throw new Error(data.message || '修改密码失败')
  }
}

export async function fetchCustomerServiceWechat(): Promise<string> {
  const res = await authFetch('/api/profile/customer-service', { headers: getAuthHeaders() })
  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || '获取客服信息失败')
  }

  return typeof data.wechat === 'string' ? data.wechat : ''
}
