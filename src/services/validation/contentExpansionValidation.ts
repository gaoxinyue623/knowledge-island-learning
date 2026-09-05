import { z } from 'zod'

const activityDifficultySchema = z.enum(['L1', 'L2', 'L3', 'L4', 'L5'])
const verificationStatusSchema = z.enum([
  'SAMPLE',
  'UNVERIFIED',
  'VERIFIED',
  'REVIEWED',
  'REJECTED',
])
const activityBaseSchema = z.object({
  id: z.string().min(1),
  knowledgePointId: z.string().min(1),
  title: z.string().min(1),
  instruction: z.string().min(1),
  difficulty: activityDifficultySchema,
  learningGoal: z.string().min(1),
  completionPolicy: z.enum(['all_items', 'target_reached', 'manual_check']),
  sourceId: z.string().min(1),
  verificationStatus: verificationStatusSchema,
  isSample: z.boolean(),
  sort: z.number().int().nonnegative(),
})

const dragMatchConfigSchema = z.object({
  sources: z
    .array(
      z.object({
        id: z.string().min(1),
        label: z.string().optional(),
        imageKey: z.string().optional(),
      }),
    )
    .min(1),
  targets: z
    .array(
      z.object({
        id: z.string().min(1),
        label: z.string().optional(),
        imageKey: z.string().optional(),
      }),
    )
    .min(1),
  matches: z.array(z.object({ sourceId: z.string().min(1), targetId: z.string().min(1) })).min(1),
})
const dragClassifyConfigSchema = z.object({
  items: z.array(z.object({ id: z.string().min(1), label: z.string().min(1) })).min(1),
  groups: z.array(z.object({ id: z.string().min(1), label: z.string().min(1) })).min(1),
  answers: z.array(z.object({ itemId: z.string().min(1), groupId: z.string().min(1) })).min(1),
})
const sortOrderConfigSchema = z.object({
  items: z.array(z.object({ id: z.string().min(1), label: z.string().min(1) })).min(2),
  correctOrder: z.array(z.string().min(1)).min(2),
})
const numberLineConfigSchema = z.object({
  min: z.number().int(),
  max: z.number().int(),
  start: z.number().int(),
  operations: z
    .array(
      z.object({ direction: z.enum(['forward', 'backward']), steps: z.number().int().positive() }),
    )
    .min(1),
  target: z.number().int(),
})
const selectRegionConfigSchema = z.object({
  assetKey: z.string().min(1),
  coordinateSystem: z.literal('normalized'),
  regions: z
    .array(
      z.object({
        id: z.string().min(1),
        label: z.string().optional(),
        x: z.number().min(0).max(1),
        y: z.number().min(0).max(1),
        width: z.number().positive().max(1),
        height: z.number().positive().max(1),
      }),
    )
    .min(1),
  targetRegionIds: z.array(z.string().min(1)).min(1),
})
const simulationConfigSchema = z.discriminatedUnion('templateKey', [
  z.object({
    templateKey: z.literal('number_line_walk'),
    parameters: z.object({
      min: z.number().int(),
      max: z.number().int(),
      start: z.number().int(),
      target: z.number().int(),
    }),
  }),
  z.object({
    templateKey: z.literal('shape_builder'),
    parameters: z.object({
      targetShape: z.enum(['circle', 'triangle', 'square', 'rectangle']),
      availablePieces: z.number().int().positive(),
    }),
  }),
  z.object({
    templateKey: z.literal('compare_towers'),
    parameters: z.object({
      leftCount: z.number().int().nonnegative(),
      rightCount: z.number().int().nonnegative(),
      target: z.enum(['left', 'right', 'same']),
    }),
  }),
])

const unsupportedConfigSchemas = {
  build_object: z.object({
    pieces: z.array(z.object({ id: z.string().min(1), label: z.string().min(1) })).min(1),
    targetDescription: z.string().min(1),
  }),
  connect_pairs: z.object({
    left: z.array(z.object({ id: z.string().min(1), label: z.string().min(1) })).min(1),
    right: z.array(z.object({ id: z.string().min(1), label: z.string().min(1) })).min(1),
    connections: z
      .array(z.object({ leftId: z.string().min(1), rightId: z.string().min(1) }))
      .min(1),
  }),
  fill_container: z.object({
    itemLabel: z.string().min(1),
    capacity: z.number().int().positive(),
    targetCount: z.number().int().positive(),
  }),
  step_operation: z.object({
    steps: z.array(z.object({ id: z.string().min(1), label: z.string().min(1) })).min(1),
    correctOrder: z.array(z.string().min(1)).min(1),
  }),
  observe_discover: z.object({ observation: z.string().min(1), question: z.string().min(1) }),
  timed_challenge: z.object({
    timeLimitSeconds: z.number().int().positive(),
    prompt: z.string().min(1),
  }),
}

export const interactiveActivitySchema = z.discriminatedUnion('activityType', [
  activityBaseSchema.extend({
    activityType: z.literal('drag_match'),
    config: dragMatchConfigSchema,
  }),
  activityBaseSchema.extend({
    activityType: z.literal('drag_classify'),
    config: dragClassifyConfigSchema,
  }),
  activityBaseSchema.extend({
    activityType: z.literal('sort_order'),
    config: sortOrderConfigSchema,
  }),
  activityBaseSchema.extend({
    activityType: z.literal('number_line'),
    config: numberLineConfigSchema,
  }),
  activityBaseSchema.extend({
    activityType: z.literal('select_region'),
    config: selectRegionConfigSchema,
  }),
  activityBaseSchema.extend({
    activityType: z.literal('simulation'),
    config: simulationConfigSchema,
  }),
  activityBaseSchema.extend({
    activityType: z.literal('build_object'),
    config: unsupportedConfigSchemas.build_object,
  }),
  activityBaseSchema.extend({
    activityType: z.literal('connect_pairs'),
    config: unsupportedConfigSchemas.connect_pairs,
  }),
  activityBaseSchema.extend({
    activityType: z.literal('fill_container'),
    config: unsupportedConfigSchemas.fill_container,
  }),
  activityBaseSchema.extend({
    activityType: z.literal('step_operation'),
    config: unsupportedConfigSchemas.step_operation,
  }),
  activityBaseSchema.extend({
    activityType: z.literal('observe_discover'),
    config: unsupportedConfigSchemas.observe_discover,
  }),
  activityBaseSchema.extend({
    activityType: z.literal('timed_challenge'),
    config: unsupportedConfigSchemas.timed_challenge,
  }),
])

const templateBaseSchema = z.object({
  id: z.string().min(1),
  knowledgePointId: z.string().min(1),
  difficulty: activityDifficultySchema,
  sourceId: z.string().min(1),
  verificationStatus: verificationStatusSchema,
  isSample: z.boolean(),
  version: z.number().int().positive(),
})
const additionConfigSchema = z.object({
  minAddend: z.number().int().nonnegative(),
  maxAddend: z.number().int().nonnegative(),
  maxResult: z.number().int().positive(),
  allowZero: z.boolean(),
  noCarry: z.boolean(),
  noDuplicatePair: z.boolean(),
})
const subtractionConfigSchema = z.object({
  minMinuend: z.number().int().nonnegative(),
  maxMinuend: z.number().int().nonnegative(),
  minSubtrahend: z.number().int().nonnegative(),
  maxSubtrahend: z.number().int().nonnegative(),
  allowZero: z.boolean(),
  nonNegative: z.boolean(),
  noDuplicatePair: z.boolean(),
})
const compareConfigSchema = z.object({
  min: z.number().int(),
  max: z.number().int(),
  allowEqual: z.boolean(),
})
const missingConfigSchema = z.object({
  operation: z.enum(['addition', 'subtraction']),
  min: z.number().int().nonnegative(),
  max: z.number().int().positive(),
  maxResult: z.number().int().positive(),
  excludeZero: z.boolean(),
})
const orderConfigSchema = z.object({
  min: z.number().int(),
  max: z.number().int(),
  count: z.number().int().min(2).max(10),
  direction: z.enum(['ascending', 'descending']),
})
const pictureConfigSchema = z.object({
  minCount: z.number().int().nonnegative(),
  maxCount: z.number().int().positive(),
  objectLabels: z.array(z.string().min(1)).min(1),
})
const wordConfigSchema = z.object({
  operation: z.enum(['addition', 'subtraction']),
  maxResult: z.number().int().positive(),
  contexts: z
    .array(z.object({ subject: z.string().min(1), verb: z.enum(['来了', '走了', '又有', '还剩']) }))
    .min(1),
})
const equationConfigSchema = z.object({
  maxNumber: z.number().int().positive(),
  optionsPerQuestion: z.number().int().min(2).max(5),
  operation: z.enum(['addition', 'subtraction']),
})

export const exerciseTemplateSchema = z.discriminatedUnion('templateType', [
  templateBaseSchema.extend({
    templateType: z.literal('addition_range'),
    config: additionConfigSchema,
  }),
  templateBaseSchema.extend({
    templateType: z.literal('subtraction_range'),
    config: subtractionConfigSchema,
  }),
  templateBaseSchema.extend({
    templateType: z.literal('compare_numbers'),
    config: compareConfigSchema,
  }),
  templateBaseSchema.extend({
    templateType: z.literal('missing_number'),
    config: missingConfigSchema,
  }),
  templateBaseSchema.extend({ templateType: z.literal('number_order'), config: orderConfigSchema }),
  templateBaseSchema.extend({
    templateType: z.literal('picture_count'),
    config: pictureConfigSchema,
  }),
  templateBaseSchema.extend({
    templateType: z.literal('word_problem_simple'),
    config: wordConfigSchema,
  }),
  templateBaseSchema.extend({
    templateType: z.literal('equation_match'),
    config: equationConfigSchema,
  }),
])

const structuredContentSchema = z.object({
  blocks: z
    .array(z.object({ type: z.enum(['text', 'formula', 'hint']), value: z.string().min(1) }))
    .min(1),
})
const recordBaseSchema = z.object({
  id: z.string().min(1),
  knowledgePointId: z.string().min(1),
  sourceId: z.string().min(1),
  verificationStatus: verificationStatusSchema,
  isSample: z.boolean(),
})

export const practiceSetSchema = recordBaseSchema.extend({
  title: z.string().min(1),
  mode: z.enum(['basic', 'reinforce', 'application']),
  templateIds: z.array(z.string().min(1)).min(1),
  fixedQuestionIds: z.array(z.string().min(1)).optional(),
  targetCount: z.number().int().positive(),
  difficultyRange: z.object({ min: activityDifficultySchema, max: activityDifficultySchema }),
})

export const extensionActivitySchema = recordBaseSchema.extend({
  title: z.string().min(1),
  instruction: z.string().min(1),
  content: structuredContentSchema,
  referenceAnswer: z.string().min(1).optional(),
})

export const challengeSchema = recordBaseSchema.extend({
  title: z.string().min(1),
  instruction: z.string().min(1),
  content: structuredContentSchema,
  referenceAnswer: z.string().min(1).optional(),
})

export const activityProgressStoragePayloadSchema = z.object({
  schemaVersion: z.literal(1),
  progress: z.array(
    z.object({
      profileId: z.string().min(1),
      activityId: z.string().min(1),
      status: z.enum(['idle', 'in_progress', 'completed', 'unsupported', 'error']),
      attempts: z.number().int().nonnegative(),
      updatedAt: z.string().min(1),
      completedAt: z.string().optional(),
    }),
  ),
})

export function validateInteractiveActivity(value: unknown) {
  return interactiveActivitySchema.safeParse(value)
}

export function validateExerciseTemplate(value: unknown) {
  return exerciseTemplateSchema.safeParse(value)
}

export function validatePracticeSet(value: unknown) {
  return practiceSetSchema.safeParse(value)
}

export function validateExtensionActivity(value: unknown) {
  return extensionActivitySchema.safeParse(value)
}

export function validateChallenge(value: unknown) {
  return challengeSchema.safeParse(value)
}
