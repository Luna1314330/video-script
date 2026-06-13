import type { PersonaAnalysis, PersonaProfile } from '@/lib/types'

const FIELD_LABELS = ['年龄', '用户特征', '使用场景', '核心需求'] as const

function extractField(body: string, field: string): string {
  const pattern = new RegExp(
    `${field}[：:]\\s*([\\s\\S]*?)(?=\\n(?:${FIELD_LABELS.join('|')})[：:]|$)`
  )
  return body.match(pattern)?.[1]?.trim() ?? ''
}

/**
 * 解析 Coze 工作流返回的文本格式，例如：
 * [用户画像 1]：精致育儿宝妈
 * 年龄：25-35 岁
 * 用户特征：...
 */
export function parsePersonaText(text: string): PersonaAnalysis {
  let cleaned = text.trim()

  const hasTitle = /^用户画像分析/.test(cleaned)
  cleaned = cleaned.replace(/^用户画像分析[：:]\s*/, '')
  cleaned = cleaned.replace(/(\S)\[用户画像/g, '$1\n[用户画像')

  const profiles: PersonaProfile[] = []
  const blockRegex =
    /\[用户画像\s*(\d+)\][：:]\s*([^\n]+)\n([\s\S]*?)(?=\n\[用户画像\s*\d+\]|$)/g
  let match: RegExpExecArray | null

  while ((match = blockRegex.exec(cleaned)) !== null) {
    const body = match[3].trim()
    profiles.push({
      index: parseInt(match[1], 10),
      title: match[2].trim(),
      ageRange: extractField(body, '年龄'),
      characteristics: extractField(body, '用户特征'),
      usageScenario: extractField(body, '使用场景'),
      coreNeeds: extractField(body, '核心需求'),
    })
  }

  const titleMatch = cleaned.match(/^用户画像分析[：:]?\s*/)
  const title = hasTitle || titleMatch ? '用户画像分析' : '用户画像分析'

  return {
    title,
    profiles,
    rawText: cleaned,
  }
}

export function normalizePersonaResponse(data: unknown): PersonaAnalysis {
  if (typeof data === 'string') {
    const parsed = parsePersonaText(data)
    if (parsed.profiles.length > 0) return parsed
    throw new Error('无法解析用户画像文本格式')
  }

  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>

    // 已是标准结构
    if (Array.isArray(obj.profiles) && obj.profiles.length > 0) {
      return {
        title: (obj.title as string) || '用户画像分析',
        profiles: obj.profiles as PersonaProfile[],
        rawText: obj.rawText as string | undefined,
      }
    }

    // Coze 可能包在 output / data / result 字段
    for (const key of ['output', 'data', 'result', 'content', 'text']) {
      if (obj[key]) {
        return normalizePersonaResponse(obj[key])
      }
    }

    // 旧版单画像结构迁移
    if ('name' in obj && 'ageRange' in obj) {
      return {
        title: '用户画像分析',
        profiles: [
          {
            index: 1,
            title: String(obj.name),
            ageRange: String(obj.ageRange ?? ''),
            characteristics: String(obj.occupation ?? obj.lifestyle ?? ''),
            usageScenario: Array.isArray(obj.mediaHabits)
              ? (obj.mediaHabits as string[]).join('；')
              : String(obj.lifestyle ?? ''),
            coreNeeds: Array.isArray(obj.goals)
              ? (obj.goals as string[]).join('；')
              : String(obj.summary ?? ''),
          },
        ],
      }
    }
  }

  throw new Error('用户画像数据格式无法识别')
}

export function formatPersonaAsText(analysis: PersonaAnalysis): string {
  if (analysis.rawText) return analysis.rawText

  const blocks = analysis.profiles
    .map(
      (p) =>
        `[用户画像 ${p.index}]：${p.title}\n年龄：${p.ageRange}\n用户特征：${p.characteristics}\n使用场景：${p.usageScenario}\n核心需求：${p.coreNeeds}`
    )
    .join('\n')

  return `${analysis.title}：\n${blocks}`
}

export function getPrimaryProfile(analysis: PersonaAnalysis): PersonaProfile {
  return analysis.profiles[0]
}

export function getPersonaTitles(analysis: PersonaAnalysis): string {
  return analysis.profiles.map((p) => p.title).join('、')
}
