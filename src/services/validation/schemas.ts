import { z } from 'zod'

export const contentBlockSchema = z.union([
  z.object({
    type: z.literal('TEXT'),
    text: z.string().min(1),
    mediaAssetId: z.string().optional(),
    altText: z.string().optional(),
  }),
  z
    .object({
      type: z.literal('RICH_TEXT'),
      text: z.string().optional(),
      mediaAssetId: z.string().optional(),
      altText: z.string().optional(),
    })
    .refine((block) => Boolean(block.text || block.mediaAssetId), {
      message: 'RICH_TEXT 至少需要 text 或 mediaAssetId',
    }),
  z.object({
    type: z.literal('IMAGE'),
    mediaAssetId: z.string().min(1),
    altText: z.string().optional(),
    text: z.string().optional(),
  }),
  z.object({
    type: z.literal('AUDIO'),
    mediaAssetId: z.string().min(1),
    altText: z.string().optional(),
    text: z.string().optional(),
  }),
  z.object({
    type: z.literal('FORMULA'),
    text: z.string().min(1),
    mediaAssetId: z.string().optional(),
    altText: z.string().optional(),
  }),
])

export const questionMediaSchema = z.object({
  mediaAssetId: z.string().min(1),
  usageType: z.enum([
    'STEM',
    'OPTION',
    'HINT',
    'EXPLANATION',
    'AUDIO_PROMPT',
    'PASSAGE',
    'REFERENCE',
  ]),
  order: z.number().int().nonnegative(),
})

export const questionOptionSchema = z.object({
  id: z.string().min(1),
  questionId: z.string().min(1),
  optionKey: z.string().min(1),
  content: z.array(contentBlockSchema).min(1),
  media: z.array(questionMediaSchema).optional(),
  sortOrder: z.number().int().nonnegative(),
})

export const questionAnswerRuleSchema = z.union([
  z.object({ ruleType: z.literal('SINGLE_OPTION'), correctOptionKey: z.string().min(1) }),
  z.object({
    ruleType: z.literal('MULTIPLE_OPTIONS'),
    correctOptionKeys: z.array(z.string().min(1)).min(1),
    selectionMode: z.literal('EXACT_SET'),
  }),
  z.object({
    ruleType: z.literal('TEXT_BLANKS'),
    blanks: z.array(
      z.object({
        blankId: z.string().min(1),
        acceptedAnswers: z.array(z.string()).min(1),
        normalization: z
          .enum(['NONE', 'TRIM', 'CASE_INSENSITIVE', 'SIMPLIFIED_CHINESE'])
          .optional(),
      }),
    ),
  }),
  z.object({ ruleType: z.literal('BOOLEAN'), correctValue: z.boolean() }),
  z.object({
    ruleType: z.literal('PLACEMENT'),
    placements: z.array(z.object({ itemKey: z.string().min(1), targetKey: z.string().min(1) })),
  }),
  z.object({
    ruleType: z.literal('PAIRS'),
    pairs: z.array(z.object({ leftKey: z.string().min(1), rightKey: z.string().min(1) })),
  }),
  z.object({ ruleType: z.literal('ORDERED_KEYS'), orderedKeys: z.array(z.string()).min(1) }),
  z.object({
    ruleType: z.literal('ACCEPTED_TEXT'),
    acceptedAnswers: z.array(z.string()).min(1),
    normalization: z.enum(['NONE', 'TRIM', 'CASE_INSENSITIVE', 'SIMPLIFIED_CHINESE']),
  }),
  z.object({
    ruleType: z.literal('LISTENING_RESPONSE'),
    acceptedOptionKeys: z.array(z.string()).optional(),
    acceptedTexts: z.array(z.string()).optional(),
    maxReplays: z.number().int().positive().optional(),
  }),
  z.object({
    ruleType: z.literal('NUMERIC'),
    value: z.union([z.number(), z.string().min(1)]),
    unit: z.string().optional(),
    tolerance: z.number().nonnegative().optional(),
  }),
  z.object({
    ruleType: z.literal('READING_SUB_QUESTIONS'),
    subQuestionIds: z.array(z.string().min(1)).min(1),
  }),
  z.object({
    ruleType: z.literal('ORDERED_TOKENS'),
    orderedTokenKeys: z.array(z.string()).min(1),
  }),
  z.object({ ruleType: z.literal('MANUAL_REVIEW') }),
  z.object({
    ruleType: z.literal('SPEAKING_RUBRIC'),
    referenceAudioMediaAssetId: z.string().optional(),
    scoringMode: z.enum(['MANUAL_REVIEW', 'FUTURE_SPEECH_API']),
    rubric: z.array(z.string()).min(1),
  }),
])

const questionHintSchema = z.object({
  id: z.string().min(1),
  order: z.number().int().nonnegative(),
  trigger: z.enum(['ON_REQUEST', 'AFTER_WRONG', 'AFTER_REPEATED_WRONG']),
  content: z.array(contentBlockSchema).min(1),
})

const questionExplanationSchema = z.object({
  summary: z.array(contentBlockSchema).min(1),
  steps: z.array(z.array(contentBlockSchema).min(1)),
  misconceptionTags: z.array(z.string()).optional(),
})

const questionDragDropItemSchema = z.object({
  itemKey: z.string().min(1),
  content: z.array(contentBlockSchema).min(1),
})

const questionDragDropTargetSchema = z.object({
  targetKey: z.string().min(1),
  content: z.array(contentBlockSchema).min(1),
})

const questionMatchingItemSchema = z.object({
  key: z.string().min(1),
  content: z.array(contentBlockSchema).min(1),
})

const questionSortingItemSchema = z.object({
  itemKey: z.string().min(1),
  content: z.array(contentBlockSchema).min(1),
})

const questionSentenceTokenSchema = z.object({
  tokenKey: z.string().min(1),
  text: z.string().min(1),
  sortOrder: z.number().int().nonnegative(),
})

export const questionSchema = z.object({
  id: z.string().min(1),
  questionType: z.enum([
    'singleChoice',
    'multipleChoice',
    'fillBlank',
    'trueFalse',
    'dragDrop',
    'matching',
    'sorting',
    'typing',
    'listening',
    'calculation',
    'shortAnswer',
    'reading',
    'sentenceOrdering',
    'speaking',
  ]),
  stem: z.array(contentBlockSchema).min(1),
  knowledgePointId: z.string().min(1).optional(),
  difficulty: z.enum(['FOUNDATION', 'STANDARD', 'ADVANCED']),
  contentType: z.enum(['TEXTBOOK', 'EXTENSION', 'REVIEW', 'CHALLENGE']),
  sourceId: z.string().min(1),
  status: z.enum([
    'DRAFT',
    'AI_GENERATED',
    'REVIEWED',
    'VERIFIED',
    'PUBLISHED',
    'REJECTED',
    'ARCHIVED',
  ]),
  needsVerification: z.boolean(),
  estimatedSeconds: z.number().int().positive(),
  tags: z.array(z.string()),
  media: z.array(questionMediaSchema),
  gradeId: z.string().optional(),
  semesterId: z.string().optional(),
  subjectId: z.string().optional(),
  textbookVersionId: z.string().optional(),
  snapshotAt: z.string().optional(),
  snapshotSource: z.string().optional(),
  questionVersion: z.number().int().positive().optional(),
  hints: z.array(questionHintSchema),
  explanation: questionExplanationSchema,
  answerRule: questionAnswerRuleSchema,
  options: z.array(questionOptionSchema).optional(),
  draggableItems: z.array(questionDragDropItemSchema).optional(),
  targets: z.array(questionDragDropTargetSchema).optional(),
  leftItems: z.array(questionMatchingItemSchema).optional(),
  rightItems: z.array(questionMatchingItemSchema).optional(),
  items: z.array(questionSortingItemSchema).optional(),
  tokens: z.array(questionSentenceTokenSchema).optional(),
  subQuestionIds: z.array(z.string().min(1)).optional(),
  isSample: z.boolean(),
  verificationStatus: z
    .enum(['SAMPLE', 'UNVERIFIED', 'VERIFIED', 'REVIEWED', 'REJECTED'])
    .optional(),
})

export const studentCurriculumProfileSchema = z.object({
  studentId: z.string().min(1),
  regionId: z.string().min(1),
  gradeId: z.string().min(1),
  semesterId: z.string().min(1),
  chineseTextbookVersionId: z.string().min(1).nullable(),
  mathTextbookVersionId: z.string().min(1).nullable(),
  englishTextbookVersionId: z.string().min(1).nullable(),
  confirmedAt: z.string().datetime({ offset: true }).nullable(),
  source: z.enum(['USER_CONFIRMED', 'SYSTEM_RECOMMENDED', 'MANUAL_OVERRIDE']),
})

export const storagePayloadSchema = z.object({
  schemaVersion: z.literal(1),
  profile: studentCurriculumProfileSchema,
})

export const regionTextbookRelationSchema = z.object({
  id: z.string().min(1),
  regionId: z.string().min(1),
  textbookVersionId: z.string().min(1),
  usageType: z.enum(['DEFAULT', 'SUPPORTED', 'OPTIONAL']),
  effectiveFrom: z.string().min(1),
  effectiveTo: z.string().optional(),
  sourceId: z.string().min(1),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']),
  needsVerification: z.boolean(),
  verificationStatus: z
    .enum(['SAMPLE', 'UNVERIFIED', 'VERIFIED', 'REVIEWED', 'REJECTED'])
    .optional(),
})
