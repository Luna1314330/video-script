import type { CozeWorkflowConfig } from '@/lib/types'

export function getCozeConfigFromEnv(): CozeWorkflowConfig {
  return {
    apiToken: process.env.COZE_API_TOKEN || '',
    baseUrl: process.env.COZE_BASE_URL || 'https://api.coze.cn',
    workflowIds: {
      contentStrategy: process.env.COZE_WORKFLOW_CONTENT_STRATEGY || '',
      script: process.env.COZE_WORKFLOW_SCRIPT || '',
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
  if (!config.apiToken) {
    throw new Error(
      '未配置 COZE_API_TOKEN，请在 Netlify 环境变量或本地 .env.local 中设置'
    )
  }

  if (!config.workflowIds[workflowKey]) {
    const envKeys: Record<keyof CozeWorkflowConfig['workflowIds'], string> = {
      contentStrategy: 'COZE_WORKFLOW_CONTENT_STRATEGY',
      script: 'COZE_WORKFLOW_SCRIPT',
    }
    throw new Error(`未配置环境变量 ${envKeys[workflowKey]}`)
  }
}
