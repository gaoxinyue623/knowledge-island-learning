import supplied from './contents.json'
import remaining from './remaining.json'
import lesson21 from './lesson-21-supplement.json'
import unit6Correction from './unit-6-correction.json'
import { G1_PEP_CHINESE_PUBLISHER_ID } from '../../grade-1/chinese-pep-upper'
import {
  G6_CHINESE_2019_IMPORT_APPROVAL as approval,
  G6_CHINESE_2019_IMPORTED_AT as importedAt,
} from '../../production/gradeSixChinese2019Approval'
import type { CurriculumData } from '../../types'
import type { ContentExpansionBundle, Question, QuestionKnowledgePoint } from '@/types'

export const G6_PEP_CHINESE_2019_S1_TEXTBOOK_ID = 'G6_PEP_CHINESE_2019_S1_USER_IMPORTED'
export const G6_PEP_CHINESE_2019_CONTENT_SOURCE_ID = 'G6_PEP_CHINESE_2019_S1_USER_TEXT_V1'
export const G6_PEP_CHINESE_2019_PRACTICE_SOURCE_ID = 'G6_PEP_CHINESE_2019_S1_ORIGINAL_PRACTICE_V1'
export const G6_PEP_CHINESE_2019_REMAINING_CONTENT_SOURCE_ID =
  'G6_PEP_CHINESE_2019_S1_REMAINING_TEXT_V1'
export const G6_PEP_CHINESE_2019_REMAINING_PRACTICE_SOURCE_ID =
  'G6_PEP_CHINESE_2019_S1_REMAINING_PRACTICE_V1'
export const G6_CHINESE_2019_LESSON21_CONTENT_SOURCE_ID = 'G6_PEP_CHINESE_2019_S1_LESSON21_TEXT_V2'
export const G6_CHINESE_2019_LESSON21_PRACTICE_SOURCE_ID =
  'G6_PEP_CHINESE_2019_S1_LESSON21_PRACTICE_V2'
export const G6_CHINESE_2019_UNIT6_CONTENT_SOURCE_ID = 'G6_PEP_CHINESE_2019_S1_UNIT6_CORRECTION_V1'
export const G6_CHINESE_2019_POEMS_PRACTICE_SOURCE_ID = 'G6_PEP_CHINESE_2019_S1_POEMS18_PRACTICE_V1'
export const gradeSixChinese2019Unit6Correction = unit6Correction
export const gradeSixChinese2019Lesson21Supplement = lesson21
export const gradeSixChinese2019RemainingSource = remaining
export const gradeSixChinese2019Source = supplied
const reviewed = {
  isSample: false,
  needsVerification: false,
  verificationStatus: 'REVIEWED' as const,
  releaseApprovalId: approval,
}
const pad = (n: number) => String(n).padStart(2, '0')
// Keep persisted identifiers tied to the original texts when display lesson numbers change.
const originalLessons = [...supplied.lessons, ...remaining.lessons]
const currentLessons = originalLessons.flatMap((d) =>
  d.key === 'reading-18' ? [unit6Correction.lesson, d] : [d],
)
export const gradeSixChinese2019Definitions = currentLessons.map((d) => {
  return {
    ...d,
    ...unit6Correction.renumberings.find((entry) => entry.key === d.key),
    ...(d.key === lesson21.key ? lesson21 : {}),
    revision: d.key === lesson21.key ? 2 : 1,
    isRemaining: d.unit >= 4,
    unitId: `G6_PEP_CHINESE_2019_S1_UNIT_${pad(d.unit)}`,
    lessonId: `G6_PEP_CHINESE_2019_S1_LESSON_${d.key.toUpperCase().replaceAll('-', '_')}`,
    knowledgePointId: `G6_PEP_CHINESE_2019_S1_KP_${d.key.toUpperCase().replaceAll('-', '_')}`,
  }
})
export const gradeSixChinese2019ReadingOnlyIds = gradeSixChinese2019Definitions
  .filter((d) => !d.questions.length)
  .map((d) => d.knowledgePointId)
export const gradeSixChinese2019AppendixIds = gradeSixChinese2019Definitions
  .filter((d) => d.kind === 'appendix')
  .map((d) => d.knowledgePointId)
export const gradeSixChinese2019Curriculum: Pick<
  CurriculumData,
  | 'textbooks'
  | 'units'
  | 'lessons'
  | 'knowledgePoints'
  | 'lessonKnowledgePointRelations'
  | 'knowledgePrerequisites'
  | 'courseContents'
  | 'sources'
> = {
  textbooks: [
    {
      id: G6_PEP_CHINESE_2019_S1_TEXTBOOK_ID,
      subjectId: 'SUBJECT_CHINESE',
      gradeId: 'GRADE_6',
      semesterId: 'SEMESTER_UPPER',
      publisherId: G1_PEP_CHINESE_PUBLISHER_ID,
      versionName: remaining.title,
      editionYear: 2019,
      sourceId: G6_PEP_CHINESE_2019_CONTENT_SOURCE_ID,
      status: 'ACTIVE',
      createdAt: importedAt,
      updatedAt: unit6Correction.updatedAt,
      ...reviewed,
    },
  ],
  units: [...supplied.units, ...remaining.units].map((unit) => ({
    id: `G6_PEP_CHINESE_2019_S1_UNIT_${pad(unit.number)}`,
    textbookVersionId: G6_PEP_CHINESE_2019_S1_TEXTBOOK_ID,
    code: `G6_2019-PEP-CHINESE-S1-U${unit.number}`,
    title: unit.title,
    subtitle:
      unit.number === 9
        ? '按表认读、书写和复习，全册附录不对应单篇课文。'
        : '按导入目录阅读、交流与写作。',
    sortOrder: unit.number,
    sourceId:
      unit.number >= 4
        ? G6_PEP_CHINESE_2019_REMAINING_CONTENT_SOURCE_ID
        : G6_PEP_CHINESE_2019_CONTENT_SOURCE_ID,
    status: 'ACTIVE',
    ...reviewed,
  })),
  lessons: [],
  knowledgePoints: [],
  lessonKnowledgePointRelations: [],
  knowledgePrerequisites: [],
  courseContents: [],
  sources: [
    {
      id: G6_CHINESE_2019_UNIT6_CONTENT_SOURCE_ID,
      title: '2019版第六单元目录更正与第18课古诗三首',
      sourceType: 'TEXTBOOK',
      publisher: supplied.publisher,
      edition: remaining.title,
      sourceRef: 'user-provided://g6-2019-pep-chinese-upper/2026-10-09/unit6-correction',
      sourceVersion: `SHA256:${unit6Correction.sourceSha256}`,
      copyrightStatus: 'PENDING',
      notes: unit6Correction.sourceNote,
      verifiedAt: unit6Correction.updatedAt,
      ...reviewed,
    },
    {
      id: G6_CHINESE_2019_POEMS_PRACTICE_SOURCE_ID,
      title: '2019版第18课古诗三首原创理解题',
      sourceType: 'AI_GENERATED',
      sourceRef: 'local-original://g6-2019-pep-chinese-upper/poems18-practice-v1',
      sourceVersion: 'POEMS18_PRACTICE_V1',
      copyrightStatus: 'PENDING',
      notes: '每首古诗对应一道理解题，原句依据取自用户本次补充。',
      verifiedAt: unit6Correction.updatedAt,
      ...reviewed,
    },
    {
      id: G6_CHINESE_2019_LESSON21_CONTENT_SOURCE_ID,
      title: '2019版第21课《三黑和土地》补充正文与字词',
      sourceType: 'TEXTBOOK',
      publisher: supplied.publisher,
      edition: remaining.title,
      sourceRef: 'user-provided://g6-2019-pep-chinese-upper/2026-10-09/lesson21',
      sourceVersion: `SHA256:${lesson21.sourceSha256}`,
      copyrightStatus: 'PENDING',
      notes: lesson21.sourceNote + lesson21.importNotes.join(''),
      verifiedAt: lesson21.updatedAt,
      ...reviewed,
    },
    {
      id: G6_CHINESE_2019_LESSON21_PRACTICE_SOURCE_ID,
      title: '2019版第21课《三黑和土地》补充文本配套理解题',
      sourceType: 'AI_GENERATED',
      sourceRef: 'local-original://g6-2019-pep-chinese-upper/lesson21-practice-v2',
      sourceVersion: 'LESSON21_PRACTICE_V2',
      copyrightStatus: 'PENDING',
      notes: '三道项目原创题逐题核对本次补充正文，旧题留在历史作答中，不用于新一轮练习。',
      verifiedAt: lesson21.updatedAt,
      ...reviewed,
    },
    {
      id: G6_PEP_CHINESE_2019_REMAINING_CONTENT_SOURCE_ID,
      title: remaining.title + '第4—8单元与词语表',
      sourceType: 'TEXTBOOK',
      publisher: supplied.publisher,
      edition: remaining.title,
      sourceRef: 'user-provided://g6-2019-pep-chinese-upper/2026-10-09/remaining',
      sourceVersion: `SHA256:${remaining.sourceSha256}`,
      copyrightStatus: 'PENDING',
      notes: remaining.sourceNote,
      verifiedAt: remaining.updatedAt,
      ...reviewed,
    },
    {
      id: G6_PEP_CHINESE_2019_REMAINING_PRACTICE_SOURCE_ID,
      title: '2019版六年级上册第4—8单元原创阅读理解与学习提示',
      sourceType: 'AI_GENERATED',
      sourceRef: 'local-original://g6-2019-pep-chinese-upper/remaining-practice-v1',
      sourceVersion: 'REMAINING_PRACTICE_V1',
      copyrightStatus: 'PENDING',
      notes: '依据本次附件逐题校验原文依据；第17项为同版第15课例文引用，不重复计分；第21课待补。',
      verifiedAt: remaining.updatedAt,
      ...reviewed,
    },
    {
      id: G6_PEP_CHINESE_2019_CONTENT_SOURCE_ID,
      title: supplied.title,
      sourceType: 'TEXTBOOK',
      publisher: supplied.publisher,
      edition: supplied.title,
      sourceRef: 'user-provided://g6-2019-pep-chinese-upper/2026-10-09',
      sourceVersion: `SHA256:${supplied.sourceSha256}`,
      copyrightStatus: 'PENDING',
      notes: supplied.sourceNote,
      verifiedAt: importedAt,
      ...reviewed,
    },
    {
      id: G6_PEP_CHINESE_2019_PRACTICE_SOURCE_ID,
      title: '六年级上册语文原创阅读理解与学习提示',
      sourceType: 'AI_GENERATED',
      sourceRef: 'local-original://g6-2019-pep-chinese-upper/practice-v1',
      sourceVersion: 'ORIGINAL_PRACTICE_V1',
      copyrightStatus: 'PENDING',
      notes:
        'Codex依据提供文本逐题编写并校验原文依据；栏目学习提示为项目原创，开放表达无唯一答案，不自动判分。',
      verifiedAt: importedAt,
      ...reviewed,
    },
  ],
}
export const gradeSixChinese2019Questions: Question[] = []
export const gradeSixChinese2019Mappings: QuestionKnowledgePoint[] = []
export const gradeSixChinese2019Bundles: ContentExpansionBundle[] = []
const guidance: Record<string, string> = {
  oral: '先想清楚要告诉听众什么，按顺序介绍，留出时间倾听和提问。分享时不必公开家庭住址、联系方式等私人信息。',
  writing:
    '围绕题目选一件事或一个对象，列出要写的细节，按顺序写清楚，再读一遍检查是否通顺。续写和童话中的想象要与已有情节衔接。',
  garden:
    '回看本单元课文，挑出需要巩固的字词，摘录喜欢的句子，说说自己的发现。结合已提供的词句和积累内容练习表达。',
  'reading-bar': '选择一个民间故事，记录书名，梳理起因、经过和结果，尝试用自己的话讲述。',
  introduction: '先读单元导语，了解本单元的阅读和表达目标，再带着目标进入课文。',
  appendix: '按表认读或书写，标记还不熟悉的字词。词语表按原有单元顺序保留，不自动分配到单篇课文。',
  reading: '读懂人物、景物或事情，回到文中找依据，再用自己的话说出发现。',
  example: '观察例文如何围绕中心选材，找到人物的动作、语言和心理描写，再试着表达自己的中心意思。',
}
for (const d of gradeSixChinese2019Definitions) {
  const revision = d.revision
  const isNewPoems = d.key === unit6Correction.lesson.key
  const contentSourceId = isNewPoems
    ? G6_CHINESE_2019_UNIT6_CONTENT_SOURCE_ID
    : revision === 2
      ? G6_CHINESE_2019_LESSON21_CONTENT_SOURCE_ID
      : d.isRemaining
        ? G6_PEP_CHINESE_2019_REMAINING_CONTENT_SOURCE_ID
        : G6_PEP_CHINESE_2019_CONTENT_SOURCE_ID
  const practiceSourceId = isNewPoems
    ? G6_CHINESE_2019_POEMS_PRACTICE_SOURCE_ID
    : revision === 2
      ? G6_CHINESE_2019_LESSON21_PRACTICE_SOURCE_ID
      : d.isRemaining
        ? G6_PEP_CHINESE_2019_REMAINING_PRACTICE_SOURCE_ID
        : G6_PEP_CHINESE_2019_PRACTICE_SOURCE_ID
  const contentImportedAt = isNewPoems
    ? unit6Correction.updatedAt
    : revision === 2
      ? lesson21.updatedAt
      : d.isRemaining
        ? remaining.updatedAt
        : importedAt
  const sourceId = d.text ? contentSourceId : practiceSourceId
  const goals = d.questions.length
    ? ['读通提供的文本，抓住关键信息。', '根据原句解释自己的判断。', '用自己的话表达阅读发现。']
    : [d.kind === 'appendix' ? '对照字词表认读、书写与复习。' : `围绕“${d.title}”准备自己的表达。`]
  const order = gradeSixChinese2019Definitions.filter((x) => x.unit === d.unit).indexOf(d) + 1
  // Inserting a lesson must not rotate the answer keys of existing saved questions.
  const originalOrder =
    originalLessons.filter((x) => x.unit === d.unit).findIndex((x) => x.key === d.key) + 1
  const questionOrder = originalOrder || order
  gradeSixChinese2019Curriculum.lessons.push({
    id: d.lessonId,
    unitId: d.unitId,
    code: `G6_2019-PEP-CHINESE-S1-${d.key}`,
    title: d.title,
    sortOrder: order,
    sourceId: contentSourceId,
    status: 'ACTIVE',
    ...reviewed,
  })
  gradeSixChinese2019Curriculum.knowledgePoints.push({
    id: d.knowledgePointId,
    code: `G6_2019-PEP-CHINESE-S1-${d.key}`,
    name: d.title,
    subjectId: 'SUBJECT_CHINESE',
    gradeScope: { minGrade: 6, maxGrade: 6, explicitGradeIds: ['GRADE_6'] },
    description: d.sourceNote,
    learningObjective: goals,
    abilityTags: d.questions.length ? ['阅读理解', '原文依据', '表达交流'] : ['阅读与表达'],
    difficultyLevel: 'STANDARD',
    sourceId: contentSourceId,
    status: 'ACTIVE',
    ...reviewed,
  })
  gradeSixChinese2019Curriculum.lessonKnowledgePointRelations.push({
    id: `${d.knowledgePointId}_LKP`,
    lessonId: d.lessonId,
    knowledgePointId: d.knowledgePointId,
    relationType: 'CORE',
    order: 1,
    isPrimary: true,
    sourceId: contentSourceId,
    status: 'ACTIVE',
    ...reviewed,
  })
  const paragraphs = d.text
    .replaceAll('**', '')
    .replace(/^#{2,4} /gm, '')
    .split(/\n\n+/)
    .filter(Boolean)
  const texts = [d.sourceNote, ...paragraphs]
  const reference =
    d.key === 'reading-17'
      ? gradeSixChinese2019Definitions.find((item) => item.key === 'reading-15')
      : undefined
  if (reference) texts.push(`例文引用：本版第15课《盼》\n\n${reference.text}`)
  if (!d.text) texts.push(`项目原创学习提示\n${guidance[d.kind]}`)
  gradeSixChinese2019Curriculum.courseContents.push({
    id: `${d.knowledgePointId}_CONTENT_V${revision}`,
    knowledgePointId: d.knowledgePointId,
    title: d.title,
    contentType: d.text ? 'TEXTBOOK' : 'EXTENSION',
    contentFormat: 'TEXT',
    body: {
      lessonId: d.lessonId,
      summary: d.sourceNote,
      learningGoals: goals,
      sourceScope: d.text ? 'USER_PROVIDED_TEXT' : 'DIRECTORY_WITH_ORIGINAL_GUIDANCE',
      suppliedText: d.text,
      ...(reference
        ? { referenceLessonId: reference.lessonId, referenceText: reference.text }
        : {}),
      sourceNote: d.sourceNote,
      lessonKind: d.kind,
      missingSections: [],
      importNotes: d.importNotes,
      blocks: texts.map((text) => ({ type: 'TEXT', text })),
    },
    difficulty: 'STANDARD',
    sourceId,
    status: 'PUBLISHED',
    currentVersion: revision,
    createdAt: contentImportedAt,
    updatedAt: contentImportedAt,
    ...reviewed,
  })
  for (const [index, seed] of d.questions.entries()) {
    const id = `${d.knowledgePointId}_Q${index + 1}${revision === 2 ? '_R2' : ''}`
    const offset = (questionOrder + index) % seed.options.length
    const original = seed.options.map((label, n) => ({ label, n }))
    const labels = [...original.slice(offset), ...original.slice(0, offset)]
    const question: Question = {
      id,
      textbookVersionId: G6_PEP_CHINESE_2019_S1_TEXTBOOK_ID,
      knowledgePointId: d.knowledgePointId,
      gradeId: 'GRADE_6',
      semesterId: 'SEMESTER_UPPER',
      subjectId: 'SUBJECT_CHINESE',
      questionType: 'singleChoice',
      stem: [{ type: 'TEXT', text: seed.stem }],
      options: labels.map((option, n) => ({
        id: `${id}:option:${n}`,
        questionId: id,
        optionKey: String.fromCharCode(65 + n),
        content: [{ type: 'TEXT', text: option.label }],
        sortOrder: n,
      })),
      answerRule: {
        ruleType: 'SINGLE_OPTION',
        correctOptionKey: String.fromCharCode(
          65 + labels.findIndex((o) => o.n === seed.correctIndex),
        ),
      },
      difficulty: index === 0 ? 'FOUNDATION' : 'STANDARD',
      contentType: 'EXTENSION',
      sourceId: practiceSourceId,
      status: 'PUBLISHED',
      estimatedSeconds: 90,
      tags: ['g6-2019-pep-chinese-upper-original', 'provided-text-comprehension'],
      hints: [
        {
          id: `${id}:hint`,
          order: 1,
          trigger: 'ON_REQUEST',
          content: [{ type: 'TEXT', text: '回到提供的文本，检查人物、动作和结果。' }],
        },
      ],
      explanation: { summary: [{ type: 'TEXT', text: seed.explanation }], steps: [] },
      media: [],
      questionVersion: revision,
      ...reviewed,
    }
    gradeSixChinese2019Questions.push(question)
    gradeSixChinese2019Mappings.push({
      id: `mapping:${id}`,
      questionId: id,
      knowledgePointId: d.knowledgePointId,
      relationType: 'PRIMARY',
      weight: 1,
      order: index + 1,
      isPrimary: true,
      sourceId: practiceSourceId,
      status: 'ACTIVE',
      ...reviewed,
    })
  }
  const blockId = `${d.knowledgePointId}:intro`
  gradeSixChinese2019Bundles.push({
    textbookId: G6_PEP_CHINESE_2019_S1_TEXTBOOK_ID,
    unitId: d.unitId,
    lessonId: d.lessonId,
    knowledgePointId: d.knowledgePointId,
    learningContent: {
      id: `${d.knowledgePointId}:learning:v${revision}`,
      lessonId: d.lessonId,
      knowledgePointId: d.knowledgePointId,
      title: d.title,
      learningGoals: goals,
      blocks: [
        {
          id: blockId,
          block: { type: 'TEXT', text: guidance[d.kind]! },
          stepType: 'intro',
          sort: 1,
          ...reviewed,
        },
      ],
      steps: [
        {
          id: `${blockId}:step`,
          type: 'intro',
          contentBlockIds: [blockId],
          required: true,
          sort: 1,
        },
      ],
      sourceId: practiceSourceId,
      status: 'PUBLISHED',
      contentStatus: 'PUBLISHED',
      currentVersion: revision,
      createdAt: contentImportedAt,
      updatedAt: contentImportedAt,
      ...reviewed,
    },
    activities: [],
    exerciseTemplates: [],
    practiceSets: [],
    challenges: [],
    extensionActivities: [
      {
        id: `${d.knowledgePointId}:expression`,
        knowledgePointId: d.knowledgePointId,
        title: d.questions.length ? '阅读后，说一说' : '项目原创开放活动',
        instruction: d.questions.length
          ? '选一处原文，介绍你读到的发现，再说说理由。'
          : `围绕“${d.title}”，按提示读一读、说一说或写一写。`,
        content: { blocks: [{ type: 'hint', value: guidance[d.kind]! }] },
        referenceAnswer:
          '表达没有唯一答案，可以请老师或家长帮你检查是否清楚、是否有依据；不自动判分。',
        sourceId: practiceSourceId,
        ...reviewed,
      },
    ],
  })
}
