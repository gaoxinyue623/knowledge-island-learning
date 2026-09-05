import type {
  CurriculumImportPackage,
  KnowledgePointImportData,
  LessonImportData,
  LessonKnowledgePointImportData,
  KnowledgeRelationImportData,
  ProvenanceMetadata,
  SourceReference,
  UnitImportData,
} from '@/types'

import { curriculumSourceManifest } from '../../production/source-manifest'
import { batch01KnowledgePointById } from '../knowledge-point-candidates'

const generatedAt = '2026-09-03T00:00:00+08:00'
const nationalCatalogSourceId = 'MOE-NATIONAL-CATALOG-2024'
const mathStandardSourceId = 'MOE-MATH-STANDARD-2022'

interface MappingSeed {
  knowledgePointId: string
  role: 'core' | 'secondary' | 'extended'
  weight: number
}

interface LessonDefinition {
  title: string
  mappings: readonly MappingSeed[]
}

interface UnitDefinition {
  title: string
  lessons: readonly LessonDefinition[]
}

interface RelationDefinition {
  sourceKnowledgePointId: string
  targetKnowledgePointId: string
  relationType: 'prerequisite' | 'related' | 'advanced'
}

function mapping(
  knowledgePointId: string,
  role: MappingSeed['role'] = 'core',
  weight = role === 'core' ? 1 : 0.5,
): MappingSeed {
  return { knowledgePointId, role, weight }
}

function sourceById(id: string): SourceReference {
  const source = curriculumSourceManifest.find((candidate) => candidate.id === id)
  if (!source) throw new Error(`Batch 01 source reference missing: ${id}`)
  return { ...source }
}

function provenance(sourceReferenceIds: string[]): ProvenanceMetadata {
  return {
    sourceReferenceIds,
    verificationStatus: 'UNVERIFIED',
    isSample: false,
    needsVerification: true,
    createdAt: generatedAt,
    updatedAt: generatedAt,
  }
}

function createCandidateKnowledgePoints(
  ids: readonly string[],
  sourceReferenceIds: string[],
): KnowledgePointImportData[] {
  return ids.map((id) => {
    const candidate = batch01KnowledgePointById.get(id)
    if (!candidate) throw new Error(`Batch 01 KnowledgePoint candidate missing: ${id}`)
    return {
      ...provenance(sourceReferenceIds),
      ...candidate,
      tags: [...candidate.tags],
    }
  })
}

function createPackage(options: {
  packageId: string
  textbookId: string
  title: string
  semester: 1 | 2
  catalogSourceId: string
  publisherSourceId: string
  units: readonly UnitDefinition[]
  knowledgePointIds: readonly string[]
  relations: readonly RelationDefinition[]
}): CurriculumImportPackage {
  const textbookSourceIds = [
    options.catalogSourceId,
    options.publisherSourceId,
    nationalCatalogSourceId,
  ]
  const structureSourceIds = [options.catalogSourceId]
  const knowledgeSourceIds = [options.catalogSourceId, mathStandardSourceId]
  const unitRecords: UnitImportData[] = options.units.map((unit, index) => ({
    ...provenance(structureSourceIds),
    id: `${options.textbookId}_UNIT_${String(index + 1).padStart(2, '0')}`,
    textbookId: options.textbookId,
    unitNo: index + 1,
    sort: index + 1,
    title: unit.title,
  }))
  const lessonRecords: LessonImportData[] = options.units.flatMap((unit, unitIndex) => {
    const unitId = unitRecords[unitIndex]?.id
    if (!unitId) throw new Error(`Batch 01 unit missing at ${unitIndex}`)
    return unit.lessons.map((lesson, lessonIndex) => ({
      ...provenance(structureSourceIds),
      id: `${unitId}_LESSON_${String(lessonIndex + 1).padStart(2, '0')}`,
      unitId,
      lessonNo: lessonIndex + 1,
      sort: lessonIndex + 1,
      title: lesson.title,
    }))
  })
  const lessonKnowledgePoints: LessonKnowledgePointImportData[] = options.units.flatMap(
    (unit, unitIndex) => {
      const unitRecord = unitRecords[unitIndex]
      if (!unitRecord) throw new Error(`Batch 01 unit record missing at ${unitIndex}`)
      return unit.lessons.flatMap((lesson, lessonIndex) => {
        const lessonRecord = lessonRecords.find(
          (candidate) =>
            candidate.unitId === unitRecord.id && candidate.lessonNo === lessonIndex + 1,
        )
        if (!lessonRecord)
          throw new Error(`Batch 01 lesson record missing at ${unitIndex}:${lessonIndex}`)
        return lesson.mappings.map((mappingSeed, mappingIndex) => ({
          ...provenance(knowledgeSourceIds),
          id: `${lessonRecord.id}_KP_${String(mappingIndex + 1).padStart(2, '0')}`,
          lessonId: lessonRecord.id,
          knowledgePointId: mappingSeed.knowledgePointId,
          role: mappingSeed.role,
          weight: mappingSeed.weight,
        }))
      })
    },
  )
  const knowledgeRelations: KnowledgeRelationImportData[] = options.relations.map(
    (relation, index) => ({
      ...provenance(knowledgeSourceIds),
      id: `${options.textbookId}_RELATION_${String(index + 1).padStart(2, '0')}`,
      sourceKnowledgePointId: relation.sourceKnowledgePointId,
      targetKnowledgePointId: relation.targetKnowledgePointId,
      relationType: relation.relationType,
    }),
  )

  const sourceIds = [
    ...new Set([
      nationalCatalogSourceId,
      options.publisherSourceId,
      options.catalogSourceId,
      mathStandardSourceId,
    ]),
  ]
  return {
    schemaVersion: 1,
    textbook: {
      ...provenance(textbookSourceIds),
      id: options.textbookId,
      title: options.title,
      identity: {
        stage: 'primary',
        subjectCode: 'MATH',
        grade: 1,
        semester: options.semester,
        publisherCode: 'BNUP',
        editionYear: 2024,
      },
    },
    units: unitRecords,
    lessons: lessonRecords,
    knowledgePoints: createCandidateKnowledgePoints(options.knowledgePointIds, knowledgeSourceIds),
    lessonKnowledgePoints,
    knowledgeRelations,
    sources: sourceIds.map(sourceById),
    metadata: {
      generatedAt,
      importType: 'manual',
      verificationStatus: 'UNVERIFIED',
    },
  }
}

const count10 = 'B01_KP_MAT_COUNT_WITHIN_10'
const compareQuantity = 'B01_KP_MAT_COMPARE_QUANTITY'
const addSub10 = 'B01_KP_MAT_ADD_SUB_WITHIN_10'
const classify = 'B01_KP_MAT_CLASSIFY_ATTRIBUTES'
const shape = 'B01_KP_MAT_SHAPE_IDENTIFY_BASIC'
const timeSequence = 'B01_KP_MAT_TIME_SEQUENCE_DAILY'
const representProblem = 'B01_KP_MAT_PROBLEM_REPRESENT_REAL_LIFE'
const count20 = 'B01_KP_MAT_COUNT_WITHIN_20'
const addSub20 = 'B01_KP_MAT_ADD_SUB_WITHIN_20'
const count100 = 'B01_KP_MAT_COUNT_WITHIN_100'
const addSub100 = 'B01_KP_MAT_ADD_SUB_WITHIN_100'

const upperUnits: readonly UnitDefinition[] = [
  {
    title: '我上学啦',
    lessons: [
      {
        title: '可爱的校园',
        mappings: [mapping(representProblem), mapping(compareQuantity, 'secondary')],
      },
      { title: '认识新同学', mappings: [mapping(count10), mapping(representProblem, 'secondary')] },
      {
        title: '我们的操场',
        mappings: [mapping(compareQuantity), mapping(representProblem, 'secondary')],
      },
      { title: '好玩的游戏', mappings: [mapping(representProblem), mapping(count10, 'secondary')] },
      { title: '收获的季节', mappings: [mapping(count10), mapping(compareQuantity, 'secondary')] },
    ],
  },
  {
    title: '第一单元 生活中的数',
    lessons: [
      {
        title: '走进美丽乡村',
        mappings: [mapping(count10), mapping(representProblem, 'secondary')],
      },
      { title: '玩具', mappings: [mapping(count10), mapping(compareQuantity, 'secondary')] },
      { title: '小猫钓鱼', mappings: [mapping(count10), mapping(compareQuantity, 'secondary')] },
      { title: '文具', mappings: [mapping(count10), mapping(representProblem, 'secondary')] },
      { title: '数鸡蛋', mappings: [mapping(count10), mapping(compareQuantity, 'secondary')] },
      {
        title: '快乐的午餐',
        mappings: [mapping(compareQuantity), mapping(representProblem, 'secondary')],
      },
      { title: '动物乐园', mappings: [mapping(count10), mapping(compareQuantity, 'secondary')] },
      { title: '整理与复习', mappings: [mapping(count10), mapping(compareQuantity, 'secondary')] },
    ],
  },
  {
    title: '第二单元 5以内数加与减',
    lessons: [
      { title: '一共有多少', mappings: [mapping(addSub10), mapping(count10, 'secondary')] },
      {
        title: '还剩下多少',
        mappings: [mapping(addSub10), mapping(representProblem, 'secondary')],
      },
      { title: '可爱的小猫', mappings: [mapping(addSub10), mapping(count10, 'secondary')] },
      {
        title: '整理与复习',
        mappings: [mapping(addSub10), mapping(representProblem, 'secondary')],
      },
    ],
  },
  {
    title: '综合实践 介绍我的教室',
    lessons: [
      { title: '观察教室', mappings: [mapping(representProblem), mapping(shape, 'secondary')] },
      {
        title: '介绍教室',
        mappings: [mapping(representProblem), mapping(compareQuantity, 'secondary')],
      },
      { title: '校园开放日', mappings: [mapping(representProblem), mapping(shape, 'secondary')] },
    ],
  },
  {
    title: '第三单元 整理与分类',
    lessons: [
      { title: '整理房间', mappings: [mapping(classify), mapping(representProblem, 'secondary')] },
      { title: '一起来分类', mappings: [mapping(classify), mapping(compareQuantity, 'secondary')] },
    ],
  },
  {
    title: '第四单元 10以内数加与减',
    lessons: [
      { title: '猜数游戏', mappings: [mapping(addSub10), mapping(count10, 'secondary')] },
      { title: '背土豆', mappings: [mapping(addSub10), mapping(representProblem, 'secondary')] },
      { title: '课间', mappings: [mapping(addSub10), mapping(compareQuantity, 'secondary')] },
      { title: '小鸡吃食', mappings: [mapping(addSub10), mapping(count10, 'secondary')] },
      { title: '乘车', mappings: [mapping(addSub10), mapping(representProblem, 'secondary')] },
      { title: '挖红薯', mappings: [mapping(addSub10), mapping(representProblem, 'secondary')] },
      { title: '可爱的企鹅', mappings: [mapping(addSub10), mapping(compareQuantity, 'secondary')] },
      { title: '做个加法表', mappings: [mapping(addSub10), mapping(count10, 'secondary')] },
      { title: '做个减法表', mappings: [mapping(addSub10), mapping(count10, 'secondary')] },
      {
        title: '整理与复习',
        mappings: [mapping(addSub10), mapping(representProblem, 'secondary')],
      },
    ],
  },
  {
    title: '数学好玩 一起做游戏',
    lessons: [
      {
        title: '一起做游戏',
        mappings: [mapping(representProblem), mapping(count10, 'extended', 0.4)],
      },
    ],
  },
  {
    title: '第五单元 有趣的立体图形',
    lessons: [
      { title: '认识图形', mappings: [mapping(shape)] },
      { title: '我说你做', mappings: [mapping(shape), mapping(representProblem, 'secondary')] },
      { title: '怎样搭得高', mappings: [mapping(shape), mapping(representProblem, 'secondary')] },
    ],
  },
  {
    title: '综合实践 记录我的一天',
    lessons: [
      {
        title: '淘气的一天',
        mappings: [mapping(timeSequence), mapping(representProblem, 'secondary')],
      },
      { title: '记录我的一天', mappings: [mapping(timeSequence), mapping(count10, 'secondary')] },
      {
        title: '分享我的一天',
        mappings: [mapping(timeSequence), mapping(representProblem, 'secondary')],
      },
    ],
  },
  {
    title: '总复习',
    lessons: [
      { title: '数与代数', mappings: [mapping(count10), mapping(addSub10, 'secondary')] },
      { title: '图形与几何', mappings: [mapping(shape)] },
      { title: '统计与概率', mappings: [mapping(classify), mapping(compareQuantity, 'secondary')] },
      {
        title: '综合与实践',
        mappings: [mapping(representProblem), mapping(timeSequence, 'secondary')],
      },
    ],
  },
]

const lowerUnits: readonly UnitDefinition[] = [
  {
    title: '第一单元 20以内数与加法',
    lessons: [
      { title: '古人计数（一）', mappings: [mapping(count20)] },
      {
        title: '古人计数（二）',
        mappings: [mapping(count20), mapping(representProblem, 'secondary')],
      },
      { title: '搭积木', mappings: [mapping(addSub20), mapping(count20, 'secondary')] },
      { title: '开心农场', mappings: [mapping(addSub20), mapping(representProblem, 'secondary')] },
      {
        title: '一起做家务',
        mappings: [mapping(addSub20), mapping(representProblem, 'secondary')],
      },
      { title: '小兔子安家', mappings: [mapping(addSub20), mapping(count20, 'secondary')] },
      { title: '做个加法表', mappings: [mapping(addSub20), mapping(count20, 'secondary')] },
      { title: '整理与复习', mappings: [mapping(count20), mapping(addSub20, 'secondary')] },
    ],
  },
  {
    title: '第二单元 图形大变身（一）',
    lessons: [
      { title: '做一做', mappings: [mapping(shape)] },
      { title: '找一找', mappings: [mapping(shape), mapping(representProblem, 'secondary')] },
      { title: '影子剧场', mappings: [mapping(shape), mapping(representProblem, 'secondary')] },
    ],
  },
  {
    title: '综合实践 设计教室装饰图',
    lessons: [
      {
        title: '装饰图中的奥秘',
        mappings: [mapping(shape), mapping(representProblem, 'secondary')],
      },
      { title: '设计装饰图', mappings: [mapping(shape), mapping(representProblem, 'secondary')] },
      { title: '装饰图展示会', mappings: [mapping(shape), mapping(representProblem, 'secondary')] },
    ],
  },
  {
    title: '第三单元 20以内数与减法',
    lessons: [
      { title: '买文具', mappings: [mapping(addSub20), mapping(count20, 'secondary')] },
      { title: '捉迷藏', mappings: [mapping(addSub20), mapping(representProblem, 'secondary')] },
      { title: '凑数游戏', mappings: [mapping(addSub20), mapping(count20, 'secondary')] },
      { title: '开会啦', mappings: [mapping(addSub20), mapping(representProblem, 'secondary')] },
      { title: '跳伞表演', mappings: [mapping(addSub20), mapping(count20, 'secondary')] },
      {
        title: '美丽的田园',
        mappings: [mapping(addSub20), mapping(representProblem, 'secondary')],
      },
      { title: '做个减法表', mappings: [mapping(addSub20), mapping(count20, 'secondary')] },
      { title: '整理与复习', mappings: [mapping(count20), mapping(addSub20, 'secondary')] },
    ],
  },
  {
    title: '第四单元 100以内数的认识',
    lessons: [
      { title: '身边的数', mappings: [mapping(count100), mapping(representProblem, 'secondary')] },
      { title: '数一数', mappings: [mapping(count100)] },
      { title: '数豆子', mappings: [mapping(count100), mapping(compareQuantity, 'secondary')] },
      { title: '谁的红果多', mappings: [mapping(count100), mapping(compareQuantity, 'secondary')] },
      {
        title: '小小养殖场',
        mappings: [mapping(count100), mapping(representProblem, 'secondary')],
      },
      { title: '做个百数表', mappings: [mapping(count100)] },
      { title: '整理与复习', mappings: [mapping(count100), mapping(compareQuantity, 'secondary')] },
      {
        title: '数学好玩 填数游戏',
        mappings: [mapping(count100), mapping(representProblem, 'secondary')],
      },
    ],
  },
  {
    title: '第五单元 100以内数加与减（一）',
    lessons: [
      { title: '小兔请客', mappings: [mapping(addSub100), mapping(count100, 'secondary')] },
      { title: '采松果', mappings: [mapping(addSub100), mapping(representProblem, 'secondary')] },
      { title: '青蛙吃虫子', mappings: [mapping(addSub100), mapping(count100, 'secondary')] },
      { title: '算一算', mappings: [mapping(addSub100)] },
      {
        title: '有趣的算式',
        mappings: [mapping(addSub100), mapping(representProblem, 'secondary')],
      },
      { title: '回收废品', mappings: [mapping(addSub100), mapping(representProblem, 'secondary')] },
      { title: '整理与复习', mappings: [mapping(addSub100), mapping(count100, 'secondary')] },
    ],
  },
  {
    title: '第六单元 有趣的平面图形（一）',
    lessons: [
      { title: '认识图形', mappings: [mapping(shape)] },
      { title: '动手做（一）', mappings: [mapping(shape), mapping(representProblem, 'secondary')] },
      { title: '动手做（二）', mappings: [mapping(shape), mapping(representProblem, 'secondary')] },
      { title: '动手做（三）', mappings: [mapping(shape), mapping(representProblem, 'secondary')] },
      { title: '拼图大挑战', mappings: [mapping(shape), mapping(representProblem, 'secondary')] },
    ],
  },
  {
    title: '综合实践 画数学连环画',
    lessons: [
      {
        title: '连环画中的数学故事',
        mappings: [mapping(representProblem), mapping(addSub100, 'secondary')],
      },
      {
        title: '画出我的数学故事',
        mappings: [mapping(representProblem), mapping(shape, 'secondary')],
      },
      {
        title: '数学连环画故事会',
        mappings: [mapping(representProblem), mapping(addSub100, 'secondary')],
      },
    ],
  },
  {
    title: '总复习',
    lessons: [
      { title: '数与代数', mappings: [mapping(count100), mapping(addSub100, 'secondary')] },
      { title: '图形与几何', mappings: [mapping(shape)] },
      {
        title: '综合与实践',
        mappings: [mapping(representProblem), mapping(count100, 'secondary')],
      },
    ],
  },
]

export const batch01MathG1S1Package = createPackage({
  packageId: 'B01_SZ_G1_MATH_S1_BNUP_2024_CANDIDATE',
  textbookId: 'B01_SZ_G1_MATH_S1_BNUP_2024_TEXTBOOK_CANDIDATE',
  title: '小学数学北师大版（2024）一年级上册（公开目录候选，待核验）',
  semester: 1,
  catalogSourceId: 'MATH-G1-UPPER-PUBLIC-CANDIDATE',
  publisherSourceId: 'BNUP-G1-MATH-S1-2024-PUBLISHER-CATALOG',
  units: upperUnits,
  knowledgePointIds: [
    count10,
    compareQuantity,
    addSub10,
    classify,
    shape,
    timeSequence,
    representProblem,
  ],
  relations: [
    {
      sourceKnowledgePointId: count10,
      targetKnowledgePointId: compareQuantity,
      relationType: 'prerequisite',
    },
    {
      sourceKnowledgePointId: compareQuantity,
      targetKnowledgePointId: addSub10,
      relationType: 'prerequisite',
    },
    {
      sourceKnowledgePointId: addSub10,
      targetKnowledgePointId: representProblem,
      relationType: 'related',
    },
  ],
})

export const batch01MathG1S2Package = createPackage({
  packageId: 'B01_SZ_G1_MATH_S2_BNUP_2024_CANDIDATE',
  textbookId: 'B01_SZ_G1_MATH_S2_BNUP_2024_TEXTBOOK_CANDIDATE',
  title: '小学数学北师大版（2024）一年级下册（公开目录候选，待核验）',
  semester: 2,
  catalogSourceId: 'MATH-G1-LOWER-PUBLIC-CANDIDATE',
  publisherSourceId: 'BNUP-G1-MATH-S2-2024-GOV-CATALOG',
  units: lowerUnits,
  knowledgePointIds: [
    count20,
    addSub20,
    shape,
    representProblem,
    compareQuantity,
    count100,
    addSub100,
  ],
  relations: [
    {
      sourceKnowledgePointId: count20,
      targetKnowledgePointId: addSub20,
      relationType: 'prerequisite',
    },
    {
      sourceKnowledgePointId: count100,
      targetKnowledgePointId: addSub100,
      relationType: 'prerequisite',
    },
    {
      sourceKnowledgePointId: shape,
      targetKnowledgePointId: representProblem,
      relationType: 'related',
    },
  ],
})
