import {
  mockMemberships,
  mockOrders,
  mockScriptHistory,
  mockUsers,
} from '@/lib/admin-data'
import { mapAdminMembership, mapAdminOrder, mapAdminUser } from '@/lib/db/tables'
import {
  INITIAL_SITE_SETTINGS,
  toAdminApiPayload,
} from '@/lib/site-settings'

export function mockAdminUsersResponse() {
  return {
    success: true,
    data: mockUsers.map((u) =>
      mapAdminUser(
        {
          id: u.id,
          phone: u.phone,
          nickname: u.nickname,
          is_active: u.status !== 'banned',
          created_at: u.createdAt,
        },
        u.membership
          ? {
              status: u.membership.status,
              expires_at: u.membership.expireAt,
              plan_type: u.membership.type,
            }
          : { status: 'free', expires_at: null, plan_type: null },
      ),
    ),
  }
}

export function mockAdminMembershipsResponse() {
  return {
    success: true,
    data: mockMemberships.map((m) =>
      mapAdminMembership({
        id: m.id,
        user_id: m.userId,
        status: m.status,
        plan_type: m.type,
        starts_at: m.startAt,
        expires_at: m.expireAt,
        user_profiles: { phone: m.userPhone, nickname: m.userNickname },
      }),
    ),
  }
}

export function mockAdminOrdersResponse() {
  return {
    success: true,
    data: mockOrders.map((o) =>
      mapAdminOrder({
        id: o.id,
        user_id: o.userId,
        order_no: o.id,
        amount: o.amount,
        payment_method: o.paymentMethod,
        status: o.status,
        paid_at: o.paidAt,
        created_at: o.createdAt,
        user_profiles: { phone: o.userPhone, nickname: '' },
      }),
    ),
  }
}

export function mockAdminScriptsResponse() {
  return {
    success: true,
    data: mockScriptHistory.map((s) => ({
      id: s.id,
      userId: s.userId,
      phone: s.userPhone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'),
      industry: s.industry,
      productName: s.productName,
      productDesc: s.productDesc,
      shootScene: s.shootScene,
      topic: s.topic,
      generatedScript: s.generatedScript,
      createdAt: s.createdAt,
    })),
  }
}

export function mockAdminSettingsResponse() {
  return {
    success: true,
    data: toAdminApiPayload(INITIAL_SITE_SETTINGS),
  }
}
