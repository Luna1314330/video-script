import { getCozeConfigFromEnv, mergeCozeConfig, shouldCallCoze } from '@/lib/coze/config'
import { runCozeWorkflow } from '@/lib/coze/client'
import { buildContentStrategyParameters } from '@/lib/coze/parameters'
import { generateMockContentStrategy } from '@/lib/mock/generators'
import { normalizeContentStrategyResponse } from '@/lib/strategy/parse'
import type { BasicInput, CozeWorkflowConfig } from '@/lib/types'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      basicInput: BasicInput
      cozeConfig?: CozeWorkflowConfig
    }

    const { basicInput, cozeConfig } = body

    if (!basicInput.industry?.trim() || !basicInput.product?.trim()) {
      return Response.json({ error: '请填写行业和产品名称' }, { status: 400 })
    }

    const config = mergeCozeConfig(cozeConfig, getCozeConfigFromEnv())

    if (shouldCallCoze(config, 'contentStrategy')) {
      const raw = await runCozeWorkflow<unknown>({
        config,
        workflowId: config.workflowIds.contentStrategy,
        parameters: buildContentStrategyParameters(basicInput),
      })
      try {
        const contentStrategy = normalizeContentStrategyResponse(raw)
        return Response.json({ contentStrategy, source: 'coze' })
      } catch (parseError) {
        console.error('Coze raw response:', JSON.stringify(raw).slice(0, 2000))
        throw parseError
      }
    }

    await new Promise((r) => setTimeout(r, 2500))
    const contentStrategy = generateMockContentStrategy(basicInput)
    return Response.json({ contentStrategy, source: 'mock' })
  } catch (error) {
    console.error('Content strategy error:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : '生成内容策略失败' },
      { status: 500 }
    )
  }
}
