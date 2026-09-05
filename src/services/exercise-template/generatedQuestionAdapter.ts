import type { ContentBlock, ExerciseInstance, GeneratedQuestionProvenance, Question } from '@/types'

const GENERATED_SOURCE_MARKER = 'GENERATED_FROM_VERIFIED_TEMPLATE'

function textBlocks(instance: ExerciseInstance): ContentBlock[] {
  return instance.prompt.blocks.map((block) => ({
    type: block.type === 'formula' ? 'FORMULA' : 'TEXT',
    text: block.value,
  }))
}

function explanationBlocks(instance: ExerciseInstance): ContentBlock[] {
  return (
    instance.explanation?.blocks.map((block) => ({
      type: block.type === 'formula' ? 'FORMULA' : 'TEXT',
      text: block.value,
    })) ?? [{ type: 'TEXT', text: '再检查一次算式和数量关系。' }]
  )
}

function baseQuestion(instance: ExerciseInstance): Question {
  const reviewed = instance.verificationStatus === 'REVIEWED' && !instance.isSample
  return {
    id: instance.id,
    questionType: 'calculation',
    stem: textBlocks(instance),
    knowledgePointId: instance.knowledgePointId,
    difficulty:
      instance.difficulty === 'L1' || instance.difficulty === 'L2'
        ? 'FOUNDATION'
        : instance.difficulty === 'L3'
          ? 'STANDARD'
          : 'ADVANCED',
    contentType: 'EXTENSION',
    sourceId: GENERATED_SOURCE_MARKER,
    status: reviewed ? 'PUBLISHED' : 'DRAFT',
    needsVerification: !reviewed,
    estimatedSeconds: 30,
    tags: ['generated', GENERATED_SOURCE_MARKER, `template:${instance.templateId}`],
    media: [],
    hints: [],
    explanation: { summary: explanationBlocks(instance), steps: [] },
    answerRule: { ruleType: 'NUMERIC', value: 0 },
    isSample: instance.isSample,
    verificationStatus: instance.verificationStatus,
  }
}

export function exerciseInstanceToQuestionViewModel(instance: ExerciseInstance): Question {
  const base = baseQuestion(instance)
  if (instance.answerSpec.kind === 'numeric') {
    return { ...base, answerRule: { ruleType: 'NUMERIC', value: instance.answerSpec.value } }
  }
  if (instance.answerSpec.kind === 'choice') {
    const options = instance.answerSpec.options.map((option, index) => ({
      id: `${instance.id}:option:${option.key}`,
      questionId: instance.id,
      optionKey: option.key,
      content: [{ type: 'TEXT' as const, text: option.label }],
      sortOrder: index + 1,
    }))
    return {
      ...base,
      questionType: 'singleChoice',
      options,
      answerRule: { ruleType: 'SINGLE_OPTION', correctOptionKey: instance.answerSpec.correctKey },
    }
  }
  if (instance.answerSpec.kind === 'ordered') {
    return {
      ...base,
      questionType: 'fillBlank',
      answerRule: {
        ruleType: 'TEXT_BLANKS',
        blanks: [
          { blankId: 'order', acceptedAnswers: [instance.answerSpec.correctOrder.join(',')] },
        ],
      },
    }
  }
  return {
    ...base,
    questionType: 'fillBlank',
    answerRule: {
      ruleType: 'TEXT_BLANKS',
      blanks: [{ blankId: 'answer', acceptedAnswers: instance.answerSpec.acceptedAnswers }],
    },
  }
}

export function adaptExerciseInstance(instance: ExerciseInstance): {
  question: Question
  provenance: GeneratedQuestionProvenance
} {
  return {
    question: exerciseInstanceToQuestionViewModel(instance),
    provenance: {
      marker: 'GENERATED_FROM_VERIFIED_TEMPLATE',
      templateId: instance.templateId,
      seed: instance.seed,
      index: instance.index,
    },
  }
}

export function adaptExerciseInstances(instances: readonly ExerciseInstance[]): Question[] {
  return instances.map(exerciseInstanceToQuestionViewModel)
}
