import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  AppState,
  BasicInput,
  ContentStrategyResult,
  CozeWorkflowConfig,
  GeneratedScript,
  PlatformId,
  StrategyTopicItem,
} from './types'
import { DEFAULT_COZE_CONFIG, TOTAL_STEPS } from './types'

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
  setCozeConfig: (config: Partial<CozeWorkflowConfig>) => void
  setLoadingStep: (step: number | null) => void
  setError: (error: string | null) => void
  reset: () => void
}

const initialState: AppState = {
  currentStep: 1,
  basicInput: initialBasicInput,
  contentStrategy: null,
  selectedTopic: null,
  selectedPlatform: null,
  script: null,
  strategyProgressPhase: 0,
  scriptProgressPhase: 0,
  cozeConfig: DEFAULT_COZE_CONFIG,
  loadingStep: null,
  error: null,
}

export const useAppStore = create<AppState & AppActions>()(
  persist(
    (set, get) => ({
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
        set((state) => ({
          basicInput: { ...state.basicInput, ...input },
        })),

      setContentStrategy: (strategy) => set({ contentStrategy: strategy }),

      setSelectedTopic: (topic) => set({ selectedTopic: topic }),

      setSelectedPlatform: (platform) => set({ selectedPlatform: platform }),

      setScript: (script) => set({ script }),

      setStrategyProgressPhase: (phase) => set({ strategyProgressPhase: phase }),

      setScriptProgressPhase: (phase) => set({ scriptProgressPhase: phase }),

      setCozeConfig: (config) =>
        set((state) => ({
          cozeConfig: {
            ...state.cozeConfig,
            ...config,
            workflowIds: {
              ...state.cozeConfig.workflowIds,
              ...config.workflowIds,
            },
          },
        })),

      setLoadingStep: (step) => set({ loadingStep: step }),

      setError: (error) => set({ error }),

      reset: () =>
        set({
          ...initialState,
          cozeConfig: get().cozeConfig,
        }),
    }),
    {
      name: 'script-workflow-storage',
      partialize: (state) => ({ cozeConfig: state.cozeConfig }),
    }
  )
)
