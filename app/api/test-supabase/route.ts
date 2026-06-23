import { NextResponse } from 'next/server'
import { DB } from '@/lib/db/tables'
import { ensureSiteSettingsHydrated, SYSTEM_SETTINGS_TABLE } from '@/lib/site-settings'
import { supabase } from '@/lib/supabase'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function GET() {
  try {
    const { data: profiles, error: profilesError } = await supabase
      .from(DB.userProfiles)
      .select('id, phone, nickname, is_active, created_at')
      .limit(1)

    const { data: memberships, error: membershipsError } = await supabase
      .from(DB.memberships)
      .select('id, user_id, status, plan_type, starts_at, expires_at')
      .limit(1)

    const { data: settings, error: settingsError } = await supabase
      .from(SYSTEM_SETTINGS_TABLE)
      .select('id, value, updated_at')
      .limit(5)

    const supabaseAdmin = getSupabaseAdmin()
    let hydrated = null
    if (supabaseAdmin) {
      hydrated = await ensureSiteSettingsHydrated(supabaseAdmin)
    }

    return NextResponse.json({
      success: true,
      message: 'Supabase 连接成功',
      data: {
        userProfiles: profiles || [],
        userProfilesError: profilesError?.message || null,
        memberships: memberships || [],
        membershipsError: membershipsError?.message || null,
        systemSettings: settings || [],
        systemSettingsError: settingsError?.message || null,
        settingsHydrated: hydrated,
      },
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Supabase 连接失败',
      error: error instanceof Error ? error.message : '未知错误',
    }, { status: 500 })
  }
}
