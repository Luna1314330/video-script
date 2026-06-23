import 'server-only'

import { drizzle, type MySql2Database } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import * as schema from '@/lib/db/schema'

export type AppDb = MySql2Database<typeof schema>

let pool: mysql.Pool | null = null
let cachedDb: AppDb | null | undefined

function loadEnvFile(fileName: string): void {
  try {
    const fs = require('fs')
    const path = require('path')
    const envPath = path.join(process.cwd(), fileName)
    if (!fs.existsSync(envPath)) return

    const content = fs.readFileSync(envPath, 'utf-8') as string
    for (const line of content.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const match = trimmed.match(/^([^=]+)=(.*)$/)
      if (!match) continue
      const key = match[1].trim()
      const value = match[2].trim().replace(/^['"]|['"]$/g, '')
      if (!process.env[key]) {
        process.env[key] = value
      }
    }
  } catch {
    // ignore
  }
}

function loadEnvFromLocalFile(): void {
  if (process.env.DATABASE_URL) return

  const envFiles =
    process.env.NODE_ENV === 'production'
      ? ['.env.production.local', '.env.production', '.env.local', '.env']
      : ['.env.local', '.env']

  for (const fileName of envFiles) {
    loadEnvFile(fileName)
    if (process.env.DATABASE_URL) return
  }
}

/** 将 MySQL 错误转为可展示的提示 */
export function formatDbError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)

  if (message.includes('ER_NO_SUCH_TABLE') || message.includes("doesn't exist")) {
    return '数据库表未初始化，请在 MySQL 执行 storage/database/schema.mysql.sql'
  }
  if (message.includes('ECONNREFUSED') || message.includes('ETIMEDOUT') || message.includes('ENOTFOUND')) {
    return '无法连接数据库，请检查 DATABASE_URL、安全组与白名单'
  }
  if (message.includes('Access denied')) {
    return '数据库账号或密码错误，请检查 DATABASE_URL（密码含特殊字符需 URL 编码）'
  }
  if (message.includes('Unknown database')) {
    return '数据库不存在，请检查 DATABASE_URL 中的库名'
  }

  return message
}

export function isDbConfigured(): boolean {
  loadEnvFromLocalFile()
  return Boolean(process.env.DATABASE_URL?.trim())
}

/** 懒加载 MySQL 连接；未配置 DATABASE_URL 时返回 null */
export function getDb(): AppDb | null {
  if (cachedDb !== undefined) return cachedDb

  loadEnvFromLocalFile()
  const url = process.env.DATABASE_URL?.trim()
  if (!url) {
    cachedDb = null
    return null
  }

  pool = mysql.createPool(url)
  cachedDb = drizzle(pool, { schema, mode: 'default' })
  return cachedDb
}

export function newId(): string {
  return crypto.randomUUID()
}

export function isActiveFlag(value: number | boolean | null | undefined): boolean {
  return value === 1 || value === true
}
