'use client'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { StepHeader, StepNav } from '@/components/StepLayout'
import { useAppStore } from '@/lib/store'

export function StepIndustryProduct() {
  const {
    basicInput,
    setBasicInput,
    setContentStrategy,
    setSelectedTopic,
    setScript,
    setStrategyProgressPhase,
    setScriptProgressPhase,
    setError,
    nextStep,
  } = useAppStore()

  const canProceed = basicInput.industry.trim() && basicInput.product.trim()

  const handleNext = () => {
    setContentStrategy(null)
    setSelectedTopic(null)
    setScript(null)
    setStrategyProgressPhase(0)
    setScriptProgressPhase(0)
    setError(null)
    nextStep()
  }

  return (
    <div className="animate-fade-in max-w-2xl mx-auto">
      <StepHeader
        title="行业与产品"
        description="输入你的行业和产品信息，作为整个内容策略的起点。"
      />

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            所属行业 <span className="text-destructive">*</span>
          </label>
          <Input
            placeholder="例如：美妆护肤、智能家居、教育培训"
            value={basicInput.industry}
            onChange={(e) => setBasicInput({ industry: e.target.value })}
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            产品名称 <span className="text-destructive">*</span>
          </label>
          <Input
            placeholder="例如：抗老精华、智能扫地机器人"
            value={basicInput.product}
            onChange={(e) => setBasicInput({ product: e.target.value })}
            className="h-11"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            产品描述 <span className="text-muted-foreground text-xs font-normal">选填</span>
          </label>
          <Textarea
            placeholder="补充产品特点、目标人群、价格区间、核心卖点等..."
            value={basicInput.productDescription}
            onChange={(e) => setBasicInput({ productDescription: e.target.value })}
            className="min-h-[120px] resize-none"
          />
        </div>
      </div>

      <StepNav
        showBack={false}
        onNext={handleNext}
        nextDisabled={!canProceed}
        nextLabel="下一步：内容策略"
      />
    </div>
  )
}
