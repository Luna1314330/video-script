import type { BasicInput, StrategyTopicItem } from '@/lib/types'

function withOptionalProductDescription(
  params: Record<string, unknown>,
  basicInput: BasicInput
) {
  const description = basicInput.productDescription?.trim()
  if (description) {
    params.productDescription = description
  }
  return params
}

/** Coze 内容策略工作流入参 */
export function buildContentStrategyParameters(basicInput: BasicInput) {
  return withOptionalProductDescription(
    {
      basicInput,
      industry: basicInput.industry,
      product: basicInput.product,
    },
    basicInput
  )
}

/** Coze script_shengcheng 工作流入参 */
export function buildScriptWorkflowParameters(
  basicInput: BasicInput,
  selectedTopic: StrategyTopicItem
) {
  return withOptionalProductDescription(
    {
      industry: basicInput.industry,
      product: basicInput.product,
      a_content_map_type: {
        persona: selectedTopic.personaTitle,
        content_map: selectedTopic.contentMapTitle,
        packaging_type: selectedTopic.packagingType,
        topic: selectedTopic.topic,
      },
    },
    basicInput
  )
}
