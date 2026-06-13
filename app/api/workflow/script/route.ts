import { assertCozeConfigured, getCozeConfigFromEnv } from '@/lib/coze/config'
import { pollCozeWorkflowOnce, startCozeWorkflow } from '@/lib/coze/client'
import { buildScriptWorkflowParameters } from '@/lib/coze/parameters'
import { normalizeScriptResponse } from '@/lib/script/parse'
import {
  BasicInput,
  ContentStrategyResult,
  DEFAULT_PLATFORM_ID,
  PlatformId,
  StrategyTopicItem,
} from '@/lib/types'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      basicInput?: BasicInput
      contentStrategy?: ContentStrategyResult
      selectedTopic?: StrategyTopicItem
      platformId?: PlatformId
      executeId?: string
    }

    const config = getCozeConfigFromEnv()
    assertCozeConfigured(config)
    const workflowId = config.workflowIds.script
    const platformId = body.platformId ?? DEFAULT_PLATFORM_ID

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

      const selectedTopic = body.selectedTopic
      if (!selectedTopic) {
        return Response.json({ error: '缺少选题信息' }, { status: 400 })
      }

      try {
        const script = normalizeScriptResponse(poll.output, selectedTopic, platformId)
        return Response.json({ script, source: 'coze' })
      } catch (parseError) {
        console.error('Coze script raw response:', JSON.stringify(poll.output).slice(0, 2000))
        throw parseError
      }
    }

    const { basicInput, selectedTopic } = body

    if (!selectedTopic) {
      return Response.json({ error: '请选择选题' }, { status: 400 })
    }

    const start = await startCozeWorkflow({
      config,
      workflowId,
      parameters: buildScriptWorkflowParameters(basicInput!, selectedTopic),
    })

    if ('immediate' in start) {
      const script = normalizeScriptResponse(start.immediate, selectedTopic, platformId)
      return Response.json({ script, source: 'coze' })
    }

    return Response.json({ status: 'running', executeId: start.executeId })
  } catch (error) {
    console.error('Generate script error:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : '生成脚本失败' },
      { status: 500 }
    )
  }
}
