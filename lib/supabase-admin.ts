import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { getReportBuffer, createWrappedFetch } from 'coze-coding-dev-sdk'

let envLoaded = false

function loadEnv(): void {
  if (envLoaded) return
  
  // 检查环境变量是否已加载
  if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
    envLoaded = true
    return
  }
  
  // 尝试从 dotenv 加载
  try {
    require('dotenv').config()
  } catch {}
  
  // 从 .env.local 文件读取
  try {
    const fs = require('fs')
    const path = require('path')
    const envPath = path.join(process.cwd(), '.env.local')
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8')
      content.split('\n').forEach((line: string) => {
        const match = line.match(/^([^=]+)=(.*)$/)
        if (match) {
          const key = match[1].trim()
          const value = match[2].trim().replace(/^['"]|['"]$/g, '')
          if (!process.env[key]) {
            process.env[key] = value
          }
        }
      })
    }
  } catch {}
  
  envLoaded = true
}

function getSupabaseClientInternal(): SupabaseClient {
  loadEnv()
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) {
    throw new Error('SUPABASE_URL is not set')
  }
  if (!anonKey && !serviceRoleKey) {
    throw new Error('SUPABASE_ANON_KEY is not set')
  }

  // 优先使用 service_role_key（绕过 RLS）
  const key = serviceRoleKey || anonKey

  const globalOptions: Record<string, any> = {}
  try {
    const buffer = getReportBuffer()
    if (buffer) {
      globalOptions.fetch = createWrappedFetch(buffer, 'supabase')
    }
  } catch {}

  return createClient(url, key, {
    global: globalOptions,
    db: {
      timeout: 60000,
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

// 导出管理员客户端（绕过 RLS）
export const supabaseAdmin: SupabaseClient = getSupabaseClientInternal()
