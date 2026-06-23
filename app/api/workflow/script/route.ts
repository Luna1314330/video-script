import { assertCozeConfigured, getCozeConfigFromEnv } from '@/lib/coze/config'
import { pollCozeWorkflowOnce, startCozeWorkflow } from '@/lib/coze/client'
import { buildScriptWorkflowParameters } from '@/lib/coze/parameters'
import {
  consumeScriptGenerationQuota,
  refundScriptGenerationQuota,
} from '@/lib/generation-quota'
import { requireAuthUser } from '@/lib/require-auth'
import { persistScriptHistory } from '@/lib/script-history'
import { normalizeScriptResponse } from '@/lib/script/parse'
import { getDb, type AppDb } from '@/lib/db/index'
import {
  BasicInput,
  ContentStrategyResult,
  DEFAULT_PLATFORM_ID,
  PlatformId,
  StrategyTopicItem,
  type GeneratedScript,
} from '@/lib/types'

export const dynamic = 'force-dynamic'

type ScriptRequestBody = {
  basicInput?: BasicInput
  contentStrategy?: ContentStrategyResult
  selectedTopic?: StrategyTopicItem
  platformId?: PlatformId
  executeId?: string
  generationLogId?: string
}

async function refundIfNeeded(
  db: AppDb,
  userId: string,
  logId?: string,
) {
  if (!logId) return undefined
  const result = await refundScriptGenerationQuota(db, userId, logId)
  return result.quota
}

async function saveScriptIfPossible(
  db: AppDb,
  userId: string,
  basicInput: BasicInput | undefined,
  selectedTopic: StrategyTopicItem,
  script: GeneratedScript,
) {
  if (!basicInput?.industry?.trim() || !basicInput?.product?.trim()) return
  await persistScriptHistory(db, userId, {
    basicInput,
    selectedTopic,
    script,
  })
}

export async function POST(request: Request) {
  let generationLogId: string | undefined

  try {
    const auth = await requireAuthUser(request)
    if (!auth.ok) {
      return Response.json({ error: auth.message }, { status: auth.status })
    }

    const body = (await request.json()) as ScriptRequestBody
    generationLogId = body.generationLogId

    const config = getCozeConfigFromEnv()
    assertCozeConfigured(config)
    const workflowId = config.workflowIds.script
    const platformId = body.platformId ?? DEFAULT_PLATFORM_ID

    const db = getDb()
    if (!db) {
      return Response.json({ error: '数据库未配置' }, { status: 503 })
    }

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
        const quota = await refundIfNeeded(db, auth.user.id, generationLogId)
        return Response.json(
          {
            error: poll.error || 'Coze 工作流执行失败',
            quotaRefunded: Boolean(quota),
            quota,
          },
          { status: 500 }
        )
      }

      const selectedTopic = body.selectedTopic
      if (!selectedTopic) {
        const quota = await refundIfNeeded(db, auth.user.id, generationLogId)
        return Response.json(
          { error: '缺少选题信息', quotaRefunded: Boolean(quota), quota },
          { status: 400 }
        )
      }

      try {
        const script = normalizeScriptResponse(poll.output, selectedTopic, platformId)
        await saveScriptIfPossible(
          db,
          auth.user.id,
          body.basicInput,
          selectedTopic,
          script,
        )
        return Response.json({ script, source: 'coze' })
      } catch (parseError) {
        console.error('Coze script raw response:', JSON.stringify(poll.output).slice(0, 2000))
        const quota = await refundIfNeeded(db, auth.user.id, generationLogId)
        throw Object.assign(parseError instanceof Error ? parseError : new Error('解析脚本失败'), {
          quota,
          quotaRefunded: Boolean(quota),
        })
      }
    }

    const consume = await consumeScriptGenerationQuota(db, auth.user.id)
    if (!consume.success) {
      return Response.json(
        { error: consume.message, quota: consume.quota },
        { status: consume.status }
      )
    }

    generationLogId = consume.logId

    const { basicInput, selectedTopic } = body

    if (!selectedTopic) {
      const quota = await refundIfNeeded(db, auth.user.id, generationLogId)
      return Response.json(
        { error: '请选择选题', quotaRefunded: Boolean(quota), quota },
        { status: 400 }
      )
    }

    try {
      const start = await startCozeWorkflow({
        config,
        workflowId,
        parameters: buildScriptWorkflowParameters(basicInput!, selectedTopic),
      })

      if ('immediate' in start) {
        try {
          const script = normalizeScriptResponse(start.immediate, selectedTopic, platformId)
          await saveScriptIfPossible(
            db,
            auth.user.id,
            basicInput,
            selectedTopic,
            script,
          )
          return Response.json({
            script,
            source: 'coze',
            quota: consume.quota,
            generationLogId,
          })
        } catch (parseError) {
          const quota = await refundIfNeeded(db, auth.user.id, generationLogId)
          throw Object.assign(parseError instanceof Error ? parseError : new Error('解析脚本失败'), {
            quota,
            quotaRefunded: Boolean(quota),
          })
        }
      }

      return Response.json({
        status: 'running',
        executeId: start.executeId,
        quota: consume.quota,
        generationLogId,
      })
    } catch (workflowError) {
      const quota = await refundIfNeeded(db, auth.user.id, generationLogId)
      throw Object.assign(
        workflowError instanceof Error ? workflowError : new Error('启动工作流失败'),
        { quota, quotaRefunded: Boolean(quota) },
      )
    }
  } catch (error) {
    console.error('Generate script error:', error)
    const err = error as Error & { quota?: unknown; quotaRefunded?: boolean }
    return Response.json(
      {
        error: err instanceof Error ? err.message : '生成脚本失败',
        quota: err.quota,
        quotaRefunded: err.quotaRefunded,
      },
      { status: 500 }
    )
  }
}
