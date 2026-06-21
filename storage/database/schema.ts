import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, jsonb, index, uuid, date, numeric } from "drizzle-orm/pg-core";
import { createSchemaFactory } from "drizzle-zod";
import { z } from "zod";

// 用户扩展信息表（关联 auth.users）
export const profiles = pgTable(
  "profiles",
  {
    id: uuid("id").primaryKey().references(() => authUsers.id, { onDelete: "cascade" }),
    phone: varchar("phone", { length: 20 }).unique(),
    nickname: varchar("nickname", { length: 50 }),
    avatar: varchar("avatar", { length: 500 }),
    status: varchar("status", { length: 20 }).default("active").notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("profiles_phone_idx").on(table.phone),
    index("profiles_status_idx").on(table.status),
  ]
);

// 会员表
export const memberships = pgTable(
  "memberships",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    user_id: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 20 }).notNull(), // monthly, quarterly, yearly
    status: varchar("status", { length: 20 }).default("active").notNull(), // active, expired, cancelled
    start_at: date("start_at").notNull(),
    expire_at: date("expire_at").notNull(),
    auto_renew: boolean("auto_renew").default(false).notNull(),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("memberships_user_id_idx").on(table.user_id),
    index("memberships_status_idx").on(table.status),
    index("memberships_expire_at_idx").on(table.expire_at),
  ]
);

// 订单表
export const orders = pgTable(
  "orders",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    user_id: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
    product_name: varchar("product_name", { length: 100 }).notNull(),
    amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
    payment_method: varchar("payment_method", { length: 20 }).notNull(), // wechat, alipay, card
    status: varchar("status", { length: 20 }).default("pending").notNull(), // pending, paid, refunded, cancelled
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    paid_at: timestamp("paid_at", { withTimezone: true }),
    refunded_at: timestamp("refunded_at", { withTimezone: true }),
  },
  (table) => [
    index("orders_user_id_idx").on(table.user_id),
    index("orders_status_idx").on(table.status),
    index("orders_created_at_idx").on(table.created_at),
  ]
);

// 系统设置表
export const systemSettings = pgTable(
  "system_settings",
  {
    id: varchar("id", { length: 50 }).primaryKey(),
    value: jsonb("value").notNull(),
    updated_at: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("system_settings_id_idx").on(table.id),
  ]
);

// 脚本历史表
export const scriptHistory = pgTable(
  "script_history",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    user_id: uuid("user_id").notNull().references(() => profiles.id, { onDelete: "cascade" }),
    industry: varchar("industry", { length: 100 }).notNull(),
    product_name: varchar("product_name", { length: 200 }).notNull(),
    product_desc: text("product_desc"),
    shoot_scene: text("shoot_scene"),
    topic: text("topic").notNull(),
    generated_script: text("generated_script"),
    created_at: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("script_history_user_id_idx").on(table.user_id),
    index("script_history_created_at_idx").on(table.created_at),
  ]
);

// Supabase Auth users 表引用（只读）
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const authUsers = pgTable("auth.users", {
  id: uuid("id").primaryKey(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 20 }),
  created_at: timestamp("created_at", { withTimezone: true }),
  updated_at: timestamp("updated_at", { withTimezone: true }),
  email_confirmed_at: timestamp("email_confirmed_at", { withTimezone: true }),
  phone_confirmed_at: timestamp("phone_confirmed_at", { withTimezone: true }),
});

// Zod Schemas
const { createInsertSchema: createProfilesInsertSchema } = createSchemaFactory({ coerce: { date: true } });
export const insertProfileSchema = createProfilesInsertSchema(profiles).omit({ created_at: true, updated_at: true });
export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;

const { createInsertSchema: createMembershipInsertSchema } = createSchemaFactory({ coerce: { date: true } });
export const insertMembershipSchema = createMembershipInsertSchema(memberships).omit({ created_at: true, updated_at: true });
export type Membership = typeof memberships.$inferSelect;
export type InsertMembership = z.infer<typeof insertMembershipSchema>;

const { createInsertSchema: createOrderInsertSchema } = createSchemaFactory({ coerce: { date: true } });
export const insertOrderSchema = createOrderInsertSchema(orders).omit({ created_at: true, paid_at: true, refunded_at: true });
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;

export const insertSystemSettingSchema = createSchemaFactory({ coerce: { date: true } }).createInsertSchema(systemSettings);
export type SystemSetting = typeof systemSettings.$inferSelect;
export type InsertSystemSetting = z.infer<typeof insertSystemSettingSchema>;

const { createInsertSchema: createScriptHistoryInsertSchema } = createSchemaFactory({ coerce: { date: true } });
export const insertScriptHistorySchema = createScriptHistoryInsertSchema(scriptHistory).omit({ created_at: true });
export type ScriptHistory = typeof scriptHistory.$inferSelect;
export type InsertScriptHistory = z.infer<typeof insertScriptHistorySchema>;
