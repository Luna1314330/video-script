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

export interface MembershipPlan {
  price: number
  enabled: boolean
}

export interface SystemSettings {
  membership: {
    monthly: MembershipPlan
    quarterly: MembershipPlan
    yearly: MembershipPlan
  }
  freeGenerations: {
    daily: number
  }
  paymentMethods: {
    wechat: boolean
    alipay: boolean
  }
  smsNotification: boolean
}

export interface ScriptHistory {
  id: string
  userId: string
  userPhone: string
  industry: string
  productName: string
  productDesc?: string
  shootScene?: string
  topic: string
  generatedScript?: string
  createdAt: string
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
  totalRevenue: 25680,
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
    monthly: { price: 39, enabled: true },
    quarterly: { price: 99, enabled: true },
    yearly: { price: 299, enabled: true },
  },
  freeGenerations: {
    daily: 3,
  },
  paymentMethods: {
    wechat: true,
    alipay: false,
  },
  smsNotification: true,
}

// Mock script history
export const mockScriptHistory: ScriptHistory[] = [
  {
    id: '1',
    userId: '1',
    userPhone: '13800138001',
    industry: '餐饮',
    productName: '手工奶茶',
    productDesc: '采用新鲜牛奶和优质茶叶现场制作',
    shootScene: '店内制作过程',
    topic: '揭秘奶茶店不会告诉你的秘密',
    generatedScript: '【开场】画面：特写奶茶制作过程\n\n旁白：大家平时喝的奶茶，90%都是用奶茶粉冲泡的！\n\n【转折】画面：切换到我们的手工奶茶店\n\n旁白：但在我们的店里，每一杯都是用真正的新鲜牛奶和优质茶叶现场制作的。\n\n【产品展示】画面：展示原料和制作过程\n\n旁白：我们的茶叶来自福建安溪，每天下午新鲜配送。牛奶选用的是某某品牌纯牛奶。\n\n【结尾】画面：店铺门头和优惠信息\n\n旁白：现在进店消费，全场八折！地址就在...',
    createdAt: '2024-03-21 14:30:00',
  },
  {
    id: '2',
    userId: '2',
    userPhone: '13800138002',
    industry: '美妆',
    productName: '防晒霜',
    productDesc: 'SPF50+ 防水防汗，适合户外运动',
    topic: '夏天必买的防晒神器',
    generatedScript: '【场景】户外运动场景\n\n旁白：夏天出门，你还在为防晒发愁吗？\n\n【痛点】画面：阳光强烈照射\n\n旁白：普通防晒霜油腻粘腻，一出汗就花了。\n\n【产品介绍】画面：展示防晒霜\n\n旁白：今天给大家推荐这款SPF50+防晒霜，防水防汗，清爽不油腻。\n\n【使用展示】画面：挤出防晒霜涂抹\n\n旁白：轻轻一抹，3秒成膜，完全不粘腻。\n\n【结尾】画面：产品图\n\n旁白：点击下方链接购买，夏日必备！',
    createdAt: '2024-03-20 10:15:00',
  },
  {
    id: '3',
    userId: '1',
    userPhone: '13800138001',
    industry: '教育',
    productName: '少儿英语课程',
    productDesc: '3-12岁英语启蒙在线课程',
    shootScene: '课堂互动场景',
    topic: '孩子英语启蒙的黄金期',
    generatedScript: '【开场】画面：孩子学习英语的画面\n\n旁白：3-12岁，是孩子英语启蒙的黄金期。\n\n【问题】画面：家长辅导孩子作业的场景\n\n旁白：很多家长担心自己英语不好，没法教孩子。\n\n【解决方案】画面：在线课程界面\n\n旁白：我们的在线英语课程，专为3-12岁孩子设计，外教一对一辅导。\n\n【效果展示】画面：孩子自信说英语\n\n旁白：3个月后，孩子已经能自信地用英语交流了！\n\n【结尾】画面：优惠信息\n\n旁白：现在报名，享受首月免费！',
    createdAt: '2024-03-19 16:45:00',
  },
  {
    id: '4',
    userId: '3',
    userPhone: '13800138003',
    industry: '服装',
    productName: '运动休闲裤',
    topic: '这条裤子让你运动也能很时尚',
    generatedScript: '【开场】画面：运动场景\n\n旁白：运动时穿的裤子，又土又丑？\n\n【转折】画面：时尚运动风\n\n旁白：这条运动休闲裤，让你运动也能很时尚！\n\n【产品展示】画面：裤子特写\n\n旁白：冰丝面料，透气排汗，高弹不紧绷。侧边撞色设计，时尚感满满。\n\n【搭配展示】画面：多种搭配\n\n旁白：无论是运动健身，还是日常出行，都能轻松驾驭。\n\n【结尾】画面：产品链接\n\n旁白：点击下方链接选购，多色可选！',
    createdAt: '2024-03-18 09:20:00',
  },
]
