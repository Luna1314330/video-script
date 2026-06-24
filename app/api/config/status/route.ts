import { getCozeConfigFromEnv } from '@/lib/coze/config'
import { isDbConfigured } from '@/lib/db/index'
import { getWechatPayStatus } from '@/lib/wechat-pay/config'

export const dynamic = 'force-dynamic'

/** 部署自检：不返回 token 明文，仅告知是否已配置 */
export async function GET() {
  const config = getCozeConfigFromEnv()
  const dbConfigured = isDbConfigured()
  const jwtConfigured = Boolean(process.env.JWT_SECRET?.trim())
  const wechatPay = getWechatPayStatus()

  return Response.json({
    ok: Boolean(
      config.apiToken &&
        config.workflowIds.contentStrategy &&
        config.workflowIds.script &&
        dbConfigured &&
        jwtConfigured,
    ),
    database: 'mysql',
    checks: {
      COZE_API_TOKEN: Boolean(config.apiToken),
      COZE_WORKFLOW_CONTENT_STRATEGY: Boolean(config.workflowIds.contentStrategy),
      COZE_WORKFLOW_SCRIPT: Boolean(config.workflowIds.script),
      DATABASE_URL: dbConfigured,
      JWT_SECRET: jwtConfigured,
      WECHAT_PAY_CONFIGURED: wechatPay.configured,
      WECHAT_PAY_MOCK: wechatPay.mock,
      WECHAT_PAY_READY: wechatPay.ready,
    },
    wechatPay: {
      notifyUrl: wechatPay.notifyUrl,
    },
  })
}
