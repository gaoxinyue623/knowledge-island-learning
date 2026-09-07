import type { ProductionRuntimeConfig } from '@/types'

type ProductionEnvironment = {
  PROD?: boolean
  VITE_ALLOW_SAMPLE_CURRICULUM?: string
  VITE_ALLOW_UNREVIEWED_CURRICULUM?: string
  VITE_ALLOW_SAMPLE_LEARNING_CONTENT?: string
  VITE_ALLOW_UNREVIEWED_LEARNING_CONTENT?: string
  VITE_ALLOW_SAMPLE_QUESTIONS?: string
  VITE_ALLOW_UNREVIEWED_QUESTIONS?: string
  VITE_ENABLE_DEV_ROUTES?: string
}

function flag(value: string | undefined, fallback: boolean): boolean {
  if (value === undefined) return fallback
  return value === 'true'
}

export function resolveProductionConfig(input: {
  isProduction: boolean
  environment?: ProductionEnvironment
}): ProductionRuntimeConfig {
  const environment = input.environment ?? {}
  const isProduction = input.isProduction
  return {
    version: 'PRODUCTION_CONFIG_V1',
    isProduction,
    // Production is always fail-safe. Environment flags can only opt into
    // development fixtures; they can never enable them in a production build.
    allowSampleCurriculum: !isProduction && flag(environment.VITE_ALLOW_SAMPLE_CURRICULUM, true),
    allowUnreviewedCurriculum:
      !isProduction && flag(environment.VITE_ALLOW_UNREVIEWED_CURRICULUM, true),
    allowSampleLearningContent:
      !isProduction && flag(environment.VITE_ALLOW_SAMPLE_LEARNING_CONTENT, true),
    allowUnreviewedLearningContent:
      !isProduction && flag(environment.VITE_ALLOW_UNREVIEWED_LEARNING_CONTENT, true),
    allowSampleQuestions: !isProduction && flag(environment.VITE_ALLOW_SAMPLE_QUESTIONS, true),
    allowUnreviewedQuestions:
      !isProduction && flag(environment.VITE_ALLOW_UNREVIEWED_QUESTIONS, true),
    devRoutes: !isProduction && flag(environment.VITE_ENABLE_DEV_ROUTES, true),
  }
}

const environment = (import.meta as ImportMeta & { env?: ProductionEnvironment }).env

export const productionConfig = resolveProductionConfig({
  isProduction: environment?.PROD === true,
  environment,
})
