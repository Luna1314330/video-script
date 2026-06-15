import type { BasicInput, StrategyTopicItem } from '@/lib/types'

/** 两个工作流共用的基础入参，字段名与 Coze 工作流一致 */
function buildBaseWorkflowInput(basicInput: BasicInput) {
  return {
    industry: basicInput.industry.trim(),
    product: basicInput.product.trim(),
    productDescription: basicInput.productDescription.trim(),
    scene: basicInput.scene.trim(),
  }
}

/** Coze 内容策略工作流入参 */
export function buildContentStrategyParameters(basicInput: BasicInput) {
  return buildBaseWorkflowInput(basicInput)
}

/** Coze 脚本生成工作流入参 */
export function buildScriptWorkflowParameters(
  basicInput: BasicInput,
  selectedTopic: StrategyTopicItem
) {
  return {
    ...buildBaseWorkflowInput(basicInput),
    a_content_map_type: {
      persona: selectedTopic.personaTitle,
      content_map: selectedTopic.contentMapTitle,
      packaging_type: selectedTopic.packagingType,
      topic: selectedTopic.topic,
    },
  }
}
