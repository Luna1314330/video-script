import { createClient, SupabaseClient } from '@supabase/supabase-js'

let envLoaded = false

function loadEnv(): void {
  if (envLoaded) return

  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    envLoaded = true
    return
  }

  try {
    require('dotenv').config()
  } catch {}

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

export function isSupabaseAuthConfigured(): boolean {
  loadEnv()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
  return !!(url && anonKey)
}

let cachedAuthClient: SupabaseClient | null | undefined

/** 用于 signIn / getUser 的 anon 客户端 */
export function getSupabaseAuthClient(): SupabaseClient | null {
  if (cachedAuthClient !== undefined) return cachedAuthClient
  if (!isSupabaseAuthConfigured()) {
    cachedAuthClient = null
    return null
  }

  loadEnv()
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL!
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY!

  cachedAuthClient = createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
  return cachedAuthClient
}
