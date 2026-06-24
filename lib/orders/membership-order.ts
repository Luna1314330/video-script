import { eq } from 'drizzle-orm'
import type { AppDb } from '@/lib/db/index'
import { isActiveFlag, newId } from '@/lib/db/index'
import { memberships, orders, userProfiles } from '@/lib/db/schema'
import {
  applyMembershipPlan,
  type MembershipActivationResult,
} from '@/lib/activate-membership'
import { generateOrderNo } from '@/lib/db/tables'
import type { MembershipPlanType } from '@/lib/db/tables'
import { getMembershipPrice, isMembershipPlanEnabled } from '@/lib/site-settings'

function toMysqlDatetime(date: Date): string {
  return date.toISOString().slice(0, 19).replace('T', ' ')
}

type OrderFailure = {
  success: false
  message: string
  status: number
}

type PendingOrderSuccess = {
  success: true
  orderId: string
  orderNo: string
  amount: number
  planType: MembershipPlanType
  status: 'pending'
}

export async function createPendingMembershipOrder(
  db: AppDb,
  input: {
    userId: string
    planType: string
    paymentMethod?: 'wechat' | 'alipay'
  },
): Promise<PendingOrderSuccess | OrderFailure> {
  const { userId, planType } = input
  const paymentMethod = input.paymentMethod ?? 'wechat'

  if (!userId || !planType) {
    return { success: false, message: '缺少必要参数', status: 400 }
  }

  if (!isMembershipPlanEnabled(planType)) {
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
    return { success: false, message: '该用户已被禁用，无法购买会员', status: 403 }
  }

  const amount = getMembershipPrice(planType)
  const orderNo = generateOrderNo()
  const orderId = newId()
  const createdAt = toMysqlDatetime(new Date())

  try {
    await db.insert(orders).values({
      id: orderId,
      userId,
      orderNo,
      amount: String(amount),
      planType: planType as MembershipPlanType,
      paymentMethod,
      status: 'pending',
      paidAt: null,
      createdAt,
    })
  } catch (error) {
    console.error('创建待支付订单失败:', error)
    return {
      success: false,
      message: `创建订单失败：${error instanceof Error ? error.message : '未知错误'}`,
      status: 500,
    }
  }

  return {
    success: true,
    orderId,
    orderNo,
    amount,
    planType: planType as MembershipPlanType,
    status: 'pending',
  }
}

type FulfillSuccess = MembershipActivationResult & {
  success: true
  orderId: string
  orderNo: string
  alreadyPaid: boolean
}

export async function fulfillMembershipOrder(
  db: AppDb,
  input: {
    orderId?: string
    orderNo?: string
    paidAt?: Date
    wechatTransactionId?: string
  },
): Promise<FulfillSuccess | OrderFailure> {
  const { orderId, orderNo, paidAt, wechatTransactionId } = input

  if (!orderId && !orderNo) {
    return { success: false, message: '缺少订单标识', status: 400 }
  }

  const orderRows = await db
    .select()
    .from(orders)
    .where(orderId ? eq(orders.id, orderId) : eq(orders.orderNo, orderNo!))
    .limit(1)

  const order = orderRows[0]
  if (!order) {
    return { success: false, message: '订单不存在', status: 404 }
  }

  if (order.status === 'paid') {
    const membershipRows = await db
      .select()
      .from(memberships)
      .where(eq(memberships.userId, order.userId))
      .limit(1)

    const membership = membershipRows[0]
    return {
      success: true,
      alreadyPaid: true,
      orderId: order.id,
      orderNo: order.orderNo,
      membershipId: membership?.id ?? '',
      startsAt: membership?.startsAt ?? '',
      expiresAt: membership?.expiresAt ?? '',
      planType: (order.planType as MembershipPlanType) || 'monthly',
    }
  }

  if (order.status !== 'pending') {
    return { success: false, message: '订单状态不可支付', status: 400 }
  }

  if (!order.planType) {
    return { success: false, message: '订单缺少套餐信息', status: 400 }
  }

  const activation = await applyMembershipPlan(db, {
    userId: order.userId,
    type: order.planType,
  })

  if (!activation.success) {
    return activation
  }

  const paidAtStr = toMysqlDatetime(paidAt ?? new Date())

  await db
    .update(orders)
    .set({
      status: 'paid',
      paidAt: paidAtStr,
      wechatTransactionId: wechatTransactionId ?? null,
    })
    .where(eq(orders.id, order.id))

  return {
    success: true,
    alreadyPaid: false,
    orderId: order.id,
    orderNo: order.orderNo,
    membershipId: activation.membershipId,
    startsAt: activation.startsAt,
    expiresAt: activation.expiresAt,
    planType: activation.planType,
  }
}

export async function getMembershipOrderForUser(
  db: AppDb,
  userId: string,
  orderId: string,
) {
  const rows = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId))
    .limit(1)

  const order = rows[0]
  if (!order || order.userId !== userId) {
    return null
  }

  return order
}
