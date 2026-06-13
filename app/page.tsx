'use client'

import { CozeSettings } from '@/components/CozeSettings'
import { StepIndicator } from '@/components/StepIndicator'
import { StepContentStrategy } from '@/components/steps/StepContentStrategy'
import { StepIndustryProduct } from '@/components/steps/StepIndustryProduct'
import { StepScriptGeneration } from '@/components/steps/StepScriptGeneration'
import { useAppStore } from '@/lib/store'

export default function Home() {
  const { currentStep, reset } = useAppStore()

  return (
    <main className="min-h-screen">
      <div className="border-b border-border/60 bg-background/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between max-w-5xl">
          <button
            type="button"
            onClick={reset}
            className="text-left rounded-lg -ml-2 px-2 py-1 transition-colors hover:bg-muted/50"
            title="回到首页并重新开始"
          >
            <h1 className="font-heading text-xl text-foreground tracking-tight">脚本工坊</h1>
            <p className="text-[11px] text-muted-foreground mt-0.5">短视频内容策略 · 脚本生成</p>
          </button>
          <CozeSettings />
        </div>
      </div>

      <div className="container mx-auto px-4 py-10 max-w-5xl">
        <StepIndicator currentStep={currentStep} />

        <div className="mt-10">
          {currentStep === 1 && <StepIndustryProduct />}
          {currentStep === 2 && <StepContentStrategy />}
          {currentStep === 3 && <StepScriptGeneration />}
        </div>

        <footer className="mt-20 pt-8 border-t border-border/40 text-center">
          <p className="text-xs text-muted-foreground">脚本工坊 · 从策略到脚本，三步完成</p>
        </footer>
      </div>
    </main>
  )
}
