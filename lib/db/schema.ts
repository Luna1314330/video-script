import {
  char,
  datetime,
  decimal,
  index,
  json,
  mysqlTable,
  text,
  tinyint,
  varchar,
} from 'drizzle-orm/mysql-core'
import { sql } from 'drizzle-orm'

export const userProfiles = mysqlTable(
  'user_profiles',
  {
    id: char('id', { length: 36 }).primaryKey(),
    phone: varchar('phone', { length: 20 }).notNull().unique(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    nickname: varchar('nickname', { length: 50 }),
    isActive: tinyint('is_active').notNull().default(1),
    createdAt: datetime('created_at', { mode: 'string' })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index('user_profiles_phone_idx').on(table.phone)],
)

export const memberships = mysqlTable(
  'memberships',
  {
    id: char('id', { length: 36 }).primaryKey(),
    userId: char('user_id', { length: 36 }).notNull().unique(),
    status: varchar('status', { length: 20 }).notNull().default('free'),
    planType: varchar('plan_type', { length: 20 }),
    startsAt: datetime('starts_at', { mode: 'string' })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
    expiresAt: datetime('expires_at', { mode: 'string' }),
  },
  (table) => [
    index('memberships_user_id_idx').on(table.userId),
    index('memberships_status_idx').on(table.status),
  ],
)

export const orders = mysqlTable(
  'orders',
  {
    id: char('id', { length: 36 }).primaryKey(),
    userId: char('user_id', { length: 36 }).notNull(),
    orderNo: varchar('order_no', { length: 64 }).notNull().unique(),
    amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
    paymentMethod: varchar('payment_method', { length: 20 }).notNull(),
    status: varchar('status', { length: 20 }).notNull().default('pending'),
    paidAt: datetime('paid_at', { mode: 'string' }),
    createdAt: datetime('created_at', { mode: 'string' })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index('orders_user_id_idx').on(table.userId),
    index('orders_status_idx').on(table.status),
    index('orders_created_at_idx').on(table.createdAt),
  ],
)

export const generationLogs = mysqlTable(
  'generation_logs',
  {
    id: char('id', { length: 36 }).primaryKey(),
    userId: char('user_id', { length: 36 }).notNull(),
    action: varchar('action', { length: 20 }).notNull().default('script'),
    createdAt: datetime('created_at', { mode: 'string' })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index('generation_logs_user_created_idx').on(table.userId, table.createdAt)],
)

export const scriptHistory = mysqlTable(
  'script_history',
  {
    id: char('id', { length: 36 }).primaryKey(),
    userId: char('user_id', { length: 36 }).notNull(),
    industry: varchar('industry', { length: 100 }).notNull(),
    productName: varchar('product_name', { length: 200 }).notNull(),
    productDesc: text('product_desc'),
    shootScene: text('shoot_scene'),
    topic: text('topic').notNull(),
    generatedScript: text('generated_script'),
    createdAt: datetime('created_at', { mode: 'string' })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    index('script_history_user_id_idx').on(table.userId),
    index('script_history_created_at_idx').on(table.createdAt),
  ],
)

export const systemSettings = mysqlTable(
  'system_settings',
  {
    id: varchar('id', { length: 50 }).primaryKey(),
    value: json('value').notNull(),
    updatedAt: datetime('updated_at', { mode: 'string' })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [index('system_settings_id_idx').on(table.id)],
)
