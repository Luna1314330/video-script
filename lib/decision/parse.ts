import type { DecisionFactorItem, DecisionFactors, PersonaDecisionFactors } from '@/lib/types'

function parseFactorItems(sectionBody: string): DecisionFactorItem[] {
  const items: DecisionFactorItem[] = []
  const lines = sectionBody
    .trim()
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (/^说明[：:]/.test(line)) {
      i++
      continue
    }
    const title = line
    i++
    let description = ''
    if (i < lines.length && /^说明[：:]/.test(lines[i])) {
      description = lines[i].replace(/^说明[：:]\s*/, '')
      i++
    }
    if (title) items.push({ title, description })
  }
  return items
}

function parsePersonaBlock(part: string): PersonaDecisionFactors | null {
  const trimmed = part.trim()
  if (!trimmed) return null

  const firstNewline = trimmed.indexOf('\n')
  const personaTitle = firstNewline === -1 ? trimmed : trimmed.slice(0, firstNewline).trim()
  const body = firstNewline === -1 ? '' : trimmed.slice(firstNewline + 1)

  const concernMatch = body.match(/核心关注领域[：:]\s*([\s\S]*?)(?=核心顾虑领域|$)/)
  const worryMatch = body.match(/核心顾虑领域[：:]\s*([\s\S]*?)$/)

  return {
    personaTitle,
    concerns: concernMatch ? parseFactorItems(concernMatch[1]) : [],
    worries: worryMatch ? parseFactorItems(worryMatch[1]) : [],
  }
}

/**
 * 解析 Coze 工作流返回的决策因素文本格式
 */
export function parseDecisionFactorsText(text: string): DecisionFactors {
  let cleaned = text.trim()
  const hasTitle = /^决策因素分析/.test(cleaned)
  cleaned = cleaned.replace(/^决策因素分析[：:]\s*/, '')
  cleaned = cleaned.replace(/(\S)【用户画像】/g, '$1\n【用户画像】')

  const parts = cleaned.split(/【用户画像】/).filter((p) => p.trim())
  const byPersona = parts
    .map(parsePersonaBlock)
    .filter((p): p is PersonaDecisionFactors => p !== null && Boolean(p.personaTitle))

  return {
    title: hasTitle ? '决策因素分析' : '决策因素分析',
    byPersona,
    rawText: text.trim(),
  }
}

export function normalizeDecisionFactorsResponse(data: unknown): DecisionFactors {
  if (typeof data === 'string') {
    const parsed = parseDecisionFactorsText(data)
    if (parsed.byPersona.length > 0) return parsed
    throw new Error('无法解析决策因素文本格式')
  }

  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>

    if (Array.isArray(obj.byPersona) && obj.byPersona.length > 0) {
      return {
        title: (obj.title as string) || '决策因素分析',
        byPersona: obj.byPersona as PersonaDecisionFactors[],
        rawText: obj.rawText as string | undefined,
      }
    }

    for (const key of ['output', 'data', 'result', 'content', 'text']) {
      if (obj[key]) return normalizeDecisionFactorsResponse(obj[key])
    }

    // 旧版结构迁移
    if (Array.isArray(obj.purchaseReasons) || Array.isArray(obj.purchaseBarriers)) {
      return {
        title: '决策因素分析',
        byPersona: [
          {
            personaTitle: '综合用户',
            concerns: (obj.purchaseReasons as DecisionFactorItem[]) ?? [],
            worries: (obj.purchaseBarriers as DecisionFactorItem[]) ?? [],
          },
        ],
      }
    }
  }

  throw new Error('决策因素数据格式无法识别')
}

export function getAllConcerns(factors: DecisionFactors): DecisionFactorItem[] {
  return factors.byPersona.flatMap((p) => p.concerns)
}

export function getAllWorries(factors: DecisionFactors): DecisionFactorItem[] {
  return factors.byPersona.flatMap((p) => p.worries)
}
