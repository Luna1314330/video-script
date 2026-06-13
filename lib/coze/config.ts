import type { CozeWorkflowConfig } from '@/lib/types'

/** 运行时读取，避免构建阶段把空值内联进产物 */
function readEnv(key: string): string {
  return process.env[key]?.trim() ?? ''
}

export function getCozeConfigFromEnv(): CozeWorkflowConfig {
  return {
    apiToken: readEnv('COZE_API_TOKEN'),
    baseUrl: readEnv('COZE_BASE_URL') || 'https://api.coze.cn',
    workflowIds: {
      contentStrategy: readEnv('COZE_WORKFLOW_CONTENT_STRATEGY'),
      script: readEnv('COZE_WORKFLOW_SCRIPT'),
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
      '未配置 COZE_API_TOKEN。请在 Netlify → Site configuration → Environment variables 添加，Scope 勾选 Builds 和 Functions，保存后重新部署。'
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
