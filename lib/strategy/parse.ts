import type { ContentStrategyResult, PackagingType, StrategyTopicItem } from '@/lib/types'
import { PACKAGING_TYPES } from '@/lib/types'
import { unwrapCozePayload } from '@/lib/coze/client'

function uid() {
  return `topic-${Math.random().toString(36).slice(2, 9)}`
}

function normalizePackagingType(value: string): PackagingType {
  const trimmed = value.trim()
  if (PACKAGING_TYPES.includes(trimmed as PackagingType)) {
    return trimmed as PackagingType
  }
  const found = PACKAGING_TYPES.find((t) => trimmed.includes(t))
  return found ?? '认知型'
}

function extractInlineField(block: string, label: string): string {
  const pattern = new RegExp(`【${label}】\\s*([^【\\n]+)`)
  return block.match(pattern)?.[1]?.trim() ?? ''
}

function extractTopicField(block: string): string {
  const match = block.match(/【选题】\s*([\s\S]*?)(?=【用户画像】|$)/)
  return match?.[1]?.trim() ?? extractInlineField(block, '选题')
}

/**
 * 解析 Coze 内容策略工作流文本输出
 */
export function parseStrategyTopicsText(text: string): ContentStrategyResult {
  let cleaned = text.trim()

  // 兼容缺少开头【、或 literal \n
  cleaned = cleaned.replace(/\\n/g, '\n')
  cleaned = cleaned.replace(/^用户画像】/, '【用户画像】')
  if (!cleaned.includes('【用户画像】') && cleaned.includes('用户画像】')) {
    cleaned = cleaned.replace(/用户画像】/g, '【用户画像】')
  }
  if (!cleaned.startsWith('【用户画像】') && cleaned.includes('【用户画像】')) {
    cleaned = cleaned.slice(cleaned.indexOf('【用户画像】'))
  } else if (!cleaned.startsWith('【用户画像】')) {
    cleaned = `【用户画像】${cleaned}`
  }

  const blocks = cleaned.split(/(?=【用户画像】)/).filter((b) => b.trim())

  const topics: StrategyTopicItem[] = blocks
    .map((block) => {
      const personaTitle = extractInlineField(block, '用户画像')
      const contentMapTitle = extractInlineField(block, '内容地图')
      const packagingType = normalizePackagingType(extractInlineField(block, '主题分类'))
      const topic = extractTopicField(block)

      if (!personaTitle || !topic) return null

      return {
        id: uid(),
        personaTitle,
        contentMapTitle,
        packagingType,
        topic,
      }
    })
    .filter((t): t is StrategyTopicItem => t !== null)

  if (topics.length === 0) {
    throw new Error('无法从文本中解析出选题，请确认包含【用户画像】【选题】等字段')
  }

  const personas = [...new Set(topics.map((t) => t.personaTitle))]
  const contentMaps = [...new Set(topics.map((t) => t.contentMapTitle).filter(Boolean))]

  return {
    topics,
    personas,
    contentMaps,
    rawText: text.trim(),
  }
}

function findStrategyTextInObject(obj: unknown, depth = 0): string | null {
  if (depth > 10) return null

  if (typeof obj === 'string') {
    if (obj.includes('【用户画像】') || obj.includes('【选题】') || obj.includes('用户画像】')) {
      return obj
    }
    return null
  }

  if (Array.isArray(obj)) {
    for (const item of obj) {
      const found = findStrategyTextInObject(item, depth + 1)
      if (found) return found
    }
    return null
  }

  if (obj && typeof obj === 'object') {
    for (const value of Object.values(obj)) {
      const found = findStrategyTextInObject(value, depth + 1)
      if (found) return found
    }
  }

  return null
}

function normalizeTopicsArray(obj: Record<string, unknown>): ContentStrategyResult {
  const topics = (obj.topics as StrategyTopicItem[]).map((t, i) => ({
    id: t.id || `topic-${i}`,
    personaTitle: t.personaTitle,
    contentMapTitle: t.contentMapTitle || '',
    packagingType: normalizePackagingType(t.packagingType || '认知型'),
    topic: t.topic,
  }))

  return {
    topics,
    personas: (obj.personas as string[]) || [...new Set(topics.map((t) => t.personaTitle))],
    contentMaps:
      (obj.contentMaps as string[]) || [...new Set(topics.map((t) => t.contentMapTitle))],
    rawText: obj.rawText as string | undefined,
  }
}

export function normalizeContentStrategyResponse(data: unknown): ContentStrategyResult {
  const unwrapped = unwrapCozePayload(data)

  if (typeof unwrapped === 'string') {
    return parseStrategyTopicsText(unwrapped)
  }

  if (unwrapped && typeof unwrapped === 'object') {
    const obj = unwrapped as Record<string, unknown>

    if (Array.isArray(obj.topics) && obj.topics.length > 0) {
      return normalizeTopicsArray(obj)
    }

    const textCandidate = findStrategyTextInObject(obj)
    if (textCandidate) {
      return parseStrategyTopicsText(textCandidate)
    }
  }

  throw new Error(
    '内容策略数据格式无法识别。请确认工作流输出包含【用户画像】【内容地图】【主题分类】【选题】格式的文本'
  )
}
