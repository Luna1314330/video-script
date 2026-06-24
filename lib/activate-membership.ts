import { eq } from 'drizzle-orm'
import type { AppDb } from '@/lib/db/index'
import { isActiveFlag, newId } from '@/lib/db/index'
import { memberships, orders, userProfiles } from '@/lib/db/schema'
import { generateOrderNo } from '@/lib/db/tables'
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
  source?: 'admin' | 'user'
  paymentMethod?: 'wechat' | 'alipay' | 'manual'
}

export type MembershipActivationResult = {
  success: true
  membershipId: string
  startsAt: string
  expiresAt: string
  planType: MembershipPlanType
}

type ActivateMembershipFailure = {
  success: false
  message: string
  status: number
}

type ActivateMembershipSuccess = MembershipActivationResult & {
  orderId: string
  orderNo: string
  amount: number
}

function toMysqlDatetime(date: Date): string {
  return date.toISOString().slice(0, 19).replace('T', ' ')
}

/** 仅更新会员状态，不创建订单（支付回调 / 履约时使用） */
export async function applyMembershipPlan(
  db: AppDb,
  input: { userId: string; type: MembershipPlanType | string },
): Promise<MembershipActivationResult | ActivateMembershipFailure> {
  const { userId, type } = input

  if (!userId || !type) {
    return { success: false, message: '缺少必要参数', status: 400 }
  }

  if (!isMembershipPlanEnabled(type)) {
    return { success: false, message: '该会员套餐暂未开放', status: 400 }
  }

  const profileRows = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.id, userId))
    .limit(1)

  const profile = profileRows[0]
  if (!profile) {
    return { success: false, message: '用户不存在', status: 404 }
  }

  if (!isActiveFlag(profile.isActive)) {
    return { success: false, message: '该用户已被禁用，无法开通会员', status: 403 }
  }

  const now = new Date()
  const startsAt = toMysqlDatetime(now)
  let expiresAt = extendMembershipExpireDate(now, type)

  const existingRows = await db
    .select()
    .from(memberships)
    .where(eq(memberships.userId, userId))
    .limit(1)

  const existing = existingRows[0]

  const shouldRenewFromCurrent =
    existing?.status === 'active' &&
    existing.expiresAt &&
    new Date(existing.expiresAt) > now

  if (shouldRenewFromCurrent && existing.expiresAt) {
    expiresAt = extendMembershipExpireDate(new Date(existing.expiresAt), type)
  }

  const planType = type as MembershipPlanType
  const expiresAtStr = toMysqlDatetime(expiresAt)
  const membershipPayload = {
    status: 'active' as const,
    planType,
    startsAt:
      !existing ||
      existing.status === 'free' ||
      existing.status === 'cancelled' ||
      existing.status === 'expired'
        ? startsAt
        : existing.startsAt || startsAt,
    expiresAt: expiresAtStr,
  }

  let membershipId: string

  if (existing) {
    membershipId = existing.id
    await db
      .update(memberships)
      .set(membershipPayload)
      .where(eq(memberships.id, existing.id))
  } else {
    membershipId = newId()
    await db.insert(memberships).values({
      id: membershipId,
      userId,
      ...membershipPayload,
    })
  }

  return {
    success: true,
    membershipId,
    startsAt: membershipPayload.startsAt,
    expiresAt: expiresAtStr,
    planType,
  }
}

/** 管理员手动开通：立即创建已支付订单并激活会员 */
export async function activateUserMembership(
  db: AppDb,
  input: ActivateMembershipInput,
): Promise<ActivateMembershipSuccess | ActivateMembershipFailure> {
  const { userId, type } = input
  const source = input.source ?? 'user'

  const activation = await applyMembershipPlan(db, { userId, type })
  if (!activation.success) {
    return activation
  }

  const amount = source === 'admin' ? 0 : getMembershipPrice(type)
  const paymentMethod =
    input.paymentMethod ?? (source === 'admin' ? 'manual' : 'wechat')
  const orderNo = source === 'admin' ? `MAN${generateOrderNo()}` : generateOrderNo()
  const orderId = newId()
  const startsAt = activation.startsAt

  const existingRows = await db
    .select()
    .from(memberships)
    .where(eq(memberships.userId, userId))
    .limit(1)

  const existing = existingRows[0]

  try {
    await db.insert(orders).values({
      id: orderId,
      userId,
      orderNo,
      amount: String(amount),
      planType: activation.planType,
      paymentMethod,
      status: 'paid',
      paidAt: startsAt,
      createdAt: startsAt,
    })
  } catch (error) {
    console.error('创建订单失败:', error)
    if (existing) {
      await db
        .update(memberships)
        .set({
          status: existing.status,
          planType: existing.planType,
          startsAt: existing.startsAt,
          expiresAt: existing.expiresAt,
        })
        .where(eq(memberships.id, existing.id))
    } else {
      await db.delete(memberships).where(eq(memberships.id, activation.membershipId))
    }
    return {
      success: false,
      message: `会员开通失败：${error instanceof Error ? error.message : '未知错误'}`,
      status: 500,
    }
  }

  return {
    success: true,
    membershipId: activation.membershipId,
    orderId,
    orderNo,
    startsAt: activation.startsAt,
    expiresAt: activation.expiresAt,
    amount,
    planType: activation.planType,
  }
}
