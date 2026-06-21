// Mock data for admin dashboard

export interface User {
  id: string
  phone: string
  nickname: string
  avatar?: string
  status: 'active' | 'banned'
  createdAt: string
  lastLoginAt: string
  membership?: {
    type: 'monthly' | 'quarterly' | 'yearly'
    expireAt: string
    status: 'active' | 'expired' | 'cancelled'
  }
}

export interface Order {
  id: string
  userId: string
  userPhone: string
  amount: number
  paymentMethod: 'wechat' | 'alipay' | 'card'
  status: 'pending' | 'paid' | 'refunded' | 'cancelled'
  createdAt: string
  paidAt?: string
  refundedAt?: string
  productName: string
}

export interface Membership {
  id: string
  userId: string
  userPhone: string
  userNickname: string
  type: 'monthly' | 'quarterly' | 'yearly'
  price: number
  startAt: string
  expireAt: string
  status: 'active' | 'expired' | 'cancelled'
  autoRenew: boolean
}

export interface DashboardStats {
  todayNewUsers: number
  todayOrders: number
  todayRevenue: number
  totalUsers: number
  totalMembers: number
  userGrowth: { date: string; count: number }[]
  revenueGrowth: { date: string; amount: number }[]
}

export interface SystemSettings {
  membership: {
    monthly: number
    quarterly: number
    yearly: number
  }
  freeGenerations: {
    daily: number
  }
}

// Mock users
export const mockUsers: User[] = [
  {
    id: '1',
    phone: '13800138001',
    nickname: '张三',
    status: 'active',
    createdAt: '2024-01-15 10:30:00',
    lastLoginAt: '2024-03-20 14:22:00',
    membership: { type: 'yearly', expireAt: '2025-01-15', status: 'active' },
  },
  {
    id: '2',
    phone: '13800138002',
    nickname: '李四',
    status: 'active',
    createdAt: '2024-02-10 09:15:00',
    lastLoginAt: '2024-03-19 18:45:00',
    membership: { type: 'monthly', expireAt: '2024-04-10', status: 'active' },
  },
  {
    id: '3',
    phone: '13800138003',
    nickname: '王五',
    status: 'banned',
    createdAt: '2024-01-20 11:00:00',
    lastLoginAt: '2024-03-15 20:30:00',
  },
]

// Mock orders
export const mockOrders: Order[] = [
  {
    id: 'ORD001',
    userId: '1',
    userPhone: '13800138001',
    amount: 299,
    paymentMethod: 'wechat',
    status: 'paid',
    createdAt: '2024-01-15 10:35:00',
    paidAt: '2024-01-15 10:36:00',
    productName: '年卡会员',
  },
  {
    id: 'ORD002',
    userId: '2',
    userPhone: '13800138002',
    amount: 39,
    paymentMethod: 'alipay',
    status: 'paid',
    createdAt: '2024-02-10 09:20:00',
    paidAt: '2024-02-10 09:21:00',
    productName: '月卡会员',
  },
  {
    id: 'ORD003',
    userId: '3',
    userPhone: '13800138003',
    amount: 99,
    paymentMethod: 'card',
    status: 'refunded',
    createdAt: '2024-01-20 11:05:00',
    paidAt: '2024-01-20 11:06:00',
    refundedAt: '2024-01-21 09:00:00',
    productName: '季卡会员',
  },
  {
    id: 'ORD004',
    userId: '4',
    userPhone: '13800138004',
    amount: 99,
    paymentMethod: 'wechat',
    status: 'paid',
    createdAt: '2024-03-01 08:50:00',
    paidAt: '2024-03-01 08:51:00',
    productName: '季卡会员',
  },
  {
    id: 'ORD005',
    userId: '5',
    userPhone: '13800138005',
    amount: 39,
    paymentMethod: 'alipay',
    status: 'pending',
    createdAt: '2024-03-20 09:35:00',
    productName: '月卡会员',
  },
]

// Mock memberships
export const mockMemberships: Membership[] = [
  {
    id: 'MB001',
    userId: '1',
    userPhone: '13800138001',
    userNickname: '张三',
    type: 'yearly',
    price: 299,
    startAt: '2024-01-15',
    expireAt: '2025-01-15',
    status: 'active',
    autoRenew: true,
  },
  {
    id: 'MB002',
    userId: '2',
    userPhone: '13800138002',
    userNickname: '李四',
    type: 'monthly',
    price: 39,
    startAt: '2024-03-10',
    expireAt: '2024-04-10',
    status: 'active',
    autoRenew: false,
  },
  {
    id: 'MB003',
    userId: '4',
    userPhone: '13800138004',
    userNickname: '赵六',
    type: 'quarterly',
    price: 99,
    startAt: '2024-03-01',
    expireAt: '2024-06-01',
    status: 'active',
    autoRenew: false,
  },
]

// Mock dashboard stats
export const mockDashboardStats: DashboardStats = {
  todayNewUsers: 12,
  todayOrders: 8,
  todayRevenue: 456,
  totalUsers: 1256,
  totalMembers: 328,
  userGrowth: [
    { date: '2024-03-14', count: 5 },
    { date: '2024-03-15', count: 8 },
    { date: '2024-03-16', count: 6 },
    { date: '2024-03-17', count: 12 },
    { date: '2024-03-18', count: 10 },
    { date: '2024-03-19', count: 9 },
    { date: '2024-03-20', count: 12 },
  ],
  revenueGrowth: [
    { date: '2024-03-14', amount: 198 },
    { date: '2024-03-15', amount: 356 },
    { date: '2024-03-16', amount: 234 },
    { date: '2024-03-17', amount: 567 },
    { date: '2024-03-18', amount: 423 },
    { date: '2024-03-19', amount: 389 },
    { date: '2024-03-20', amount: 456 },
  ],
}

// Mock system settings
export const mockSystemSettings: SystemSettings = {
  membership: {
    monthly: 39,
    quarterly: 99,
    yearly: 299,
  },
  freeGenerations: {
    daily: 3,
  },
}
