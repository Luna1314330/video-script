import type { CozeWorkflowConfig } from '@/lib/types'

interface RunWorkflowOptions {
  config: CozeWorkflowConfig
  workflowId: string
  parameters: Record<string, unknown>
  /** 长耗时工作流建议开启异步 + 轮询 */
  async?: boolean
}

interface CozeWorkflowResponse {
  code?: number
  msg?: string
  data?: unknown
  output?: unknown
  execute_id?: string
  debug_url?: string
  [key: string]: unknown
}

interface CozeRunHistoryItem {
  execute_status?: string
  output?: string
  error_message?: string
}

export type CozeExecuteStatus = 'Running' | 'Success' | 'Fail'

export interface CozePollResult {
  status: CozeExecuteStatus
  output?: unknown
  error?: string
}

export type CozeStartResult =
  | { executeId: string }
  | { immediate: unknown }

const OUTPUT_KEYS = [
  'Output',
  'output',
  'result',
  'content',
  'text',
  'data',
  'answer',
  'response',
  'script',
  '输出',
] as const

const POLL_INTERVAL_MS = 2000
const POLL_MAX_MS = 10 * 60 * 1000

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function assertCozeOk(result: CozeWorkflowResponse) {
  if (typeof result.code === 'number' && result.code !== 0) {
    throw new Error(`Coze 工作流错误 (${result.code}): ${result.msg || '未知错误'}`)
  }
}

function extractExecuteId(result: CozeWorkflowResponse): string | null {
  if (result.execute_id) return String(result.execute_id)

  if (typeof result.debug_url === 'string') {
    const match = result.debug_url.match(/execute_id=(\d+)/)
    if (match) return match[1]
  }

  if (result.data && typeof result.data === 'object') {
    const data = result.data as Record<string, unknown>
    if (data.execute_id) return String(data.execute_id)
  }

  return null
}

function hasDirectWorkflowOutput(result: CozeWorkflowResponse): boolean {
  if (result.output !== undefined && result.output !== null && result.output !== '') {
    return true
  }

  if (result.data === undefined || result.data === null || result.data === '') {
    return false
  }

  if (typeof result.data === 'string') {
    return true
  }

  if (typeof result.data === 'object') {
    const data = result.data as Record<string, unknown>
    if (data.execute_id && Object.keys(data).length <= 2) {
      return false
    }
    return true
  }

  return false
}

/**
 * 从 Coze API 响应中递归提取有效载荷
 */
export function unwrapCozePayload(raw: unknown): unknown {
  if (raw === null || raw === undefined) return raw

  if (typeof raw === 'string') {
    const trimmed = raw.trim()
    if (
      (trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))
    ) {
      try {
        return unwrapCozePayload(JSON.parse(trimmed))
      } catch {
        return trimmed
      }
    }
    return trimmed
  }

  if (typeof raw !== 'object') return raw

  const obj = raw as Record<string, unknown>

  if (typeof obj.code === 'number' && obj.code !== 0) {
    throw new Error(`Coze 工作流错误 (${obj.code}): ${obj.msg || '未知错误'}`)
  }

  if (obj.data !== undefined && obj.data !== null && obj.data !== '') {
    return unwrapCozePayload(obj.data)
  }

  for (const key of OUTPUT_KEYS) {
    if (obj[key] !== undefined && obj[key] !== null && obj[key] !== '') {
      return unwrapCozePayload(obj[key])
    }
  }

  return obj
}

async function cozeFetch<T>(
  config: CozeWorkflowConfig,
  path: string,
  init?: RequestInit
): Promise<T> {
  const url = `${config.baseUrl.replace(/\/$/, '')}${path}`
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${config.apiToken}`,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Coze API 调用失败 (${response.status}): ${errorText}`)
  }

  return (await response.json()) as T
}

/** 启动异步 Coze 工作流，返回 executeId 或同步结果 */
export async function startCozeWorkflow({
  config,
  workflowId,
  parameters,
  async: useAsync = true,
}: RunWorkflowOptions): Promise<CozeStartResult> {
  const result = await cozeFetch<CozeWorkflowResponse>(config, '/v1/workflow/run', {
    method: 'POST',
    body: JSON.stringify({
      workflow_id: workflowId,
      parameters,
      is_async: useAsync,
    }),
  })

  assertCozeOk(result)

  if (!useAsync) {
    return { immediate: unwrapCozePayload(result) }
  }

  const executeId = extractExecuteId(result)
  if (executeId) {
    return { executeId }
  }

  if (hasDirectWorkflowOutput(result)) {
    return { immediate: unwrapCozePayload(result) }
  }

  throw new Error(
    `Coze 工作流未返回 execute_id 或有效结果${result.msg ? `：${result.msg}` : ''}`
  )
}

/** 单次查询 Coze 工作流执行状态（适合 serverless 短超时场景） */
export async function pollCozeWorkflowOnce({
  config,
  workflowId,
  executeId,
}: {
  config: CozeWorkflowConfig
  workflowId: string
  executeId: string
}): Promise<CozePollResult> {
  const result = await cozeFetch<CozeWorkflowResponse>(
    config,
    `/v1/workflows/${workflowId}/run_histories/${executeId}`
  )

  assertCozeOk(result)

  const history = (result.data as CozeRunHistoryItem[] | undefined)?.[0]
  if (!history) {
    throw new Error('Coze 未返回工作流执行记录')
  }

  const status = (history.execute_status ?? 'Running') as CozeExecuteStatus

  if (status === 'Success') {
    return {
      status,
      output: unwrapCozePayload(history.output ?? ''),
    }
  }

  if (status === 'Fail') {
    return {
      status,
      error: history.error_message || 'Coze 工作流执行失败',
    }
  }

  return { status: 'Running' }
}

async function pollWorkflowResult(
  config: CozeWorkflowConfig,
  workflowId: string,
  executeId: string
): Promise<unknown> {
  const started = Date.now()

  while (Date.now() - started < POLL_MAX_MS) {
    const poll = await pollCozeWorkflowOnce({ config, workflowId, executeId })

    if (poll.status === 'Success') {
      return poll.output ?? ''
    }

    if (poll.status === 'Fail') {
      throw new Error(poll.error || 'Coze 工作流执行失败')
    }

    await sleep(POLL_INTERVAL_MS)
  }

  throw new Error('Coze 工作流执行超时，请稍后重试')
}

/**
 * 调用 Coze 工作流 API（服务端长轮询，本地开发可用；Netlify 等请用 start + pollCozeWorkflowOnce）
 */
export async function runCozeWorkflow<T>({
  config,
  workflowId,
  parameters,
  async: useAsync = true,
}: RunWorkflowOptions): Promise<T> {
  const start = await startCozeWorkflow({ config, workflowId, parameters, async: useAsync })

  if ('immediate' in start) {
    return start.immediate as T
  }

  const output = await pollWorkflowResult(config, workflowId, start.executeId)
  return output as T
}
