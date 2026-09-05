import type { DifficultyLevel } from '@/types'

export interface BatchKnowledgePointCandidateDefinition {
  id: string
  code: string
  subjectCode: 'MATH'
  categoryId: string
  name: string
  description: string
  gradeStart: number
  gradeEnd: number
  difficulty: DifficultyLevel
  importance: number
  cognitiveLevel: 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE' | 'CREATE'
  tags: string[]
}

/**
 * Candidate registry for Batch 01. IDs are intentionally textbook-neutral;
 * they are not production KnowledgePoints until a human reviewer confirms
 * the definition, scope and duplicate/reuse decision.
 */
export const batch01KnowledgePointRegistry: readonly BatchKnowledgePointCandidateDefinition[] = [
  {
    id: 'B01_KP_MAT_COUNT_WITHIN_10',
    code: 'MAT-NUM-COUNT-WITHIN-10-001',
    subjectCode: 'MATH',
    categoryId: 'MAT-NUMBER',
    name: '认识并表示 10 以内的数',
    description: '能够在具体情境中数数、认读并用合适方式表示 10 以内的数量。',
    gradeStart: 1,
    gradeEnd: 1,
    difficulty: 'FOUNDATION',
    importance: 5,
    cognitiveLevel: 'UNDERSTAND',
    tags: ['batch-01-candidate', 'number', 'decontextualized'],
  },
  {
    id: 'B01_KP_MAT_COMPARE_QUANTITY',
    code: 'MAT-NUM-COMPARE-QUANTITY-001',
    subjectCode: 'MATH',
    categoryId: 'MAT-NUMBER',
    name: '比较数量的多少',
    description: '能够用一一对应或数的顺序比较两个集合的数量关系并说明判断依据。',
    gradeStart: 1,
    gradeEnd: 1,
    difficulty: 'FOUNDATION',
    importance: 4,
    cognitiveLevel: 'UNDERSTAND',
    tags: ['batch-01-candidate', 'number', 'comparison', 'decontextualized'],
  },
  {
    id: 'B01_KP_MAT_ADD_SUB_WITHIN_10',
    code: 'MAT-ADD-SUB-WITHIN-10-001',
    subjectCode: 'MATH',
    categoryId: 'MAT-CALCULATION',
    name: '理解并解决 10 以内的加减问题',
    description: '能够从简单情境中辨认合并或减少的数量关系，用算式表示并计算结果。',
    gradeStart: 1,
    gradeEnd: 1,
    difficulty: 'FOUNDATION',
    importance: 5,
    cognitiveLevel: 'APPLY',
    tags: ['batch-01-candidate', 'calculation', 'problem-solving', 'decontextualized'],
  },
  {
    id: 'B01_KP_MAT_CLASSIFY_ATTRIBUTES',
    code: 'MAT-CLASSIFY-OBSERVABLE-ATTRIBUTES-001',
    subjectCode: 'MATH',
    categoryId: 'MAT-DATA',
    name: '按可观察属性进行分类',
    description: '能够选择一个可观察属性整理对象，说明分类标准并检查分类结果。',
    gradeStart: 1,
    gradeEnd: 1,
    difficulty: 'FOUNDATION',
    importance: 3,
    cognitiveLevel: 'APPLY',
    tags: ['batch-01-candidate', 'classification', 'decontextualized'],
  },
  {
    id: 'B01_KP_MAT_SHAPE_IDENTIFY_BASIC',
    code: 'MAT-SHAPE-IDENTIFY-BASIC-001',
    subjectCode: 'MATH',
    categoryId: 'MAT-GEOMETRY',
    name: '辨认常见图形并描述可观察特征',
    description: '能够在实物或图形中辨认常见形状，并用位置或外形特征进行简单描述。',
    gradeStart: 1,
    gradeEnd: 1,
    difficulty: 'FOUNDATION',
    importance: 4,
    cognitiveLevel: 'UNDERSTAND',
    tags: ['batch-01-candidate', 'geometry', 'reusable-candidate', 'decontextualized'],
  },
  {
    id: 'B01_KP_MAT_TIME_SEQUENCE_DAILY',
    code: 'MAT-TIME-SEQUENCE-DAILY-001',
    subjectCode: 'MATH',
    categoryId: 'MAT-MEASUREMENT',
    name: '按时间顺序记录日常事件',
    description: '能够依据先后顺序记录一天中的事件，并用清楚的顺序表达生活信息。',
    gradeStart: 1,
    gradeEnd: 1,
    difficulty: 'FOUNDATION',
    importance: 3,
    cognitiveLevel: 'APPLY',
    tags: ['batch-01-candidate', 'time', 'decontextualized'],
  },
  {
    id: 'B01_KP_MAT_PROBLEM_REPRESENT_REAL_LIFE',
    code: 'MAT-PROBLEM-REPRESENT-REAL-LIFE-001',
    subjectCode: 'MATH',
    categoryId: 'MAT-APPLICATION',
    name: '用数量、图示或算式表达生活问题',
    description: '能够从熟悉的生活情境提取数量信息，并用图示、语言或简单算式表达问题。',
    gradeStart: 1,
    gradeEnd: 1,
    difficulty: 'FOUNDATION',
    importance: 4,
    cognitiveLevel: 'APPLY',
    tags: ['batch-01-candidate', 'application', 'reusable-candidate', 'decontextualized'],
  },
  {
    id: 'B01_KP_MAT_COUNT_WITHIN_20',
    code: 'MAT-NUM-COUNT-WITHIN-20-001',
    subjectCode: 'MATH',
    categoryId: 'MAT-NUMBER',
    name: '认识并表示 20 以内的数',
    description: '能够在具体情境中建立 20 以内数量、数词和表示方式之间的联系。',
    gradeStart: 1,
    gradeEnd: 1,
    difficulty: 'FOUNDATION',
    importance: 5,
    cognitiveLevel: 'UNDERSTAND',
    tags: ['batch-01-candidate', 'number', 'decontextualized'],
  },
  {
    id: 'B01_KP_MAT_ADD_SUB_WITHIN_20',
    code: 'MAT-ADD-SUB-WITHIN-20-001',
    subjectCode: 'MATH',
    categoryId: 'MAT-CALCULATION',
    name: '理解并解决 20 以内的加减问题',
    description: '能够在 20 以内的数量情境中选择加法或减法表示关系，并解释计算结果。',
    gradeStart: 1,
    gradeEnd: 1,
    difficulty: 'STANDARD',
    importance: 5,
    cognitiveLevel: 'APPLY',
    tags: ['batch-01-candidate', 'calculation', 'decontextualized'],
  },
  {
    id: 'B01_KP_MAT_COUNT_WITHIN_100',
    code: 'MAT-NUM-COUNT-WITHIN-100-001',
    subjectCode: 'MATH',
    categoryId: 'MAT-NUMBER',
    name: '认识并比较 100 以内的数',
    description: '能够用数位和数的顺序表示、读写并比较 100 以内的数。',
    gradeStart: 1,
    gradeEnd: 1,
    difficulty: 'STANDARD',
    importance: 5,
    cognitiveLevel: 'UNDERSTAND',
    tags: ['batch-01-candidate', 'number', 'decontextualized'],
  },
  {
    id: 'B01_KP_MAT_ADD_SUB_WITHIN_100',
    code: 'MAT-ADD-SUB-WITHIN-100-001',
    subjectCode: 'MATH',
    categoryId: 'MAT-CALCULATION',
    name: '解决 100 以内的加减问题',
    description: '能够在 100 以内的情境中用合适的加减方法解决简单问题并核对结果。',
    gradeStart: 1,
    gradeEnd: 1,
    difficulty: 'STANDARD',
    importance: 5,
    cognitiveLevel: 'APPLY',
    tags: ['batch-01-candidate', 'calculation', 'decontextualized'],
  },
]

export const batch01KnowledgePointById = new Map(
  batch01KnowledgePointRegistry.map((candidate) => [candidate.id, candidate]),
)
