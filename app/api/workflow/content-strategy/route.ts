import {
  assertCozeConfigured,
  getCozeConfigFromEnv,
} from '@/lib/coze/config'
import { pollCozeWorkflowOnce, startCozeWorkflow } from '@/lib/coze/client'
import { buildContentStrategyParameters } from '@/lib/coze/parameters'
import { normalizeContentStrategyResponse } from '@/lib/strategy/parse'
import type { BasicInput } from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      basicInput?: BasicInput
      executeId?: string
    }

    const config = getCozeConfigFromEnv()
    assertCozeConfigured(config)
    const workflowId = config.workflowIds.contentStrategy

    if (body.executeId) {
      const poll = await pollCozeWorkflowOnce({
        config,
        workflowId,
        executeId: body.executeId,
      })

      if (poll.status === 'Running') {
        return Response.json({ status: 'running' })
      }

      if (poll.status === 'Fail') {
        return Response.json(
          { error: poll.error || 'Coze 工作流执行失败' },
          { status: 500 }
        )
      }

      try {
        const contentStrategy = normalizeContentStrategyResponse(poll.output)
        return Response.json({ contentStrategy, source: 'coze' })
      } catch (parseError) {
        console.error('Coze raw response:', JSON.stringify(poll.output).slice(0, 2000))
        throw parseError
      }
    }

    const { basicInput } = body

    if (!basicInput?.industry?.trim() || !basicInput?.product?.trim()) {
      return Response.json({ error: '请填写行业和产品名称' }, { status: 400 })
    }

    const start = await startCozeWorkflow({
      config,
      workflowId,
      parameters: buildContentStrategyParameters(basicInput),
    })

    if ('immediate' in start) {
      const contentStrategy = normalizeContentStrategyResponse(start.immediate)
      return Response.json({ contentStrategy, source: 'coze' })
    }

    return Response.json({ status: 'running', executeId: start.executeId })
  } catch (error) {
    console.error('Content strategy error:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : '生成内容策略失败' },
      { status: 500 }
    )
  }
}
