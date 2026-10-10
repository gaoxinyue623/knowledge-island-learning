import recognition from './recognition-supplement.json'
import correction from './lesson-22-correction.json'
import supplied from './contents.json'
import { G1_PEP_CHINESE_PUBLISHER_ID } from '../../grade-1/chinese-pep-upper'
import {
  G6_CHINESE_IMPORT_APPROVAL as approval,
  G6_CHINESE_IMPORTED_AT as importedAt,
} from '../../production/gradeSixChineseApproval'
import type { CurriculumData } from '../../types'
import type { ContentExpansionBundle, Grade, Question, QuestionKnowledgePoint } from '@/types'

export const G6_PEP_CHINESE_S1_TEXTBOOK_ID = 'G6_PEP_CHINESE_S1_USER_IMPORTED'
export const G6_PEP_CHINESE_CONTENT_SOURCE_ID = 'G6_PEP_CHINESE_S1_USER_TEXT_V1'
export const G6_PEP_CHINESE_PRACTICE_SOURCE_ID = 'G6_PEP_CHINESE_S1_ORIGINAL_PRACTICE_V1'
export const G6_CHINESE_LESSON22_CONTENT_SOURCE_ID = 'G6_PEP_CHINESE_S1_LESSON22_IMAGES_V2'
export const G6_CHINESE_LESSON22_PRACTICE_SOURCE_ID = 'G6_PEP_CHINESE_S1_LESSON22_PRACTICE_V2'
export const G6_CHINESE_RECOGNITION_SOURCE_ID = 'G6_PEP_CHINESE_S1_RECOGNITION_USER_TEXT_V1'
export const gradeSixChineseLesson22Correction = correction
export const gradeSixChineseSource = supplied
export const gradeSixChineseGrade: Grade = {
  id: 'GRADE_6',
  code: 'G6',
  name: '六年级',
  sortOrder: 6,
  status: 'ACTIVE',
}
const reviewed = {
  isSample: false,
  needsVerification: false,
  verificationStatus: 'REVIEWED' as const,
  releaseApprovalId: approval,
}
const pad = (n: number) => String(n).padStart(2, '0')
export const gradeSixChineseDefinitions = [
  ...supplied.lessons.filter((d) => d.kind !== 'appendix'),
  recognition.lesson,
  ...supplied.lessons.filter((d) => d.kind === 'appendix'),
].map((d) => {
  return {
    ...d,
    ...(d.kind === 'appendix' && d.key !== recognition.lesson.key
      ? {
          sourceNote: d.sourceNote.replace(
            '附件未提供独立会认字表。',
            '独立会认字表已按用户后续来稿接入。',
          ),
          importNotes: d.importNotes.map((note) =>
            note.replace('附件未提供独立会认字表。', '独立会认字表已按用户后续来稿接入。'),
          ),
        }
      : {}),
    ...(d.key === correction.key ? correction : {}),
    revision: d.key === correction.key ? 2 : 1,
    unitId: `G6_PEP_CHINESE_S1_UNIT_${pad(d.unit)}`,
    lessonId: `G6_PEP_CHINESE_S1_LESSON_${d.key.toUpperCase().replaceAll('-', '_')}`,
    knowledgePointId: `G6_PEP_CHINESE_S1_KP_${d.key.toUpperCase().replaceAll('-', '_')}`,
  }
})
export const gradeSixChineseReadingOnlyIds = gradeSixChineseDefinitions
  .filter((d) => !d.questions.length)
  .map((d) => d.knowledgePointId)
export const gradeSixChineseAppendixIds = gradeSixChineseDefinitions
  .filter((d) => d.kind === 'appendix')
  .map((d) => d.knowledgePointId)
export const gradeSixChineseCurriculum: Pick<
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
      id: G6_PEP_CHINESE_S1_TEXTBOOK_ID,
      subjectId: 'SUBJECT_CHINESE',
      gradeId: 'GRADE_6',
      semesterId: 'SEMESTER_UPPER',
      publisherId: G1_PEP_CHINESE_PUBLISHER_ID,
      versionName: '统编（人教版）语文六年级上册·2022版',
      editionYear: 2022,
      sourceId: G6_PEP_CHINESE_CONTENT_SOURCE_ID,
      status: 'ACTIVE',
      createdAt: importedAt,
      updatedAt: '2026-10-09T04:16:18.443Z',
      ...reviewed,
    },
  ],
  units: supplied.units.map((unit) => ({
    id: `G6_PEP_CHINESE_S1_UNIT_${pad(unit.number)}`,
    textbookVersionId: G6_PEP_CHINESE_S1_TEXTBOOK_ID,
    code: `G6-PEP-CHINESE-S1-U${unit.number}`,
    title: unit.title,
    subtitle:
      unit.number === 9
        ? '按表认读、书写和复习，全册附录不对应单篇课文。'
        : '按导入目录阅读、交流与写作。',
    sortOrder: unit.number,
    sourceId: G6_PEP_CHINESE_CONTENT_SOURCE_ID,
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
      id: G6_CHINESE_RECOGNITION_SOURCE_ID,
      title: '六年级上册2022版独立识字表（用户提供）',
      sourceType: 'TEXTBOOK',
      publisher: supplied.publisher,
      edition: '2022版（用户标注）',
      sourceRef: 'user-provided://g6-pep-chinese-upper/recognition/2026-10-10',
      sourceVersion: `SHA256:${recognition.sourceSha256}`,
      copyrightStatus: 'PENDING',
      notes: recognition.lesson.sourceNote,
      verifiedAt: recognition.updatedAt,
      ...reviewed,
    },
    {
      id: G6_CHINESE_LESSON22_CONTENT_SOURCE_ID,
      title: '第22课教材图片校正版（第103—105页）',
      sourceType: 'TEXTBOOK',
      publisher: supplied.publisher,
      edition: supplied.title,
      sourceRef: 'user-provided://g6-pep-chinese-upper/lesson22-images/2026-10-09',
      sourceVersion: `SHA256:${correction.transcriptionSha256}`,
      copyrightStatus: 'PENDING',
      notes: correction.sourceNote,
      verifiedAt: correction.updatedAt,
      ...reviewed,
    },
    {
      id: G6_CHINESE_LESSON22_PRACTICE_SOURCE_ID,
      title: '第22课图片校正版原创理解题',
      sourceType: 'AI_GENERATED',
      sourceRef: 'local-original://g6-pep-chinese-upper/lesson22-practice-v2',
      sourceVersion: 'ORIGINAL_PRACTICE_V2',
      copyrightStatus: 'PENDING',
      notes: '依据三页教材图片正文编写理解题，旧续文题目退出当前题源。',
      verifiedAt: correction.updatedAt,
      ...reviewed,
    },
    {
      id: G6_PEP_CHINESE_CONTENT_SOURCE_ID,
      title: supplied.title,
      sourceType: 'TEXTBOOK',
      publisher: supplied.publisher,
      edition: supplied.title,
      sourceRef: 'user-provided://g6-pep-chinese-upper/2026-10-09',
      sourceVersion: `SHA256:${supplied.sourceSha256}`,
      copyrightStatus: 'PENDING',
      notes: supplied.sourceNote,
      verifiedAt: importedAt,
      ...reviewed,
    },
    {
      id: G6_PEP_CHINESE_PRACTICE_SOURCE_ID,
      title: '六年级上册语文原创阅读理解与学习提示',
      sourceType: 'AI_GENERATED',
      sourceRef: 'local-original://g6-pep-chinese-upper/practice-v1',
      sourceVersion: 'ORIGINAL_PRACTICE_V1',
      copyrightStatus: 'PENDING',
      notes:
        'Codex依据提供文本逐题编写并校验原文依据；栏目学习提示为项目原创，开放表达无唯一答案，不自动判分。',
      verifiedAt: importedAt,
      ...reviewed,
    },
  ],
}
export const gradeSixChineseQuestions: Question[] = []
export const gradeSixChineseMappings: QuestionKnowledgePoint[] = []
export const gradeSixChineseBundles: ContentExpansionBundle[] = []
const guidance: Record<string, string> = {
  oral: '先想清楚要告诉听众什么，按顺序介绍，留出时间倾听和提问。分享时不必公开家庭住址、联系方式等私人信息。',
  writing:
    '围绕题目选一件事或一个对象，列出要写的细节，按顺序写清楚，再读一遍检查是否通顺。续写和童话中的想象要与已有情节衔接。',
  garden:
    '回看本单元课文，挑出需要巩固的字词，摘录喜欢的句子，说说自己的发现。结合已提供的词句和积累内容练习表达。',
  'reading-bar': '按本栏目推荐书目阅读，记录书名，梳理情节与人物，尝试用自己的话讲述。',
  introduction: '先读单元导语，了解本单元的阅读和表达目标，再带着目标进入课文。',
  appendix: '按表认读或书写，标记还不熟悉的字词。词语表按原有单元顺序保留，不自动分配到单篇课文。',
  reading: '读懂人物、景物或事情，回到文中找依据，再用自己的话说出发现。',
  example: '看看例文如何围绕中心选材，找出具体事例和细节，再练习表达。',
}
for (const d of gradeSixChineseDefinitions) {
  const revision = d.revision
  const contentSourceId =
    d.key === recognition.lesson.key
      ? G6_CHINESE_RECOGNITION_SOURCE_ID
      : revision === 2
        ? G6_CHINESE_LESSON22_CONTENT_SOURCE_ID
        : G6_PEP_CHINESE_CONTENT_SOURCE_ID
  const practiceSourceId =
    revision === 2 ? G6_CHINESE_LESSON22_PRACTICE_SOURCE_ID : G6_PEP_CHINESE_PRACTICE_SOURCE_ID
  const contentImportedAt =
    d.key === recognition.lesson.key
      ? recognition.updatedAt
      : revision === 2
        ? correction.updatedAt
        : importedAt
  const sourceId = d.text ? contentSourceId : practiceSourceId
  const goals = d.questions.length
    ? ['读通提供的文本，抓住关键信息。', '根据原句解释自己的判断。', '用自己的话表达阅读发现。']
    : [d.kind === 'appendix' ? '对照字词表认读、书写与复习。' : `围绕“${d.title}”准备自己的表达。`]
  const order = gradeSixChineseDefinitions.filter((x) => x.unit === d.unit).indexOf(d) + 1
  gradeSixChineseCurriculum.lessons.push({
    id: d.lessonId,
    unitId: d.unitId,
    code: `G6-PEP-CHINESE-S1-${d.key}`,
    title: d.title,
    sortOrder: order,
    sourceId: contentSourceId,
    status: 'ACTIVE',
    ...reviewed,
  })
  gradeSixChineseCurriculum.knowledgePoints.push({
    id: d.knowledgePointId,
    code: `G6-PEP-CHINESE-S1-${d.key}`,
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
  gradeSixChineseCurriculum.lessonKnowledgePointRelations.push({
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
  const texts =
    revision === 2
      ? [
          d.sourceNote,
          `阅读提示\n${correction.readingPrompt}`,
          ...paragraphs,
          `教材脚注\n${correction.authorNote}`,
        ]
      : [d.sourceNote, ...paragraphs]
  if (!d.text) texts.push(`项目原创学习提示\n${guidance[d.kind]}`)
  gradeSixChineseCurriculum.courseContents.push({
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
      ...(revision === 2
        ? { readingPrompt: correction.readingPrompt, authorNote: correction.authorNote }
        : {}),
      sourceNote: d.sourceNote,
      lessonKind: d.kind,
      missingSections: d.missingSections,
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
    const offset = (order + index) % seed.options.length
    const original = seed.options.map((label, n) => ({ label, n }))
    const labels = [...original.slice(offset), ...original.slice(0, offset)]
    const question: Question = {
      id,
      textbookVersionId: G6_PEP_CHINESE_S1_TEXTBOOK_ID,
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
      tags: ['g6-pep-chinese-upper-original', 'provided-text-comprehension'],
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
    gradeSixChineseQuestions.push(question)
    gradeSixChineseMappings.push({
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
  gradeSixChineseBundles.push({
    textbookId: G6_PEP_CHINESE_S1_TEXTBOOK_ID,
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
