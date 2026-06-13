import { createOpenAI } from '@ai-sdk/openai'
import type { LanguageModel } from 'ai'

export function getLanguageModel(): LanguageModel {
  if (process.env.OPENAI_API_KEY) {
    const openai = createOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL,
    })
    return openai(process.env.OPENAI_MODEL || 'gpt-4o')
  }

  if (process.env.AI_GATEWAY_API_KEY) {
    return 'anthropic/claude-sonnet-4'
  }

  throw new Error(
    '未配置 AI 服务。请在 .env.local 中设置 OPENAI_API_KEY，或设置 AI_GATEWAY_API_KEY'
  )
}

export function getAiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    if (
      error.message.includes('未配置 AI 服务') ||
      error.message.includes('AI_GATEWAY_API_KEY') ||
      error.message.includes('Unauthenticated') ||
      error.message.includes('No output generated')
    ) {
      return '未配置 AI API Key。请在项目根目录创建 .env.local，填入 OPENAI_API_KEY 后重启开发服务器'
    }
    if (error.message.includes('API key') || error.message.includes('401')) {
      return 'AI API Key 无效或已过期，请检查 .env.local 中的配置'
    }
  }
  return fallback
}
