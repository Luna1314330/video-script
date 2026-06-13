import type { GeneratedScript, PackagingType, PlatformId, StrategyTopicItem } from '@/lib/types'
import { PACKAGING_TYPES } from '@/lib/types'
import { unwrapCozePayload } from '@/lib/coze/client'

function uid() {
  return `script-${Math.random().toString(36).slice(2, 9)}`
}

function normalizePackagingType(value: string, fallback: PackagingType): PackagingType {
  const trimmed = value.trim()
  if (PACKAGING_TYPES.includes(trimmed as PackagingType)) {
    return trimmed as PackagingType
  }
  const found = PACKAGING_TYPES.find((t) => trimmed.includes(t))
  return found ?? fallback
}

function extractTaggedSection(text: string, tag: string): string {
  const pattern = new RegExp(`【${tag}】\\s*([\\s\\S]*?)(?=\\n【|$)`)
  return text.match(pattern)?.[1]?.trim() ?? ''
}

function parseHashtags(text: string): string[] {
  return [...text.matchAll(/#[^\s#]+/g)].map((m) => m[0])
}

function parseScriptSections(body: string) {
  const sections: GeneratedScript['sections'] = []
  const parts = body.split(/(?=###\s+)/).filter(Boolean)

  for (const part of parts) {
    const headerMatch = part.match(/^###\s*([^\n]+)\n([\s\S]*)/)
    if (!headerMatch) continue

    const header = headerMatch[1].trim()
    const content = headerMatch[2].trim()
    const timestampMatch = header.match(/(\d+\s*-\s*\d+\s*秒|\d+\s*-\s*\d+s)/i)
    const narration = content.replace(/^（[^）]+）/, '').replace(/^"/, '').replace(/"$/, '').trim()

    sections.push({
      timestamp: timestampMatch?.[1] ?? header,
      narration: narration || content,
      visual: content.match(/^（([^）]+)/)?.[1] ?? '按脚本正文拍摄',
    })
  }

  return sections
}

function parseScriptText(
  text: string,
  selectedTopic: StrategyTopicItem,
  platformId: PlatformId
): GeneratedScript {
  const cleaned = text.trim()
  const title =
    extractTaggedSection(cleaned, '标题') ||
    selectedTopic.topic.slice(0, 40) + (selectedTopic.topic.length > 40 ? '...' : '')
  const body = extractTaggedSection(cleaned, '脚本正文') || cleaned
  const hook =
    extractTaggedSection(body, '开场') ||
    body.match(/###\s*开场[^\n]*\n([\s\S]*?)(?=###|$)/)?.[1]?.trim() ||
    extractTaggedSection(cleaned, '封面文案') ||
    selectedTopic.topic.slice(0, 80)
  const tagSection = extractTaggedSection(cleaned, '推荐标签')
  const hashtags = parseHashtags(tagSection)
  const cta =
    extractTaggedSection(body, '结尾互动') ||
    body.match(/###\s*结尾[^\n]*\n([\s\S]*?)(?=###|$)/)?.[1]?.trim() ||
    '评论区告诉我你的想法，觉得有用记得点赞收藏'

  return {
    id: uid(),
    contentItemId: selectedTopic.id,
    title,
    packagingType: normalizePackagingType(
      extractTaggedSection(cleaned, '主题分类') || selectedTopic.packagingType,
      selectedTopic.packagingType
    ),
    platformId,
    hook: hook.replace(/^["“]|["”]$/g, '').trim(),
    sections: parseScriptSections(body),
    fullText: cleaned,
    hashtags: hashtags.length > 0 ? hashtags : [`#${selectedTopic.packagingType}`],
    cta: cta.replace(/^["“]|["”]$/g, '').trim(),
  }
}

function findScriptTextInObject(obj: unknown, depth = 0): string | null {
  if (depth > 12) return null

  if (typeof obj === 'string') {
    if (obj.includes('【标题】') || obj.includes('【脚本正文】') || obj.includes('脚本正文')) {
      return obj
    }
    return null
  }

  if (Array.isArray(obj)) {
    for (const item of obj) {
      const found = findScriptTextInObject(item, depth + 1)
      if (found) return found
    }
    return null
  }

  if (obj && typeof obj === 'object') {
    for (const value of Object.values(obj)) {
      const found = findScriptTextInObject(value, depth + 1)
      if (found) return found
    }
  }

  return null
}

export function normalizeScriptResponse(
  data: unknown,
  selectedTopic: StrategyTopicItem,
  platformId: PlatformId
): GeneratedScript {
  const unwrapped = unwrapCozePayload(data)

  if (typeof unwrapped === 'string') {
    return parseScriptText(unwrapped, selectedTopic, platformId)
  }

  if (unwrapped && typeof unwrapped === 'object') {
    const obj = unwrapped as Record<string, unknown>

    if (obj.hook && obj.fullText && obj.title) {
      return {
        id: (obj.id as string) || uid(),
        contentItemId: selectedTopic.id,
        title: String(obj.title),
        packagingType: normalizePackagingType(
          String(obj.packagingType || selectedTopic.packagingType),
          selectedTopic.packagingType
        ),
        platformId: (obj.platformId as PlatformId) || platformId,
        hook: String(obj.hook),
        sections: (obj.sections as GeneratedScript['sections']) || [],
        fullText: String(obj.fullText),
        hashtags: (obj.hashtags as string[]) || [],
        cta: String(obj.cta || ''),
      }
    }

    const textCandidate = findScriptTextInObject(obj)
    if (textCandidate) {
      return parseScriptText(textCandidate, selectedTopic, platformId)
    }

    if (typeof obj.script === 'string' && obj.script.trim()) {
      return parseScriptText(obj.script, selectedTopic, platformId)
    }
  }

  throw new Error('脚本数据格式无法识别，请确认工作流输出包含【标题】【脚本正文】等字段')
}
