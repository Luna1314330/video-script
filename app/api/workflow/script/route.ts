import { getCozeConfigFromEnv, mergeCozeConfig, shouldCallCoze } from '@/lib/coze/config'
import { runCozeWorkflow } from '@/lib/coze/client'
import { buildScriptWorkflowParameters } from '@/lib/coze/parameters'
import { generateMockScript } from '@/lib/mock/generators'
import { normalizeScriptResponse } from '@/lib/script/parse'
import {
  BasicInput,
  CozeWorkflowConfig,
  ContentStrategyResult,
  DEFAULT_PLATFORM_ID,
  PlatformId,
  StrategyTopicItem,
} from '@/lib/types'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      basicInput: BasicInput
      contentStrategy: ContentStrategyResult
      selectedTopic: StrategyTopicItem
      platformId?: PlatformId
      cozeConfig?: CozeWorkflowConfig
    }

    const { basicInput, contentStrategy, selectedTopic, cozeConfig } = body
    const platformId = body.platformId ?? DEFAULT_PLATFORM_ID

    if (!selectedTopic) {
      return Response.json({ error: '请选择选题' }, { status: 400 })
    }

    const config = mergeCozeConfig(cozeConfig, getCozeConfigFromEnv())

    if (shouldCallCoze(config, 'script')) {
      const raw = await runCozeWorkflow<unknown>({
        config,
        workflowId: config.workflowIds.script,
        parameters: buildScriptWorkflowParameters(basicInput, selectedTopic),
      })

      try {
        const script = normalizeScriptResponse(raw, selectedTopic, platformId)
        return Response.json({ script, source: 'coze' })
      } catch (parseError) {
        console.error('Coze script raw response:', JSON.stringify(raw).slice(0, 2000))
        throw parseError
      }
    }

    await new Promise((r) => setTimeout(r, 1200))
    const script = generateMockScript(basicInput, selectedTopic, platformId)
    return Response.json({ script, source: 'mock' })
  } catch (error) {
    console.error('Generate script error:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : '生成脚本失败' },
      { status: 500 }
    )
  }
}
