import { and, count, desc, eq, like, or } from 'drizzle-orm'
import type { AppDb } from '@/lib/db/index'
import { newId } from '@/lib/db/index'
import { scriptHistory } from '@/lib/db/schema'
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

function toHistoryRow(row: {
  id: string
  userId: string
  industry: string
  productName: string
  productDesc: string | null
  shootScene: string | null
  topic: string
  generatedScript: string | null
  createdAt: string
}): ScriptHistoryRow {
  return {
    id: row.id,
    user_id: row.userId,
    industry: row.industry,
    product_name: row.productName,
    product_desc: row.productDesc,
    shoot_scene: row.shootScene,
    topic: row.topic,
    generated_script: row.generatedScript,
    created_at: row.createdAt,
  }
}

export async function persistScriptHistory(
  db: AppDb,
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

  const id = newId()
  const createdAt = new Date().toISOString().slice(0, 19).replace('T', ' ')

  try {
    await db.insert(scriptHistory).values({
      id,
      userId,
      industry: input.basicInput.industry.trim(),
      productName: input.basicInput.product.trim(),
      productDesc: input.basicInput.productDescription?.trim() || null,
      shootScene: input.basicInput.scene?.trim() || null,
      topic: input.selectedTopic.topic.trim(),
      generatedScript: JSON.stringify(payload),
      createdAt,
    })
  } catch (error) {
    console.error('保存脚本历史失败:', error)
    return null
  }

  return { id, createdAt }
}

export async function listUserScriptHistory(
  db: AppDb,
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
  const offset = (page - 1) * pageSize

  const whereClause = eq(scriptHistory.userId, userId)

  const [countRows, data] = await Promise.all([
    db.select({ value: count() }).from(scriptHistory).where(whereClause),
    db
      .select()
      .from(scriptHistory)
      .where(whereClause)
      .orderBy(desc(scriptHistory.createdAt))
      .limit(pageSize)
      .offset(offset),
  ])

  return {
    items: data.map((row) => mapScriptHistoryEntry(toHistoryRow(row))),
    total: Number(countRows[0]?.value ?? 0),
    page,
    pageSize,
  }
}

export async function deleteUserScriptHistory(
  db: AppDb,
  userId: string,
  id: string,
): Promise<boolean> {
  const result = await db
    .delete(scriptHistory)
    .where(and(eq(scriptHistory.id, id), eq(scriptHistory.userId, userId)))

  const affected = (result as unknown as [{ affectedRows?: number }])[0]?.affectedRows ?? 0
  return affected > 0
}

export async function listAdminScriptHistory(
  db: AppDb,
  keyword: string,
): Promise<ScriptHistoryRow[]> {
  const baseQuery = db
    .select()
    .from(scriptHistory)
    .orderBy(desc(scriptHistory.createdAt))
    .limit(100)

  const trimmed = keyword.trim()
  if (!trimmed) {
    const rows = await baseQuery
    return rows.map(toHistoryRow)
  }

  const pattern = `%${trimmed}%`
  const rows = await db
    .select()
    .from(scriptHistory)
    .where(
      or(
        like(scriptHistory.productName, pattern),
        like(scriptHistory.industry, pattern),
        like(scriptHistory.topic, pattern),
      ),
    )
    .orderBy(desc(scriptHistory.createdAt))
    .limit(100)

  return rows.map(toHistoryRow)
}
