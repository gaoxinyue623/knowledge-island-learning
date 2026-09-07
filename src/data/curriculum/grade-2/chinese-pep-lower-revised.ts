import type { ContentSource, CourseContent, KnowledgePoint, Lesson, Unit } from '@/types'
import { G1_PEP_CHINESE_PUBLISHER_ID } from '../grade-1/chinese-pep-upper'
import {
  gradeTwoChineseLowerCurriculum,
  type GradeTwoChineseLowerCurriculumData,
} from './chinese-pep-lower'
import { revisedChineseLowerTexts } from './chinese-pep-lower-revised-texts'
import {
  revisedChineseAppendixCounts,
  revisedChineseLowerAppendix,
} from './chinese-pep-lower-revised-appendix'

export const G2_REVISED_CHINESE_PREFIX = 'G2_PEP_CHINESE_S2_REVISED'
export const G2_REVISED_CHINESE_TEXTBOOK_ID = `${G2_REVISED_CHINESE_PREFIX}_CANDIDATE`
export const G2_REVISED_CHINESE_SOURCE_ID = `${G2_REVISED_CHINESE_PREFIX}_USER_TEXT_20260906`
export const G2_REVISED_CHINESE_EXERCISE_SOURCE_ID = `${G2_REVISED_CHINESE_PREFIX}_ORIGINAL_EXERCISES_V1`
const timestamp = '2026-09-06T00:00:00+08:00'
const unverified = { needsVerification: true, verificationStatus: 'UNVERIFIED' as const }

export const revisedChineseImportNotes = {
  sourceVersion: 'USER_PROVIDED_DIRECTORY_AND_TEXT_2026-09-06',
  publicationEditionConfirmed: false,
  previousTextbookId: gradeTwoChineseLowerCurriculum.textbooks[0]!.id,
  historyPolicy: 'SEPARATE_TEXTBOOK_AND_KNOWLEDGE_IDENTITIES',
  appendixCounts: revisedChineseAppendixCounts,
  corrections: [
    {
      lessonKey: 'GARDEN_7',
      supplied: '予善则迁，有过则改。',
      imported: '见善则迁，有过则改。',
      reference: 'https://ctext.org/book-of-changes/yi5/zhs',
    },
  ],
  formatting: [
    '课文、诗歌和故事题名加书名号；保留正文段落，移除 Markdown 和装饰符号。',
    '第14课按目录先《绝句》后《晓出净慈寺送林子方》，两首诗正文均保留。',
    '语文园地三使用输入中明确的“十二生肖”标题；园地七去掉与所列名言不符的“二十四节气”标签。',
  ],
  unresolved: [
    '附录保留提供的原有单元分组和重复条目，不能当作已核对的450/250字清单。',
    '附录第二单元仍有《一匹出色的马》词语、第八单元仍有旧目录词语；未擅自重分配。',
    '《画杨桃》的“不……像。”、《传统节日》的“粽子艾香”等按本次输入保留，不宣称已对照出版物。',
    '《太空生活趣事多》保留输入描述；配套练习仅询问文意，不作为现行航天技术资料。',
  ],
}

const unitTitles = [
  '第一单元·阅读',
  '第二单元·阅读',
  '第三单元·识字',
  '第四单元·阅读',
  '第五单元·阅读',
  '第六单元·阅读',
  '第七单元·阅读',
  '第八单元·阅读',
]
const unitSubtitles = [
  '寻找春天，发现身边的美。',
  '读懂关爱，珍惜劳动。',
  '认识汉字，感受传统文化。',
  '展开想象，分享心中的故事。',
  '观察与思考，读懂寓言里的道理。',
  '读诗赏景，发现自然和太空的趣味。',
  '走进童话，认识成长和改变。',
  '读神话与传说，感受勇气和智慧。',
]

export const revisedChineseLowerRows = revisedChineseLowerTexts.map((definition) => ({
  ...definition,
  unitId: `${G2_REVISED_CHINESE_PREFIX}_UNIT_${String(definition.unit).padStart(2, '0')}`,
  lessonId: `${G2_REVISED_CHINESE_PREFIX}_LESSON_${definition.key}`,
  knowledgePointId: `${G2_REVISED_CHINESE_PREFIX}_KP_${definition.key}`,
  displayTitle: `《${definition.title.replace(/^\d+\s*/u, '')}》`,
}))

const sources: ContentSource[] = [
  {
    id: G2_REVISED_CHINESE_SOURCE_ID,
    sourceType: 'TEXTBOOK',
    title: '用户提供的二年级下册语文目录、正文与附录（含《我不是最弱小的》）',
    publisher: '人民教育出版社（用户标注）',
    edition: '二年级下册，含《我不是最弱小的》；出版年份未确认',
    sourceRef: 'user-provided://g2-chinese-lower/revised/2026-09-06',
    sourceVersion: revisedChineseImportNotes.sourceVersion,
    copyrightStatus: 'PENDING',
    license: '用户提供的本地个人学习文本；未据此确认公开再分发授权。',
    attribution: '2026-09-06 用户提供文本；修订明细见 revisedChineseImportNotes。',
    notes: '目录与旧版不同，独立接入，不覆盖既有教材和学习记录。附录仅收录实际提供条目。',
    verificationStatus: 'UNVERIFIED',
  },
  {
    id: G2_REVISED_CHINESE_EXERCISE_SOURCE_ID,
    sourceType: 'AI_GENERATED',
    title: '二年级下册本次目录配套原创阅读、字词与表达练习',
    sourceRef: 'local-authored://g2-chinese-lower/revised/exercises-v1',
    sourceVersion: 'ORIGINAL_EXERCISES_V1',
    copyrightStatus: 'UNKNOWN',
    notes: '配套练习独立编写，不是教材原题；封闭题使用确定性答案，开放表达不自动判分。',
    verificationStatus: 'UNVERIFIED',
  },
]

const units: Unit[] = unitTitles.map((title, index) => ({
  id: `${G2_REVISED_CHINESE_PREFIX}_UNIT_${String(index + 1).padStart(2, '0')}`,
  textbookVersionId: G2_REVISED_CHINESE_TEXTBOOK_ID,
  code: `${G2_REVISED_CHINESE_PREFIX}_UNIT_${String(index + 1).padStart(2, '0')}`,
  title,
  subtitle: unitSubtitles[index]!,
  sortOrder: index + 1,
  sceneKey: `g2-chinese-lower-revised-unit-${index + 1}`,
  status: 'ACTIVE',
  sourceId: G2_REVISED_CHINESE_SOURCE_ID,
  ...unverified,
}))

const lessons: Lesson[] = revisedChineseLowerRows.map((row) => ({
  id: row.lessonId,
  code: row.lessonId,
  unitId: row.unitId,
  title: row.title,
  sortOrder:
    revisedChineseLowerRows
      .filter((other) => other.unit === row.unit)
      .findIndex((other) => other.key === row.key) + 1,
  status: 'ACTIVE',
  sourceId: G2_REVISED_CHINESE_SOURCE_ID,
  ...unverified,
}))

const knowledgePoints: KnowledgePoint[] = revisedChineseLowerRows.map((row) => ({
  id: row.knowledgePointId,
  code: `CN-G2-S2-REVISED-${row.key}`,
  name: `${row.displayTitle} · 学习要点`,
  subjectId: gradeTwoChineseLowerCurriculum.subject.id,
  gradeScope: { minGrade: 2, maxGrade: 2, explicitGradeIds: ['GRADE_2'] },
  description: `朗读${row.displayTitle}，找到文中依据，积累字词并练习表达。`,
  learningObjective: [
    `能朗读${row.displayTitle}并说出其中的信息。`,
    '能结合上下文理解词语，用自己的话说完整的句子。',
  ],
  abilityTags: [row.unit === 3 ? '识字方法' : '阅读理解', '词语积累', '表达交流'],
  difficultyLevel: 'FOUNDATION',
  status: 'ACTIVE',
  sourceId: G2_REVISED_CHINESE_SOURCE_ID,
  ...unverified,
}))

const courseContents: CourseContent[] = revisedChineseLowerRows.map((row, index) => ({
  id: `${G2_REVISED_CHINESE_PREFIX}_CONTENT_${row.key}`,
  knowledgePointId: row.knowledgePointId,
  title: row.displayTitle,
  contentType: 'TEXTBOOK',
  contentFormat: 'TEXT',
  body: {
    lessonId: row.lessonId,
    sourceScope: 'USER_PROVIDED_LOCAL',
    sourceVersion: revisedChineseImportNotes.sourceVersion,
    summary: knowledgePoints[index]!.description,
    learningGoals: knowledgePoints[index]!.learningObjective,
    focus: knowledgePoints[index]!.abilityTags,
    blocks: [
      { type: 'TEXT', text: `${row.displayTitle}\n\n${row.text}` },
      ...(row.key === 'GARDEN_8' ? [{ type: 'TEXT', text: revisedChineseLowerAppendix }] : []),
    ],
  },
  sourceId: G2_REVISED_CHINESE_SOURCE_ID,
  difficulty: 'FOUNDATION',
  status: 'DRAFT',
  currentVersion: 1,
  isSample: false,
  ...unverified,
  createdAt: timestamp,
  updatedAt: timestamp,
}))

export const revisedChineseLowerCurriculum: GradeTwoChineseLowerCurriculumData = {
  grade: gradeTwoChineseLowerCurriculum.grade,
  semester: gradeTwoChineseLowerCurriculum.semester,
  subject: gradeTwoChineseLowerCurriculum.subject,
  publishers: gradeTwoChineseLowerCurriculum.publishers,
  regions: [],
  regionTextbookRelations: [],
  sources,
  textbooks: [
    {
      id: G2_REVISED_CHINESE_TEXTBOOK_ID,
      subjectId: gradeTwoChineseLowerCurriculum.subject.id,
      gradeId: 'GRADE_2',
      semesterId: 'SEMESTER_LOWER',
      publisherId: G1_PEP_CHINESE_PUBLISHER_ID,
      versionName: '人教版（统编版）语文二年级下册（含《我不是最弱小的》）',
      sourceId: G2_REVISED_CHINESE_SOURCE_ID,
      status: 'ACTIVE',
      ...unverified,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ],
  units,
  lessons,
  knowledgePoints,
  courseContents,
  lessonKnowledgePointRelations: revisedChineseLowerRows.map((row) => ({
    id: `${G2_REVISED_CHINESE_PREFIX}_LKP_${row.key}`,
    lessonId: row.lessonId,
    knowledgePointId: row.knowledgePointId,
    relationType: 'CORE',
    order: 1,
    isPrimary: true,
    sourceId: G2_REVISED_CHINESE_SOURCE_ID,
    status: 'ACTIVE',
    ...unverified,
  })),
  knowledgePrerequisites: revisedChineseLowerRows.slice(1).map((row, index) => ({
    id: `${G2_REVISED_CHINESE_PREFIX}_PREREQUISITE_${row.key}`,
    prerequisiteKnowledgePointId: revisedChineseLowerRows[index]!.knowledgePointId,
    dependentKnowledgePointId: row.knowledgePointId,
    relationType: 'RECOMMENDED',
    sourceId: G2_REVISED_CHINESE_SOURCE_ID,
    status: 'DRAFT',
    ...unverified,
  })),
}
