import { getCozeConfigFromEnv } from '@/lib/coze/config'

export const dynamic = 'force-dynamic'

/** 部署自检：不返回 token 明文，仅告知是否已配置 */
export async function GET() {
  const config = getCozeConfigFromEnv()

  return Response.json({
    ok: Boolean(
      config.apiToken &&
        config.workflowIds.contentStrategy &&
        config.workflowIds.script
    ),
    checks: {
      COZE_API_TOKEN: Boolean(config.apiToken),
      COZE_WORKFLOW_CONTENT_STRATEGY: Boolean(config.workflowIds.contentStrategy),
      COZE_WORKFLOW_SCRIPT: Boolean(config.workflowIds.script),
    },
  })
}
