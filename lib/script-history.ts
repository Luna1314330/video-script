import type { SupabaseClient } from '@supabase/supabase-js'
import { DB } from '@/lib/db/tables'
import type {
  BasicInput,
  GeneratedScript,
  GenerationHistoryEntry,
  StrategyTopicItem,
} from '@/lib/types'
import { DEFAULT_PLATFORM_ID, PACKAGING_TYPES } from '@/lib/types'

export const SCRIPT_HISTORY_PAYLOAD_VERSION = 1

export type ScriptHistoryPayload = {
  version: typeof SCRIPT_HISTORY_PAYLOAD_VERSION
  script: GeneratedScript
  basicInput: BasicInput
  selectedTopic: StrategyTopicItem
}

type ScriptHistoryRow = {
  id: string
  user_id: string
  industry: string
  product_name: string
  product_desc?: string | null
  shoot_scene?: string | null
  topic: string
  generated_script?: string | null
  created_at?: string | null
}

export function parseScriptHistoryPayload(
  raw: string | null | undefined,
): { fullText: string; payload: ScriptHistoryPayload | null } {
  if (!raw?.trim()) {
    return { fullText: '', payload: null }
  }

  try {
    const parsed = JSON.parse(raw) as ScriptHistoryPayload
    if (
      parsed?.version === SCRIPT_HISTORY_PAYLOAD_VERSION &&
      parsed.script &&
      parsed.basicInput &&
      parsed.selectedTopic
    ) {
      return { fullText: parsed.script.fullText || raw, payload: parsed }
    }
  } catch {
    // 旧数据或非 JSON 纯文本
  }

  return { fullText: raw, payload: null }
}

export function mapScriptHistoryEntry(row: ScriptHistoryRow): GenerationHistoryEntry {
  const { payload } = parseScriptHistoryPayload(row.generated_script)

  if (payload) {
    return {
      id: row.id,
      createdAt: row.created_at || new Date().toISOString(),
      basicInput: payload.basicInput,
      selectedTopic: payload.selectedTopic,
      script: payload.script,
    }
  }

  const basicInput: BasicInput = {
    industry: row.industry,
    product: row.product_name,
    productDescription: row.product_desc || '',
    scene: row.shoot_scene || '',
  }

  const selectedTopic: StrategyTopicItem = {
    id: row.id,
    topic: row.topic,
    personaTitle: '',
    contentMapTitle: '',
    packagingType: PACKAGING_TYPES[0],
  }

  const script: GeneratedScript = {
    id: row.id,
    contentItemId: row.id,
    title: row.topic,
    packagingType: PACKAGING_TYPES[0],
    platformId: DEFAULT_PLATFORM_ID,
    hook: '',
    sections: [],
    fullText: row.generated_script || '',
    hashtags: [],
    cta: '',
  }

  return {
    id: row.id,
    createdAt: row.created_at || new Date().toISOString(),
    basicInput,
    selectedTopic,
    script,
  }
}

export async function persistScriptHistory(
  supabaseAdmin: SupabaseClient,
  userId: string,
  input: {
    basicInput: BasicInput
    selectedTopic: StrategyTopicItem
    script: GeneratedScript
  },
): Promise<{ id: string; createdAt: string } | null> {
  const payload: ScriptHistoryPayload = {
    version: SCRIPT_HISTORY_PAYLOAD_VERSION,
    script: input.script,
    basicInput: input.basicInput,
    selectedTopic: input.selectedTopic,
  }

  const { data, error } = await supabaseAdmin
    .from(DB.scriptHistory)
    .insert({
      user_id: userId,
      industry: input.basicInput.industry.trim(),
      product_name: input.basicInput.product.trim(),
      product_desc: input.basicInput.productDescription?.trim() || null,
      shoot_scene: input.basicInput.scene?.trim() || null,
      topic: input.selectedTopic.topic.trim(),
      generated_script: JSON.stringify(payload),
    })
    .select('id, created_at')
    .single()

  if (error) {
    console.error('保存脚本历史失败:', error)
    return null
  }

  return {
    id: data.id as string,
    createdAt: (data.created_at as string) || new Date().toISOString(),
  }
}

export async function listUserScriptHistory(
  supabaseAdmin: SupabaseClient,
  userId: string,
  options: { page?: number; pageSize?: number } = {},
): Promise<{
  items: GenerationHistoryEntry[]
  total: number
  page: number
  pageSize: number
}> {
  const page = Math.max(1, options.page ?? 1)
  const pageSize = Math.min(100, Math.max(1, options.pageSize ?? 50))
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  const { data, error, count } = await supabaseAdmin
    .from(DB.scriptHistory)
    .select('id, user_id, industry, product_name, product_desc, shoot_scene, topic, generated_script, created_at', {
      count: 'exact',
    })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to)

  if (error) {
    throw new Error(error.message)
  }

  return {
    items: (data || []).map((row) => mapScriptHistoryEntry(row as ScriptHistoryRow)),
    total: count ?? 0,
    page,
    pageSize,
  }
}

export async function deleteUserScriptHistory(
  supabaseAdmin: SupabaseClient,
  userId: string,
  id: string,
): Promise<boolean> {
  const { error, count } = await supabaseAdmin
    .from(DB.scriptHistory)
    .delete({ count: 'exact' })
    .eq('id', id)
    .eq('user_id', userId)

  if (error) {
    throw new Error(error.message)
  }

  return (count ?? 0) > 0
}
