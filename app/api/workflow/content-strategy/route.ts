import { assertCozeConfigured, getCozeConfigFromEnv } from '@/lib/coze/config'
import { runCozeWorkflow } from '@/lib/coze/client'
import { buildContentStrategyParameters } from '@/lib/coze/parameters'
import { normalizeContentStrategyResponse } from '@/lib/strategy/parse'
import type { BasicInput } from '@/lib/types'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      basicInput: BasicInput
    }

    const { basicInput } = body

    if (!basicInput.industry?.trim() || !basicInput.product?.trim()) {
      return Response.json({ error: '请填写行业和产品名称' }, { status: 400 })
    }

    const config = getCozeConfigFromEnv()
    assertCozeConfigured(config, 'contentStrategy')

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
  } catch (error) {
    console.error('Content strategy error:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : '生成内容策略失败' },
      { status: 500 }
    )
  }
}
