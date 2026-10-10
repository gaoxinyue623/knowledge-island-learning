import supplied from './contents.json'
import literacy from './literacy-tables.json'
import { G1_PEP_CHINESE_PUBLISHER_ID } from '../../grade-1/chinese-pep-upper'
import {
  G3_CHINESE_LOWER_IMPORT_APPROVAL as approval,
  G3_CHINESE_LOWER_IMPORTED_AT as importedAt,
  G3_CHINESE_LOWER_LITERACY_IMPORTED_AT as literacyImportedAt,
  G3_CHINESE_LOWER_LITERACY_REVISED_AT as literacyRevisedAt,
} from '../../production/gradeThreeChineseLowerApproval'
import type { CurriculumData } from '../../types'
import type { ContentExpansionBundle, Grade, Question, QuestionKnowledgePoint } from '@/types'

export const G3_PEP_CHINESE_S2_TEXTBOOK_ID = 'G3_PEP_CHINESE_S2_USER_IMPORTED'
export const G3_PEP_CHINESE_LOWER_CONTENT_SOURCE_ID = 'G3_PEP_CHINESE_S2_USER_TEXT_V1'
export const G3_PEP_CHINESE_LOWER_PRACTICE_SOURCE_ID = 'G3_PEP_CHINESE_S2_ORIGINAL_PRACTICE_V1'
export const G3_PEP_CHINESE_LOWER_LITERACY_SOURCE_ID = 'G3_PEP_CHINESE_S2_USER_LITERACY_V1'
export const gradeThreeChineseLowerSource = supplied
export const gradeThreeChineseLowerLiteracySource = literacy
export const gradeThreeChineseLowerGrade: Grade = {
  id: 'GRADE_3',
  code: 'G3',
  name: '三年级',
  sortOrder: 3,
  status: 'ACTIVE',
}
const reviewed = {
  isSample: false,
  needsVerification: false,
  verificationStatus: 'REVIEWED' as const,
  releaseApprovalId: approval,
}
const pad = (n: number) => String(n).padStart(2, '0')
export const gradeThreeChineseLowerDefinitions = [...supplied.lessons, ...literacy.tables].map(
  (d) => ({
    ...d,
    unitId: `G3_PEP_CHINESE_S2_UNIT_${pad(d.unit)}`,
    lessonId: `G3_PEP_CHINESE_S2_LESSON_${d.key.toUpperCase().replaceAll('-', '_')}`,
    knowledgePointId: `G3_PEP_CHINESE_S2_KP_${d.key.toUpperCase().replaceAll('-', '_')}`,
  }),
)
export const gradeThreeChineseLowerReadingOnlyIds = gradeThreeChineseLowerDefinitions
  .filter((d) => !d.questions.length)
  .map((d) => d.knowledgePointId)
export const gradeThreeChineseLowerCurriculum: Pick<
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
      id: G3_PEP_CHINESE_S2_TEXTBOOK_ID,
      subjectId: 'SUBJECT_CHINESE',
      gradeId: 'GRADE_3',
      semesterId: 'SEMESTER_LOWER',
      publisherId: G1_PEP_CHINESE_PUBLISHER_ID,
      versionName: supplied.title,
      sourceId: G3_PEP_CHINESE_LOWER_CONTENT_SOURCE_ID,
      status: 'ACTIVE',
      createdAt: importedAt,
      updatedAt: literacyRevisedAt,
      ...reviewed,
    },
  ],
  units: supplied.units.map((unit) => ({
    id: `G3_PEP_CHINESE_S2_UNIT_${pad(unit.number)}`,
    textbookVersionId: G3_PEP_CHINESE_S2_TEXTBOOK_ID,
    code: `G3-PEP-CHINESE-S2-U${unit.number}`,
    title: unit.title,
    subtitle: '按导入目录阅读、交流与写作。',
    sortOrder: unit.number,
    sourceId: G3_PEP_CHINESE_LOWER_CONTENT_SOURCE_ID,
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
      id: G3_PEP_CHINESE_LOWER_LITERACY_SOURCE_ID,
      title: '三年级下册人教版语文字词附录（8页教材图片）',
      sourceType: 'TEXTBOOK',
      publisher: supplied.publisher,
      edition: supplied.title,
      sourceRef: 'user-provided://g3-pep-chinese-lower/literacy-images/2026-10-10',
      sourceVersion: `SHA256:${literacy.sourceSha256}`,
      copyrightStatus: 'PENDING',
      notes: literacy.sourceNote,
      verifiedAt: literacyRevisedAt,
      ...reviewed,
    },
    {
      id: G3_PEP_CHINESE_LOWER_CONTENT_SOURCE_ID,
      title: `${supplied.title}目录与课文文本`,
      sourceType: 'TEXTBOOK',
      publisher: supplied.publisher,
      edition: supplied.title,
      sourceRef: 'user-provided://g3-pep-chinese-lower/2026-10-08',
      sourceVersion: `SHA256:${supplied.sourceSha256}`,
      copyrightStatus: 'PENDING',
      notes: supplied.sourceNote,
      verifiedAt: importedAt,
      ...reviewed,
    },
    {
      id: G3_PEP_CHINESE_LOWER_PRACTICE_SOURCE_ID,
      title: '三年级下册语文原创阅读理解与学习提示',
      sourceType: 'AI_GENERATED',
      sourceRef: 'local-original://g3-pep-chinese-lower/practice-v1',
      sourceVersion: 'ORIGINAL_PRACTICE_V1',
      copyrightStatus: 'PENDING',
      notes:
        'Codex依据提供文本逐题编写并校验原文依据；栏目学习提示为项目原创，开放表达无唯一答案，不自动判分。',
      verifiedAt: importedAt,
      ...reviewed,
    },
  ],
}
export const gradeThreeChineseLowerQuestions: Question[] = []
export const gradeThreeChineseLowerMappings: QuestionKnowledgePoint[] = []
export const gradeThreeChineseLowerBundles: ContentExpansionBundle[] = []
const guidance: Record<string, string> = {
  oral: '先想清楚要告诉听众什么，按顺序介绍，留出时间倾听和提问。分享时不必公开家庭住址、联系方式等私人信息。',
  writing:
    '围绕题目选一件事或一个对象，列出要写的细节，按顺序写清楚，再读一遍检查是否通顺。续写和童话中的想象要与已有情节衔接。',
  garden:
    '回看本单元课文，挑出需要巩固的字词，摘录喜欢的句子，说说自己的发现。此处尚未提供教材园地中的具体题目。',
  'reading-bar':
    '选择一个适合自己的童话故事，记录书名与作者。读后介绍人物、经历和感受；不要把其他故事当成本册课文。',
  appendix:
    '按表认读或书写，标记还不熟悉的字词。字词表按附件原有分组和顺序保留，不自动分配到单篇课文。',
  reading: '读懂人物、景物或事情，回到文中找依据，再用自己的话说出发现。',
  example: '观察作者怎样描写外形、动作、颜色或感受，再观察一个自己的对象，尝试写出具体细节。',
}
for (const d of gradeThreeChineseLowerDefinitions) {
  const sourceId =
    d.kind === 'appendix'
      ? G3_PEP_CHINESE_LOWER_LITERACY_SOURCE_ID
      : d.text
        ? G3_PEP_CHINESE_LOWER_CONTENT_SOURCE_ID
        : G3_PEP_CHINESE_LOWER_PRACTICE_SOURCE_ID
  const recordAt = d.kind === 'appendix' ? literacyImportedAt : importedAt
  const appendix = literacy.tables.find((table) => table.key === d.key)
  const revision = appendix?.revision ?? 1
  const updatedAt = d.kind === 'appendix' ? literacyRevisedAt : importedAt
  const goals = d.questions.length
    ? ['读通提供的文本，抓住关键信息。', '根据原句解释自己的判断。', '用自己的话表达阅读发现。']
    : [d.kind === 'appendix' ? '对照字词表认读、书写与复习。' : `围绕“${d.title}”准备自己的表达。`]
  const order = gradeThreeChineseLowerDefinitions.filter((x) => x.unit === d.unit).indexOf(d) + 1
  gradeThreeChineseLowerCurriculum.lessons.push({
    id: d.lessonId,
    unitId: d.unitId,
    code: `G3-PEP-CHINESE-S2-${d.key}`,
    title: d.title,
    sortOrder: order,
    sourceId,
    status: 'ACTIVE',
    ...reviewed,
  })
  gradeThreeChineseLowerCurriculum.knowledgePoints.push({
    id: d.knowledgePointId,
    code: `G3-PEP-CHINESE-S2-${d.key}`,
    name: d.title,
    subjectId: 'SUBJECT_CHINESE',
    gradeScope: { minGrade: 3, maxGrade: 3, explicitGradeIds: ['GRADE_3'] },
    description: d.sourceNote,
    learningObjective: goals,
    abilityTags: d.questions.length ? ['阅读理解', '原文依据', '表达交流'] : ['阅读与表达'],
    difficultyLevel: 'STANDARD',
    sourceId,
    status: 'ACTIVE',
    ...reviewed,
  })
  gradeThreeChineseLowerCurriculum.lessonKnowledgePointRelations.push({
    id: `${d.knowledgePointId}_LKP`,
    lessonId: d.lessonId,
    knowledgePointId: d.knowledgePointId,
    relationType: 'CORE',
    order: 1,
    isPrimary: true,
    sourceId,
    status: 'ACTIVE',
    ...reviewed,
  })
  const paragraphs = d.text
    .replaceAll('**', '')
    .replace(/^#### /gm, '')
    .split(/\n\n+/)
    .filter(Boolean)
  const texts = [d.sourceNote, ...paragraphs]
  if (!d.text) texts.push(`项目原创学习提示\n${guidance[d.kind]}`)
  gradeThreeChineseLowerCurriculum.courseContents.push({
    id: `${d.knowledgePointId}_CONTENT_V${revision}`,
    knowledgePointId: d.knowledgePointId,
    title: d.title,
    contentType: d.text ? 'TEXTBOOK' : 'EXTENSION',
    contentFormat: 'TEXT',
    body: {
      lessonId: d.lessonId,
      summary: d.sourceNote,
      learningGoals: goals,
      sourceScope:
        d.kind === 'appendix'
          ? 'USER_PROVIDED_TEXTBOOK_IMAGES'
          : d.text
            ? 'USER_PROVIDED_TEXT'
            : 'DIRECTORY_WITH_ORIGINAL_GUIDANCE',
      suppliedText: d.text,
      sourceNote: d.sourceNote,
      lessonKind: d.kind,
      missingSections: [],
      originalHeading: d.originalHeading,
      importNotes: [...d.importNotes],
      ...(appendix
        ? {
            literacyGroups: appendix.groups,
            tableKind: appendix.tableKind,
            declaredCount: appendix.declaredCount,
            entryCount: appendix.entryCount,
            uniqueCharacterCount: appendix.uniqueCharacterCount,
            polyphonicCount: appendix.polyphonicCount,
            sourcePages: appendix.sourcePages,
          }
        : {}),
      blocks: texts.map((text) => ({ type: 'TEXT', text: text.replace(/^### /gm, '') })),
    },
    difficulty: 'STANDARD',
    sourceId,
    status: 'PUBLISHED',
    currentVersion: revision,
    createdAt: recordAt,
    updatedAt,
    ...reviewed,
  })
  for (const [index, seed] of d.questions.entries()) {
    const id = `${d.knowledgePointId}_Q${index + 1}`
    const offset = (order + index) % seed.options.length
    const original = seed.options.map((label, n) => ({ label, n }))
    const labels = [...original.slice(offset), ...original.slice(0, offset)]
    const question: Question = {
      id,
      textbookVersionId: G3_PEP_CHINESE_S2_TEXTBOOK_ID,
      knowledgePointId: d.knowledgePointId,
      gradeId: 'GRADE_3',
      semesterId: 'SEMESTER_LOWER',
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
      sourceId: G3_PEP_CHINESE_LOWER_PRACTICE_SOURCE_ID,
      status: 'PUBLISHED',
      estimatedSeconds: 90,
      tags: ['g3-pep-chinese-lower-original', 'provided-text-comprehension'],
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
      questionVersion: 1,
      ...reviewed,
    }
    gradeThreeChineseLowerQuestions.push(question)
    gradeThreeChineseLowerMappings.push({
      id: `mapping:${id}`,
      questionId: id,
      knowledgePointId: d.knowledgePointId,
      relationType: 'PRIMARY',
      weight: 1,
      order: index + 1,
      isPrimary: true,
      sourceId: G3_PEP_CHINESE_LOWER_PRACTICE_SOURCE_ID,
      status: 'ACTIVE',
      ...reviewed,
    })
  }
  const blockId = `${d.knowledgePointId}:intro`
  gradeThreeChineseLowerBundles.push({
    textbookId: G3_PEP_CHINESE_S2_TEXTBOOK_ID,
    unitId: d.unitId,
    lessonId: d.lessonId,
    knowledgePointId: d.knowledgePointId,
    learningContent: {
      id: `${d.knowledgePointId}:learning:v1`,
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
      sourceId: G3_PEP_CHINESE_LOWER_PRACTICE_SOURCE_ID,
      status: 'PUBLISHED',
      contentStatus: 'PUBLISHED',
      currentVersion: 1,
      createdAt: importedAt,
      updatedAt: importedAt,
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
        sourceId: G3_PEP_CHINESE_LOWER_PRACTICE_SOURCE_ID,
        ...reviewed,
      },
    ],
  })
}
