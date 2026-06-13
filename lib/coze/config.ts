import type { CozeWorkflowConfig } from '@/lib/types'

export function getCozeConfigFromEnv(): Partial<CozeWorkflowConfig> {
  return {
    apiToken: process.env.COZE_API_TOKEN || '',
    baseUrl: process.env.COZE_BASE_URL || 'https://api.coze.cn',
    workflowIds: {
      contentStrategy: process.env.COZE_WORKFLOW_CONTENT_STRATEGY || '',
      script: process.env.COZE_WORKFLOW_SCRIPT || '',
    },
  }
}

export function mergeCozeConfig(
  clientConfig: Partial<CozeWorkflowConfig> | undefined,
  envConfig: Partial<CozeWorkflowConfig>
): CozeWorkflowConfig {
  const client = clientConfig ?? {}
  const clientIds = client.workflowIds ?? {}
  const envIds = envConfig.workflowIds ?? {}

  return {
    apiToken: client.apiToken || envConfig.apiToken || '',
    baseUrl: client.baseUrl || envConfig.baseUrl || 'https://api.coze.cn',
    workflowIds: {
      contentStrategy:
        clientIds.contentStrategy || envIds.contentStrategy || '',
      script: clientIds.script || envIds.script || '',
    },
  }
}

export function isCozeConfigured(
  config: CozeWorkflowConfig,
  workflowKey: keyof CozeWorkflowConfig['workflowIds']
): boolean {
  return Boolean(config.apiToken && config.workflowIds[workflowKey])
}

/** 默认使用模拟数据；仅在 .env.local 设置 USE_MOCK_DATA=false 时走 Coze */
export function shouldUseCozeLive(): boolean {
  return process.env.USE_MOCK_DATA === 'false'
}

export function shouldCallCoze(
  config: CozeWorkflowConfig,
  workflowKey: keyof CozeWorkflowConfig['workflowIds']
): boolean {
  return shouldUseCozeLive() && isCozeConfigured(config, workflowKey)
}
