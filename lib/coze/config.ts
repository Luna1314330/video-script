import type { CozeWorkflowConfig } from '@/lib/types'

/** 工作流 ID 固定写在代码中，上线只需配置 COZE_API_TOKEN */
export const COZE_WORKFLOW_IDS = {
  contentStrategy: '7650520509235380264',
  script: '7650523558288719913',
} as const

function readEnv(key: string): string {
  return process.env[key]?.trim() ?? ''
}

export function getCozeConfigFromEnv(): CozeWorkflowConfig {
  return {
    apiToken: readEnv('COZE_API_TOKEN'),
    baseUrl: readEnv('COZE_BASE_URL') || 'https://api.coze.cn',
    workflowIds: {
      contentStrategy: COZE_WORKFLOW_IDS.contentStrategy,
      script: COZE_WORKFLOW_IDS.script,
    },
  }
}

export function assertCozeConfigured(config: CozeWorkflowConfig): void {
  if (!config.apiToken) {
    throw new Error(
      '未配置 COZE_API_TOKEN。请在 Netlify → Site configuration → Environment variables 添加，Scope 勾选 Builds 和 Functions，保存后重新部署。'
    )
  }
}
