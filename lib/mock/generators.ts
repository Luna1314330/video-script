import { MOCK_STRATEGY_OUTPUT } from '@/lib/mock/strategy-sample'
import { parseStrategyTopicsText } from '@/lib/strategy/parse'
import type {
  BasicInput,
  ContentStrategyResult,
  GeneratedScript,
  PlatformId,
  StrategyTopicItem,
} from '@/lib/types'

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`
}

export function generateMockContentStrategy(_input: BasicInput): ContentStrategyResult {
  return parseStrategyTopicsText(MOCK_STRATEGY_OUTPUT)
}

const PLATFORM_STYLE: Record<PlatformId, { cta: string }> = {
  douyin: { cta: '评论区告诉我你的需求，点赞收藏不迷路' },
  xiaohongshu: { cta: '收藏这篇，选购不踩坑' },
  'wechat-video': { cta: '转发给正在选购的朋友' },
  kuaishou: { cta: '老铁们评论区聊聊' },
}

export function generateMockScript(
  input: BasicInput,
  topic: StrategyTopicItem,
  platformId: PlatformId
): GeneratedScript {
  const { product } = input
  const style = PLATFORM_STYLE[platformId]
  const hook = topic.topic.split(/[？?！!]/)[0] + (topic.topic.includes('？') ? '？' : '')

  return {
    id: uid('script'),
    contentItemId: topic.id,
    title: topic.topic.slice(0, 40) + (topic.topic.length > 40 ? '...' : ''),
    packagingType: topic.packagingType,
    platformId,
    hook: hook || topic.topic.slice(0, 50),
    sections: [
      {
        timestamp: '0-3s',
        narration: hook || topic.topic.slice(0, 50),
        visual: '特写产品/痛点场景，字幕强化关键词',
      },
      {
        timestamp: '3-15s',
        narration: topic.topic,
        visual: '快切场景画面，配合字幕强调核心信息',
      },
      {
        timestamp: '15-35s',
        narration: `关于${product}，今天从「${topic.contentMapTitle}」角度给你讲清楚。`,
        visual: '清单式画面展示，配合产品特写',
      },
      {
        timestamp: '35-45s',
        narration: style.cta,
        visual: '产品展示 + CTA 引导动画',
      },
    ],
    fullText: `${topic.topic}\n\n关于${product}，从「${topic.contentMapTitle}」角度为你梳理。\n\n${style.cta}`,
    hashtags: [`#${product}`, `#${topic.packagingType}`, '#干货分享'],
    cta: style.cta,
  }
}
