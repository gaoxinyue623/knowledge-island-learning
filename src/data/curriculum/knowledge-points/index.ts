import type { KnowledgePoint } from '@/types'

import type { SampleRecord } from '../types'

const knowledgePoint = (
  id: string,
  subjectId: string,
  name: string,
  abilityTag: string,
): SampleRecord<KnowledgePoint> => ({
  id,
  code: id,
  name,
  subjectId,
  gradeScope: {
    minGrade: 3,
    maxGrade: 3,
    explicitGradeIds: ['SAMPLE_GRADE_3'],
  },
  description: '示例知识点描述，仅用于验证课程数据结构。',
  learningObjective: ['完成示例学习目标'],
  abilityTags: [abilityTag, 'sample'],
  difficultyLevel: 'FOUNDATION',
  status: 'DRAFT',
  needsVerification: true,
  sourceId: 'SAMPLE_SOURCE_UNVERIFIED',
  isSample: true,
  verificationStatus: 'SAMPLE',
})

export const sampleKnowledgePoints: SampleRecord<KnowledgePoint>[] = [
  knowledgePoint(
    'SAMPLE_CHINESE_KP_01',
    'SAMPLE_SUBJECT_CHINESE',
    '示例语文知识点 01（待命名）',
    'reading',
  ),
  knowledgePoint(
    'SAMPLE_CHINESE_KP_02',
    'SAMPLE_SUBJECT_CHINESE',
    '示例语文知识点 02（待命名）',
    'language',
  ),
  knowledgePoint(
    'SAMPLE_CHINESE_KP_03',
    'SAMPLE_SUBJECT_CHINESE',
    '示例语文知识点 03（待命名）',
    'expression',
  ),
  knowledgePoint(
    'SAMPLE_CHINESE_KP_04',
    'SAMPLE_SUBJECT_CHINESE',
    '示例语文知识点 04（待命名）',
    'accumulation',
  ),
  knowledgePoint(
    'SAMPLE_MATH_KP_01',
    'SAMPLE_SUBJECT_MATH',
    '示例数学知识点 01（待命名）',
    'number',
  ),
  knowledgePoint(
    'SAMPLE_MATH_KP_02',
    'SAMPLE_SUBJECT_MATH',
    '示例数学知识点 02（待命名）',
    'calculation',
  ),
  knowledgePoint(
    'SAMPLE_MATH_KP_03',
    'SAMPLE_SUBJECT_MATH',
    '示例数学知识点 03（待命名）',
    'reasoning',
  ),
  knowledgePoint(
    'SAMPLE_MATH_KP_04',
    'SAMPLE_SUBJECT_MATH',
    '示例数学知识点 04（待命名）',
    'application',
  ),
  knowledgePoint(
    'SAMPLE_ENGLISH_KP_01',
    'SAMPLE_SUBJECT_ENGLISH',
    '示例英语知识点 01（待命名）',
    'vocabulary',
  ),
  knowledgePoint(
    'SAMPLE_ENGLISH_KP_02',
    'SAMPLE_SUBJECT_ENGLISH',
    '示例英语知识点 02（待命名）',
    'listening',
  ),
  knowledgePoint(
    'SAMPLE_ENGLISH_KP_03',
    'SAMPLE_SUBJECT_ENGLISH',
    '示例英语知识点 03（待命名）',
    'sentence',
  ),
  knowledgePoint(
    'SAMPLE_ENGLISH_KP_04',
    'SAMPLE_SUBJECT_ENGLISH',
    '示例英语知识点 04（待命名）',
    'reading',
  ),
]

export const knowledgePointById: ReadonlyMap<string, SampleRecord<KnowledgePoint>> = new Map(
  sampleKnowledgePoints.map((knowledgePointRecord) => [
    knowledgePointRecord.id,
    knowledgePointRecord,
  ]),
)
