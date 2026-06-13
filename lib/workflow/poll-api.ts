const POLL_INTERVAL_MS = 2000
const POLL_MAX_MS = 10 * 60 * 1000

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

type WorkflowPollResponse<T> =
  | { status: 'running'; executeId: string }
  | Record<string, T>

/**
 * 先启动 Coze 工作流，再由浏览器短轮询 API，避免 Netlify 函数超时 502
 */
export async function pollWorkflowApi<T>(options: {
  url: string
  startBody: Record<string, unknown>
  pollBody: (executeId: string) => Record<string, unknown>
  resultKey: string
}): Promise<T> {
  const startRes = await fetch(options.url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(options.startBody),
  })
  const startData = (await startRes.json()) as WorkflowPollResponse<T> & {
    error?: string
    executeId?: string
  }

  if (!startRes.ok) {
    throw new Error(startData.error || '启动工作流失败')
  }

  if (options.resultKey in startData && startData[options.resultKey as keyof typeof startData]) {
    return startData[options.resultKey as keyof typeof startData] as T
  }

  const executeId = startData.executeId
  if (!executeId) {
    throw new Error('工作流未返回 executeId')
  }

  const started = Date.now()

  while (Date.now() - started < POLL_MAX_MS) {
    await sleep(POLL_INTERVAL_MS)

    const pollRes = await fetch(options.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...options.pollBody(executeId),
        executeId,
      }),
    })
    const pollData = (await pollRes.json()) as WorkflowPollResponse<T> & {
      error?: string
      status?: string
    }

    if (!pollRes.ok) {
      throw new Error(pollData.error || '查询工作流状态失败')
    }

    if (pollData.status === 'running') {
      continue
    }

    if (options.resultKey in pollData) {
      return pollData[options.resultKey as keyof typeof pollData] as T
    }

    throw new Error(pollData.error || '生成失败')
  }

  throw new Error('生成超时，请稍后重试')
}
