// Platform types
export type PlatformId = 'douyin' | 'xiaohongshu' | 'wechat-video' | 'kuaishou'

export interface Platform {
  id: PlatformId
  name: string
  description: string
}

export const PLATFORMS: Platform[] = [
  { id: 'douyin', name: '抖音', description: '快节奏、强钩子、竖屏' },
  { id: 'xiaohongshu', name: '小红书', description: '种草笔记、真实分享' },
  { id: 'wechat-video', name: '视频号', description: '社交传播、私域转化' },
  { id: 'kuaishou', name: '快手', description: '下沉市场、接地气' },
]

// Content packaging types
export type PackagingType =
  | '痛点型'
  | '避坑型'
  | '认知型'
  | '案例型'
  | '对比型'
  | '清单型'
  | '热点型'
  | '数据型'
  | '观点型'
  | '幕后型'

export const PACKAGING_TYPES: PackagingType[] = [
  '痛点型',
  '避坑型',
  '认知型',
  '案例型',
  '对比型',
  '清单型',
  '热点型',
  '数据型',
  '观点型',
  '幕后型',
]

export const PACKAGING_DESCRIPTIONS: Record<PackagingType, string> = {
  痛点型: '直击用户痛点，引发共鸣与焦虑',
  避坑型: '揭露行业陷阱，建立信任感',
  认知型: '打破固有认知，提供新视角',
  案例型: '真实案例佐证，增强说服力',
  对比型: '横向对比差异，突出产品优势',
  清单型: '结构化清单，便于收藏传播',
  热点型: '结合时事热点，提升曝光机会',
  数据型: '用数据说话，增强专业可信度',
  观点型: '输出独特观点，塑造品牌人格',
  幕后型: '展示幕后过程，拉近用户距离',
}

export const STRATEGY_PROGRESS_PHASES = [
  '正在分析用户画像...',
  '正在分析决策因素...',
  '正在生成内容地图...',
  '正在生成主题分类...',
  '正在生成选题...',
] as const

export const SCRIPT_PROGRESS_PHASES = [
  '正在理解选题与策略...',
  '正在设计开头钩子...',
  '正在撰写分镜脚本...',
  '正在润色完整文案...',
  '正在生成标签与行动号召...',
] as const

export const STRATEGY_LOADING_TIPS = [
  '不要着急，我们正在加紧生成中…',
  '内容策略需要一点思考时间，好的方向值得等待。',
  '正在结合你的行业与产品，梳理更贴合的选题。',
  '可以先喝口水，精彩内容马上就来。',
] as const

export const SCRIPT_LOADING_TIPS = [
  '不要着急，脚本正在加紧打磨中…',
  '把选题变成可开拍的脚本，需要一点耐心。',
  '大约还需 1–2 分钟，可以先稍作休息。',
  '钩子、分镜、文案都在逐句优化，请稍候。',
] as const

/** MVP 默认平台，暂不展示平台选择 */
export const DEFAULT_PLATFORM_ID: PlatformId = 'douyin'

// Step 1: Basic input
export interface BasicInput {
  industry: string
  product: string
  productDescription: string
}

// User persona
export interface PersonaProfile {
  index: number
  title: string
  ageRange: string
  characteristics: string
  usageScenario: string
  coreNeeds: string
}

export interface PersonaAnalysis {
  title: string
  profiles: PersonaProfile[]
  rawText?: string
}

// Decision factors
export interface DecisionFactorItem {
  title: string
  description: string
}

export interface PersonaDecisionFactors {
  personaTitle: string
  concerns: DecisionFactorItem[]
  worries: DecisionFactorItem[]
}

export interface DecisionFactors {
  title: string
  byPersona: PersonaDecisionFactors[]
  rawText?: string
}

// Content map
export interface ContentPillar {
  id: string
  title: string
  description: string
  frequency: string
  topics: string[]
}

export interface ContentMap {
  strategy: string
  pillars: ContentPillar[]
  contentRhythm: string
}

export interface StrategyTopicItem {
  id: string
  personaTitle: string
  contentMapTitle: string
  packagingType: PackagingType
  topic: string
}

/** 内容策略工作流返回结果（选题列表） */
export interface ContentStrategyResult {
  topics: StrategyTopicItem[]
  personas: string[]
  contentMaps: string[]
  rawText?: string
}

// Script
export interface ScriptSection {
  timestamp: string
  narration: string
  visual: string
}

export interface GeneratedScript {
  id: string
  contentItemId: string
  title: string
  packagingType: PackagingType
  platformId: PlatformId
  hook: string
  sections: ScriptSection[]
  fullText: string
  hashtags: string[]
  cta: string
}

// Coze — 2 个工作流
export interface CozeWorkflowConfig {
  apiToken: string
  baseUrl: string
  workflowIds: {
    contentStrategy: string
    script: string
  }
}

export interface AppState {
  currentStep: number
  basicInput: BasicInput
  contentStrategy: ContentStrategyResult | null
  selectedTopic: StrategyTopicItem | null
  selectedPlatform: PlatformId | null
  script: GeneratedScript | null
  strategyProgressPhase: number
  scriptProgressPhase: number
  loadingStep: number | null
  error: string | null
}

export const STEP_LABELS = ['行业与产品', '内容策略', '生成脚本'] as const

export const TOTAL_STEPS = STEP_LABELS.length
