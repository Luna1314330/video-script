import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // 测试 profiles 表
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1)

    // 测试 system_settings 表
    const { data: settings, error: settingsError } = await supabase
      .from('system_settings')
      .select('*')
      .limit(1)

    return NextResponse.json({
      success: true,
      message: 'Supabase 连接成功',
      data: {
        profiles: profiles || [],
        profilesError: profilesError?.message || null,
        settings: settings || [],
        settingsError: settingsError?.message || null,
      }
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Supabase 连接失败',
      error: error instanceof Error ? error.message : '未知错误'
    }, { status: 500 })
  }
}
