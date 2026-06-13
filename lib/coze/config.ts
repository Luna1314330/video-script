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

export function assertCozeConfigured(
  config: CozeWorkflowConfig,
  workflowKey: keyof CozeWorkflowConfig['workflowIds']
): void {
  if (!isCozeConfigured(config, workflowKey)) {
    const labels: Record<keyof CozeWorkflowConfig['workflowIds'], string> = {
      contentStrategy: '内容策略',
      script: '脚本生成',
    }
    throw new Error(
      `未配置 Coze ${labels[workflowKey]}工作流，请在「Coze 配置」或 .env.local 中填写 API Token 与工作流 ID`
    )
  }
}
