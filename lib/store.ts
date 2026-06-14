import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  AppState,
  BasicInput,
  ContentStrategyResult,
  GeneratedScript,
  PlatformId,
  StrategyTopicItem,
} from './types'
import { TOTAL_STEPS } from './types'

const initialBasicInput: BasicInput = {
  industry: '',
  product: '',
  productDescription: '',
}

interface AppActions {
  setStep: (step: number) => void
  nextStep: () => void
  prevStep: () => void
  setBasicInput: (input: Partial<BasicInput>) => void
  setContentStrategy: (strategy: ContentStrategyResult | null) => void
  setSelectedTopic: (topic: StrategyTopicItem | null) => void
  setSelectedPlatform: (platform: PlatformId | null) => void
  setScript: (script: GeneratedScript | null) => void
  setStrategyProgressPhase: (phase: number) => void
  setScriptProgressPhase: (phase: number) => void
  setLoadingStep: (step: number | null) => void
  setError: (error: string | null) => void
  reset: () => void
}

const initialState: AppState = {
  currentStep: 1,
  basicInput: initialBasicInput,
  strategySourceInput: null,
  contentStrategy: null,
  selectedTopic: null,
  selectedPlatform: null,
  script: null,
  strategyProgressPhase: 0,
  scriptProgressPhase: 0,
  loadingStep: null,
  error: null,
}

export const useAppStore = create<AppState & AppActions>()(
  persist(
    (set) => ({
      ...initialState,

      setStep: (step) => set({ currentStep: step }),

      nextStep: () =>
        set((state) => ({
          currentStep: Math.min(state.currentStep + 1, TOTAL_STEPS),
        })),

      prevStep: () =>
        set((state) => ({
          currentStep: Math.max(state.currentStep - 1, 1),
        })),

      setBasicInput: (input) =>
        set((state) => {
          const basicInput = { ...state.basicInput, ...input }
          const changed =
            basicInput.industry !== state.basicInput.industry ||
            basicInput.product !== state.basicInput.product ||
            basicInput.productDescription !== state.basicInput.productDescription

          if (!changed) {
            return { basicInput }
          }

          return {
            basicInput,
            strategySourceInput: null,
            contentStrategy: null,
            selectedTopic: null,
            script: null,
            strategyProgressPhase: 0,
            scriptProgressPhase: 0,
            error: null,
          }
        }),

      setContentStrategy: (strategy) =>
        set((state) => ({
          contentStrategy: strategy,
          strategySourceInput: strategy
            ? {
                industry: state.basicInput.industry,
                product: state.basicInput.product,
                productDescription: state.basicInput.productDescription,
              }
            : null,
        })),

      setSelectedTopic: (topic) => set({ selectedTopic: topic }),

      setSelectedPlatform: (platform) => set({ selectedPlatform: platform }),

      setScript: (script) => set({ script }),

      setStrategyProgressPhase: (phase) => set({ strategyProgressPhase: phase }),

      setScriptProgressPhase: (phase) => set({ scriptProgressPhase: phase }),

      setLoadingStep: (step) => set({ loadingStep: step }),

      setError: (error) => set({ error }),

      reset: () => set(initialState),
    }),
    {
      name: 'script-workflow-storage',
      partialize: () => ({}),
    }
  )
)
