'use client'

import { HistoryPanel } from '@/components/HistoryPanel'
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
        <div className="container mx-auto px-4 py-4 max-w-5xl">
          <div className="max-w-6xl mx-auto w-full flex items-center justify-between gap-4">
            <div>
              <button
                type="button"
                onClick={reset}
                className="font-heading text-xl text-foreground tracking-tight cursor-pointer hover-nudge"
                title="回到首页并重新开始"
              >
                脚本工坊
              </button>
              <p className="text-[11px] text-muted-foreground mt-0.5 pointer-events-none">
                短视频内容策略 · 脚本生成
              </p>
            </div>
            <HistoryPanel />
          </div>
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
