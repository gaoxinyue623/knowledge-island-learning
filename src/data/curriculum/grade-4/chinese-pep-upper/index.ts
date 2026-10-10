import supplied from './contents.json'
import peasCorrection from './lesson-04-correction.json'
import supplement from './units-3-5.json'
import finalSupplement from './units-6-8.json'
import tuoluoCorrection from './tuoluo-correction.json'
import { G1_PEP_CHINESE_PUBLISHER_ID } from '../../grade-1/chinese-pep-upper'
import {
  G4_CHINESE_IMPORT_APPROVAL as approval,
  G4_CHINESE_IMPORTED_AT as importedAt,
  G4_CHINESE_SUPPLEMENT_IMPORTED_AT as supplementedAt,
  G4_CHINESE_FINAL_IMPORTED_AT as finalImportedAt,
  G4_CHINESE_TUOLUO_CORRECTED_AT as tuoluoCorrectedAt,
} from '../../production/gradeFourChineseApproval'
import type { CurriculumData } from '../../types'
import type { ContentExpansionBundle, Grade, Question, QuestionKnowledgePoint } from '@/types'

export const G4_PEP_CHINESE_S1_TEXTBOOK_ID = 'G4_PEP_CHINESE_S1_USER_IMPORTED'
export const G4_PEP_CHINESE_CONTENT_SOURCE_ID = 'G4_PEP_CHINESE_S1_USER_TEXT_V1'
export const G4_PEP_CHINESE_PEAS_SOURCE_ID = 'G4_PEP_CHINESE_S1_LESSON_04_IMAGES_20261010'
const peasCorrectedAt = '2026-10-10T00:00:00.000Z'
export const G4_PEP_CHINESE_PRACTICE_SOURCE_ID = 'G4_PEP_CHINESE_S1_ORIGINAL_PRACTICE_V1'
export const G4_PEP_CHINESE_SUPPLEMENT_SOURCE_ID = 'G4_PEP_CHINESE_S1_USER_TEXT_UNITS_3_5_V1'
export const G4_PEP_CHINESE_FINAL_SOURCE_ID = 'G4_PEP_CHINESE_S1_USER_TEXT_UNITS_6_8_V1'
export const G4_PEP_CHINESE_TUOLUO_SOURCE_ID = 'G4_PEP_CHINESE_S1_USER_IMAGES_READING_22_V2'
export const gradeFourChineseTuoluoCorrection = tuoluoCorrection
export const gradeFourChineseFinalSource = finalSupplement
export const gradeFourChineseSupplementSource = supplement
export const gradeFourChineseSource = supplied
export const gradeFourChineseGrade: Grade = {
  id: 'GRADE_4',
  code: 'G4',
  name: '四年级',
  sortOrder: 4,
  status: 'ACTIVE',
}
const reviewed = {
  isSample: false,
  needsVerification: false,
  verificationStatus: 'REVIEWED' as const,
  releaseApprovalId: approval,
}
const sourceForUnit = (unit: number) =>
  unit >= 6
    ? G4_PEP_CHINESE_FINAL_SOURCE_ID
    : unit >= 3
      ? G4_PEP_CHINESE_SUPPLEMENT_SOURCE_ID
      : G4_PEP_CHINESE_CONTENT_SOURCE_ID
const pad = (n: number) => String(n).padStart(2, '0')
export const gradeFourChineseDefinitions = [
  ...supplied.lessons.map((lesson) =>
    lesson.key === 'reading-04' ? peasCorrection.lesson : lesson,
  ),
  ...supplement.lessons,
  ...finalSupplement.lessons,
].map((d) => ({
  ...d,
  text: d.key === tuoluoCorrection.key ? tuoluoCorrection.text : d.text,
  sourceNote:
    d.key === tuoluoCorrection.key
      ? tuoluoCorrection.sourceNote
      : d.sourceNote.replace(
          '本册目前仅接入第一、二单元，',
          '本文来自首批第一、二单元材料；本册现已补入第一至第八单元及字词附录。',
        ),
  importNotes: d.key === tuoluoCorrection.key ? [] : d.importNotes,
  revision:
    d.key === 'reading-04' ? 2 : d.key === tuoluoCorrection.key ? tuoluoCorrection.revision : 1,
  contentSourceId:
    d.key === 'reading-04'
      ? G4_PEP_CHINESE_PEAS_SOURCE_ID
      : d.key === tuoluoCorrection.key
        ? G4_PEP_CHINESE_TUOLUO_SOURCE_ID
        : sourceForUnit(d.unit),
  unitId: `G4_PEP_CHINESE_S1_UNIT_${pad(d.unit)}`,
  lessonId: `G4_PEP_CHINESE_S1_LESSON_${d.key.toUpperCase().replaceAll('-', '_')}`,
  knowledgePointId: `G4_PEP_CHINESE_S1_KP_${d.key.toUpperCase().replaceAll('-', '_')}`,
}))
export const gradeFourChineseReadingOnlyIds = gradeFourChineseDefinitions
  .filter((d) => !d.questions.length)
  .map((d) => d.knowledgePointId)
export const gradeFourChineseAppendixIds = gradeFourChineseDefinitions
  .filter((d) => d.kind === 'appendix')
  .map((d) => d.knowledgePointId)
export const gradeFourChineseCurriculum: Pick<
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
      id: G4_PEP_CHINESE_S1_TEXTBOOK_ID,
      subjectId: 'SUBJECT_CHINESE',
      gradeId: 'GRADE_4',
      semesterId: 'SEMESTER_UPPER',
      publisherId: G1_PEP_CHINESE_PUBLISHER_ID,
      versionName: '统编（人教版）语文四年级上册（第一至第八单元及字词附录·用户提供文本）',
      sourceId: G4_PEP_CHINESE_CONTENT_SOURCE_ID,
      status: 'ACTIVE',
      createdAt: importedAt,
      updatedAt: tuoluoCorrectedAt,
      ...reviewed,
    },
  ],
  units: [...supplied.units, ...supplement.units, ...finalSupplement.units].map((unit) => ({
    id: `G4_PEP_CHINESE_S1_UNIT_${pad(unit.number)}`,
    textbookVersionId: G4_PEP_CHINESE_S1_TEXTBOOK_ID,
    code: `G4-PEP-CHINESE-S1-U${unit.number}`,
    title: unit.title,
    subtitle:
      unit.number === 9
        ? '按表认读、书写和复习，全册附录不对应单篇课文。'
        : '按导入目录阅读、交流与写作。',
    sortOrder: unit.number,
    sourceId: sourceForUnit(unit.number),
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
      id: G4_PEP_CHINESE_PEAS_SOURCE_ID,
      title: peasCorrection.title,
      sourceType: 'TEXTBOOK',
      publisher: peasCorrection.publisher,
      sourceRef: 'user-provided://g4-pep-chinese-upper/2026-10-10/lesson-04-images',
      sourceVersion: `SHA256:${peasCorrection.sourceSha256}`,
      copyrightStatus: 'PENDING',
      notes: peasCorrection.sourceNote,
      verifiedAt: peasCorrectedAt,
      ...reviewed,
    },
    {
      id: G4_PEP_CHINESE_CONTENT_SOURCE_ID,
      title: `${supplied.title}第一、二单元目录与文本`,
      sourceType: 'TEXTBOOK',
      publisher: supplied.publisher,
      edition: supplied.title,
      sourceRef: 'user-provided://g4-pep-chinese-upper/2026-10-09',
      sourceVersion: `SHA256:${supplied.sourceSha256}`,
      copyrightStatus: 'PENDING',
      notes: supplied.sourceNote,
      verifiedAt: importedAt,
      ...reviewed,
    },
    {
      id: G4_PEP_CHINESE_SUPPLEMENT_SOURCE_ID,
      title: supplement.title,
      sourceType: 'TEXTBOOK',
      publisher: supplement.publisher,
      edition: supplement.title,
      sourceRef: 'user-provided://g4-pep-chinese-upper/2026-10-09/units-3-5',
      sourceVersion: `SHA256:${supplement.sourceSha256}`,
      copyrightStatus: 'PENDING',
      notes: supplement.sourceNote,
      verifiedAt: supplementedAt,
      ...reviewed,
    },
    {
      id: G4_PEP_CHINESE_FINAL_SOURCE_ID,
      title: finalSupplement.title,
      sourceType: 'TEXTBOOK',
      publisher: finalSupplement.publisher,
      edition: finalSupplement.title,
      sourceRef: 'user-provided://g4-pep-chinese-upper/2026-10-09/units-6-8',
      sourceVersion: `SHA256:${finalSupplement.sourceSha256}`,
      copyrightStatus: 'PENDING',
      notes: finalSupplement.sourceNote,
      verifiedAt: finalImportedAt,
      ...reviewed,
    },
    {
      id: G4_PEP_CHINESE_TUOLUO_SOURCE_ID,
      title: tuoluoCorrection.title,
      sourceType: 'TEXTBOOK',
      publisher: tuoluoCorrection.publisher,
      edition: supplied.title,
      sourceRef: 'user-provided://g4-pep-chinese-upper/2026-10-10/reading-22-images',
      sourceVersion: `SHA256:${tuoluoCorrection.sourceSha256}`,
      copyrightStatus: 'PENDING',
      notes: tuoluoCorrection.sourceNote,
      verifiedAt: tuoluoCorrectedAt,
      ...reviewed,
    },
    {
      id: G4_PEP_CHINESE_PRACTICE_SOURCE_ID,
      title: '四年级上册语文原创阅读理解与学习提示',
      sourceType: 'AI_GENERATED',
      sourceRef: 'local-original://g4-pep-chinese-upper/practice-v1',
      sourceVersion: 'ORIGINAL_PRACTICE_V1',
      copyrightStatus: 'PENDING',
      notes:
        'Codex依据提供文本逐题编写并校验原文依据；栏目学习提示为项目原创，开放表达无唯一答案，不自动判分。',
      verifiedAt: importedAt,
      ...reviewed,
    },
  ],
}
export const gradeFourChineseQuestions: Question[] = []
export const gradeFourChineseMappings: QuestionKnowledgePoint[] = []
export const gradeFourChineseBundles: ContentExpansionBundle[] = []
const guidance: Record<string, string> = {
  oral: '先想清楚要告诉听众什么，按顺序介绍，留出时间倾听和提问。分享时不必公开家庭住址、联系方式等私人信息。',
  writing:
    '围绕题目选一件事或一个对象，列出要写的细节，按顺序写清楚，再读一遍检查是否通顺。续写和童话中的想象要与已有情节衔接。',
  garden:
    '回看本单元课文，挑出需要巩固的字词，摘录喜欢的句子，说说自己的发现。结合已提供的词句和积累内容练习表达。',
  'reading-bar':
    '选择一个适合自己的神话故事，记录书名与作者。读后介绍人物、经历和感受；不要把其他故事当成本册课文。',
  appendix: '按表认读或书写，标记还不熟悉的字词。词语表按原有单元顺序保留，不自动分配到单篇课文。',
  reading: '读懂人物、景物或事情，回到文中找依据，再用自己的话说出发现。',
  example:
    '看看例文怎样交代事情的起因、经过和结果，留意人物的动作、语言与感受，再尝试写一件自己的经历。',
}
for (const d of gradeFourChineseDefinitions) {
  const contentSourceId = d.contentSourceId
  const contentImportedAt =
    d.unit >= 6 ? finalImportedAt : d.unit >= 3 ? supplementedAt : importedAt
  const sourceId = d.text ? contentSourceId : G4_PEP_CHINESE_PRACTICE_SOURCE_ID
  const contentUpdatedAt =
    d.key === 'reading-04'
      ? peasCorrectedAt
      : d.key === tuoluoCorrection.key
        ? tuoluoCorrectedAt
        : contentImportedAt
  const goals = d.questions.length
    ? ['读通提供的文本，抓住关键信息。', '根据原句解释自己的判断。', '用自己的话表达阅读发现。']
    : [d.kind === 'appendix' ? '对照字词表认读、书写与复习。' : `围绕“${d.title}”准备自己的表达。`]
  const order = gradeFourChineseDefinitions.filter((x) => x.unit === d.unit).indexOf(d) + 1
  gradeFourChineseCurriculum.lessons.push({
    id: d.lessonId,
    unitId: d.unitId,
    code: `G4-PEP-CHINESE-S1-${d.key}`,
    title: d.title,
    sortOrder: order,
    sourceId: contentSourceId,
    status: 'ACTIVE',
    ...reviewed,
  })
  gradeFourChineseCurriculum.knowledgePoints.push({
    id: d.knowledgePointId,
    code: `G4-PEP-CHINESE-S1-${d.key}`,
    name: d.title,
    subjectId: 'SUBJECT_CHINESE',
    gradeScope: { minGrade: 4, maxGrade: 4, explicitGradeIds: ['GRADE_4'] },
    description: d.sourceNote,
    learningObjective: goals,
    abilityTags: d.questions.length ? ['阅读理解', '原文依据', '表达交流'] : ['阅读与表达'],
    difficultyLevel: 'STANDARD',
    sourceId: contentSourceId,
    status: 'ACTIVE',
    ...reviewed,
  })
  gradeFourChineseCurriculum.lessonKnowledgePointRelations.push({
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
    .replace(/^#### /gm, '')
    .split(/\n\n+/)
    .filter(Boolean)
  const texts = [d.sourceNote, ...paragraphs]
  if (!d.text) texts.push(`项目原创学习提示\n${guidance[d.kind]}`)
  gradeFourChineseCurriculum.courseContents.push({
    id: `${d.knowledgePointId}_CONTENT_V${d.revision}`,
    knowledgePointId: d.knowledgePointId,
    title: d.title,
    contentType: d.text ? 'TEXTBOOK' : 'EXTENSION',
    contentFormat: 'TEXT',
    body: {
      lessonId: d.lessonId,
      summary: d.sourceNote,
      learningGoals: goals,
      sourceScope:
        d.key === tuoluoCorrection.key
          ? 'USER_PROVIDED_IMAGE_TRANSCRIPTION'
          : d.text
            ? 'USER_PROVIDED_TEXT'
            : 'DIRECTORY_WITH_ORIGINAL_GUIDANCE',
      suppliedText: d.text,
      sourceNote: d.sourceNote,
      lessonKind: d.kind,
      missingSections: [],
      importNotes: d.importNotes,
      ...(d.key === tuoluoCorrection.key
        ? {
            textbookOriginalText: tuoluoCorrection.bodyText,
            readingPrompt: tuoluoCorrection.readingPrompt,
            author: tuoluoCorrection.author,
            authorFootnote: tuoluoCorrection.authorFootnote,
            recognitionCharacters: tuoluoCorrection.recognitionCharacters,
            pronunciationNotes: tuoluoCorrection.pronunciationNotes,
            sourceImages: tuoluoCorrection.sourceImages,
            originalSourceId: G4_PEP_CHINESE_FINAL_SOURCE_ID,
          }
        : {}),
      blocks: texts.map((text) => ({ type: 'TEXT', text })),
    },
    difficulty: 'STANDARD',
    sourceId,
    status: 'PUBLISHED',
    currentVersion: d.revision,
    createdAt: contentImportedAt,
    updatedAt: contentUpdatedAt,
    ...reviewed,
  })
  for (const [index, seed] of d.questions.entries()) {
    const id = `${d.knowledgePointId}_Q${index + 1}`
    const offset = (order + index) % seed.options.length
    const original = seed.options.map((label, n) => ({ label, n }))
    const labels = [...original.slice(offset), ...original.slice(0, offset)]
    const question: Question = {
      id,
      textbookVersionId: G4_PEP_CHINESE_S1_TEXTBOOK_ID,
      knowledgePointId: d.knowledgePointId,
      gradeId: 'GRADE_4',
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
      sourceId: G4_PEP_CHINESE_PRACTICE_SOURCE_ID,
      status: 'PUBLISHED',
      estimatedSeconds: 90,
      tags: ['g4-pep-chinese-upper-original', 'provided-text-comprehension'],
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
    gradeFourChineseQuestions.push(question)
    gradeFourChineseMappings.push({
      id: `mapping:${id}`,
      questionId: id,
      knowledgePointId: d.knowledgePointId,
      relationType: 'PRIMARY',
      weight: 1,
      order: index + 1,
      isPrimary: true,
      sourceId: G4_PEP_CHINESE_PRACTICE_SOURCE_ID,
      status: 'ACTIVE',
      ...reviewed,
    })
  }
  const blockId = `${d.knowledgePointId}:intro`
  gradeFourChineseBundles.push({
    textbookId: G4_PEP_CHINESE_S1_TEXTBOOK_ID,
    unitId: d.unitId,
    lessonId: d.lessonId,
    knowledgePointId: d.knowledgePointId,
    learningContent: {
      id: `${d.knowledgePointId}:learning:v${d.revision}`,
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
      sourceId: G4_PEP_CHINESE_PRACTICE_SOURCE_ID,
      status: 'PUBLISHED',
      contentStatus: 'PUBLISHED',
      currentVersion: d.revision,
      createdAt: contentImportedAt,
      updatedAt: contentUpdatedAt,
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
        sourceId: G4_PEP_CHINESE_PRACTICE_SOURCE_ID,
        ...reviewed,
      },
    ],
  })
}
