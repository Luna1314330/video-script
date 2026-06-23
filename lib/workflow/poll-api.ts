import { authFetch, getAuthHeaders } from '@/lib/auth-client'

const POLL_INTERVAL_MS = 2000
const POLL_MAX_MS = 10 * 60 * 1000

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

type WorkflowPollResponse<T> =
  | { status: 'running'; executeId: string }
  | Record<string, T>

async function tryRefundGenerationQuota(generationLogId: string) {
  try {
    await authFetch('/api/generation/refund', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ generationLogId }),
    })
  } catch {
    // 退还失败不阻塞错误抛出
  }
}

/**
 * 先启动 Coze 工作流，再由浏览器短轮询 API，避免 Netlify 函数超时 502
 */
export async function pollWorkflowApi<T>(options: {
  url: string
  startBody: Record<string, unknown>
  pollBody: (executeId: string) => Record<string, unknown>
  resultKey: string
  /** 为 true 时，生成失败会尝试退还脚本额度（需脚本 API 返回 generationLogId） */
  refundOnFailure?: boolean
}): Promise<T> {
  const startRes = await authFetch(options.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
    body: JSON.stringify(options.startBody),
  })
  const startData = (await startRes.json()) as WorkflowPollResponse<T> & {
    error?: string
    executeId?: string
    generationLogId?: string
    quotaRefunded?: boolean
  }

  if (!startRes.ok) {
    throw new Error(startData.error || '启动工作流失败')
  }

  let generationLogId = startData.generationLogId

  if (options.resultKey in startData && startData[options.resultKey as keyof typeof startData]) {
    return startData[options.resultKey as keyof typeof startData] as T
  }

  const executeId = startData.executeId
  if (!executeId) {
    if (options.refundOnFailure && generationLogId && !startData.quotaRefunded) {
      await tryRefundGenerationQuota(generationLogId)
    }
    throw new Error('工作流未返回 executeId')
  }

  const started = Date.now()

  while (Date.now() - started < POLL_MAX_MS) {
    await sleep(POLL_INTERVAL_MS)

    const pollRes = await authFetch(options.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({
        ...options.pollBody(executeId),
        executeId,
        generationLogId,
      }),
    })
    const pollData = (await pollRes.json()) as WorkflowPollResponse<T> & {
      error?: string
      status?: string
      quotaRefunded?: boolean
    }

    if (!pollRes.ok) {
      if (options.refundOnFailure && generationLogId && !pollData.quotaRefunded) {
        await tryRefundGenerationQuota(generationLogId)
      }
      throw new Error(pollData.error || '查询工作流状态失败')
    }

    if (pollData.status === 'running') {
      continue
    }

    if (options.resultKey in pollData) {
      return pollData[options.resultKey as keyof typeof pollData] as T
    }

    if (options.refundOnFailure && generationLogId && !pollData.quotaRefunded) {
      await tryRefundGenerationQuota(generationLogId)
    }
    throw new Error(pollData.error || '生成失败')
  }

  if (options.refundOnFailure && generationLogId) {
    await tryRefundGenerationQuota(generationLogId)
  }
  throw new Error('生成超时，请稍后重试')
}
