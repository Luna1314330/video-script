import 'server-only'

import { drizzle, type MySql2Database } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import * as schema from '@/lib/db/schema'

export type AppDb = MySql2Database<typeof schema>

let pool: mysql.Pool | null = null
let cachedDb: AppDb | null | undefined

function loadEnvFromLocalFile(): void {
  if (process.env.DATABASE_URL) return

  try {
    const fs = require('fs')
    const path = require('path')
    const envPath = path.join(process.cwd(), '.env.local')
    if (!fs.existsSync(envPath)) return

    const content = fs.readFileSync(envPath, 'utf-8') as string
    for (const line of content.split('\n')) {
      const match = line.match(/^([^=]+)=(.*)$/)
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
