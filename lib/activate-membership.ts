import type { SupabaseClient } from '@supabase/supabase-js'
import { DB, generateOrderNo } from '@/lib/db/tables'
import type { MembershipPlanType } from '@/lib/db/tables'
import { getMembershipPrice, isMembershipPlanEnabled } from '@/lib/site-settings'

export type { MembershipPlanType }

export function extendMembershipExpireDate(base: Date, type: string): Date {
  const next = new Date(base)
  switch (type) {
    case 'monthly':
      next.setMonth(next.getMonth() + 1)
      break
    case 'quarterly':
      next.setMonth(next.getMonth() + 3)
      break
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1)
      break
    default:
      break
  }
  return next
}

type ActivateMembershipInput = {
  userId: string
  type: MembershipPlanType | string
  /** admin 手动开通 / 用户自助购买 */
  source?: 'admin' | 'user'
  paymentMethod?: 'wechat' | 'alipay' | 'manual'
}

type ActivateMembershipSuccess = {
  success: true
  membershipId: string
  orderId: string
  orderNo: string
  startsAt: string
  expiresAt: string
  amount: number
  planType: MembershipPlanType
}

type ActivateMembershipFailure = {
  success: false
  message: string
  status: number
}

export async function activateUserMembership(
  supabaseAdmin: SupabaseClient,
  input: ActivateMembershipInput,
): Promise<ActivateMembershipSuccess | ActivateMembershipFailure> {
  const { userId, type } = input
  const source = input.source ?? 'user'

  if (!userId || !type) {
    return { success: false, message: '缺少必要参数', status: 400 }
  }

  if (!isMembershipPlanEnabled(type)) {
    return { success: false, message: '该会员套餐暂未开放', status: 400 }
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from(DB.userProfiles)
    .select('id, is_active, phone, nickname')
    .eq('id', userId)
    .maybeSingle()

  if (profileError) {
    return { success: false, message: profileError.message, status: 500 }
  }

  if (!profile) {
    return { success: false, message: '用户不存在', status: 404 }
  }

  if (profile.is_active === false) {
    return { success: false, message: '该用户已被禁用，无法开通会员', status: 403 }
  }

  const now = new Date()
  const startsAt = now.toISOString()
  let expiresAt = extendMembershipExpireDate(now, type)

  const { data: existing, error: existingError } = await supabaseAdmin
    .from(DB.memberships)
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  if (existingError) {
    return { success: false, message: existingError.message, status: 500 }
  }

  const shouldRenewFromCurrent =
    existing?.status === 'active' &&
    existing.expires_at &&
    new Date(existing.expires_at) > now

  if (shouldRenewFromCurrent && existing.expires_at) {
    expiresAt = extendMembershipExpireDate(new Date(existing.expires_at), type)
  }

  const planType = type as MembershipPlanType
  const membershipPayload = {
    status: 'active' as const,
    plan_type: planType,
    starts_at:
      !existing || existing.status === 'free' || existing.status === 'cancelled' || existing.status === 'expired'
        ? startsAt
        : existing.starts_at || startsAt,
    expires_at: expiresAt.toISOString(),
  }

  let membershipId: string

  if (existing) {
    const { data, error } = await supabaseAdmin
      .from(DB.memberships)
      .update(membershipPayload)
      .eq('id', existing.id)
      .select('id')
      .single()

    if (error) {
      console.error('更新会员失败:', error)
      return { success: false, message: error.message, status: 500 }
    }
    membershipId = data.id
  } else {
    const { data, error } = await supabaseAdmin
      .from(DB.memberships)
      .insert({
        user_id: userId,
        ...membershipPayload,
      })
      .select('id')
      .single()

    if (error) {
      console.error('创建会员失败:', error)
      return { success: false, message: error.message, status: 500 }
    }
    membershipId = data.id
  }

  const amount = source === 'admin' ? 0 : getMembershipPrice(type)
  const paymentMethod =
    input.paymentMethod ?? (source === 'admin' ? 'manual' : 'wechat')
  const orderNo =
    source === 'admin' ? `MAN${generateOrderNo()}` : generateOrderNo()

  const { data: order, error: orderError } = await supabaseAdmin
    .from(DB.orders)
    .insert({
      user_id: userId,
      order_no: orderNo,
      amount,
      payment_method: paymentMethod,
      status: 'paid',
      paid_at: startsAt,
    })
    .select('id, order_no')
    .single()

  if (orderError) {
    console.error('创建订单失败:', orderError)
    // 会员已更新，订单失败时回滚会员到之前状态
    if (existing) {
      await supabaseAdmin
        .from(DB.memberships)
        .update({
          status: existing.status,
          plan_type: existing.plan_type,
          starts_at: existing.starts_at,
          expires_at: existing.expires_at,
        })
        .eq('id', existing.id)
    } else {
      await supabaseAdmin.from(DB.memberships).delete().eq('id', membershipId)
    }
    return {
      success: false,
      message: `会员开通失败：${orderError.message}`,
      status: 500,
    }
  }

  return {
    success: true,
    membershipId,
    orderId: order.id,
    orderNo: order.order_no,
    startsAt: membershipPayload.starts_at,
    expiresAt: expiresAt.toISOString(),
    amount,
    planType,
  }
}
