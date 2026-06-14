import type { BasicInput } from '@/lib/types'

export function basicInputKey(input: BasicInput): string {
  return [
    input.industry.trim(),
    input.product.trim(),
    input.productDescription.trim(),
  ].join('\u0001')
}

export function isStrategyStale(
  basicInput: BasicInput,
  strategySourceInput: BasicInput | null
): boolean {
  if (!strategySourceInput) return true
  return basicInputKey(basicInput) !== basicInputKey(strategySourceInput)
}
