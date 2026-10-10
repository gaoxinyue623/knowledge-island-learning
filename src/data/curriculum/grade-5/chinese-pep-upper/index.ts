import supplied from './contents.json'
import astronautCorrection from './reading-19-image-correction.json'
import literacy from './literacy-tables.json'
import { G1_PEP_CHINESE_PUBLISHER_ID } from '../../grade-1/chinese-pep-upper'
import {
  G5_CHINESE_IMPORT_APPROVAL as approval,
  G5_CHINESE_IMPORTED_AT as importedAt,
} from '../../production/gradeFiveChineseApproval'
import type { CurriculumData } from '../../types'
import type { ContentExpansionBundle, Grade, Question, QuestionKnowledgePoint } from '@/types'

export const G5_PEP_CHINESE_S1_TEXTBOOK_ID = 'G5_PEP_CHINESE_S1_USER_IMPORTED'
export const G5_PEP_CHINESE_CONTENT_SOURCE_ID = 'G5_PEP_CHINESE_S1_USER_TEXT_V1'
export const G5_PEP_CHINESE_PRACTICE_SOURCE_ID = 'G5_PEP_CHINESE_S1_ORIGINAL_PRACTICE_V1'
export const G5_ASTRONAUT_IMAGE_SOURCE_ID = 'G5_PEP_CHINESE_S1_ASTRONAUT_IMAGES_V2'
export const G5_ASTRONAUT_PRACTICE_SOURCE_ID = 'G5_PEP_CHINESE_S1_ASTRONAUT_PRACTICE_V2'
export const G5_PEP_CHINESE_LITERACY_SOURCE_ID = 'G5_PEP_CHINESE_S1_LITERACY_IMAGES_V2'
export const gradeFiveChineseLiteracySource = literacy
export const gradeFiveChineseSource = supplied
export const gradeFiveChineseGrade: Grade = {
  id: 'GRADE_5',
  code: 'G5',
  name: '五年级',
  sortOrder: 5,
  status: 'ACTIVE',
}
const reviewed = {
  isSample: false,
  needsVerification: false,
  verificationStatus: 'REVIEWED' as const,
  releaseApprovalId: approval,
}
const pad = (n: number) => String(n).padStart(2, '0')
export const gradeFiveChineseDefinitions = supplied.lessons.map((original) => {
  const d =
    literacy.tables.find((table) => table.key === original.key) ??
    (original.key === astronautCorrection.key ? astronautCorrection : original)
  return {
    ...d,
    unitId: `G5_PEP_CHINESE_S1_UNIT_${pad(d.unit)}`,
    lessonId: `G5_PEP_CHINESE_S1_LESSON_${d.key.toUpperCase().replaceAll('-', '_')}`,
    knowledgePointId: `G5_PEP_CHINESE_S1_KP_${d.key.toUpperCase().replaceAll('-', '_')}`,
  }
})
export const gradeFiveChineseReadingOnlyIds = gradeFiveChineseDefinitions
  .filter((d) => !d.questions.length)
  .map((d) => d.knowledgePointId)
export const gradeFiveChineseAppendixIds = gradeFiveChineseDefinitions
  .filter((d) => d.kind === 'appendix')
  .map((d) => d.knowledgePointId)
export const gradeFiveChineseCurriculum: Pick<
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
      id: G5_PEP_CHINESE_S1_TEXTBOOK_ID,
      subjectId: 'SUBJECT_CHINESE',
      gradeId: 'GRADE_5',
      semesterId: 'SEMESTER_UPPER',
      publisherId: G1_PEP_CHINESE_PUBLISHER_ID,
      versionName: supplied.title,
      sourceId: G5_PEP_CHINESE_CONTENT_SOURCE_ID,
      status: 'ACTIVE',
      createdAt: importedAt,
      updatedAt: literacy.updatedAt,
      ...reviewed,
    },
  ],
  units: supplied.units.map((unit) => ({
    id: `G5_PEP_CHINESE_S1_UNIT_${pad(unit.number)}`,
    textbookVersionId: G5_PEP_CHINESE_S1_TEXTBOOK_ID,
    code: `G5-PEP-CHINESE-S1-U${unit.number}`,
    title: unit.title,
    subtitle:
      unit.number === 9
        ? '按表认读、书写和复习，全册附录不对应单篇课文。'
        : '按导入目录阅读、交流与写作。',
    sortOrder: unit.number,
    sourceId: G5_PEP_CHINESE_CONTENT_SOURCE_ID,
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
      id: G5_PEP_CHINESE_LITERACY_SOURCE_ID,
      title: '五年级上册识字表、写字表、词语表（用户8页教材图片）',
      sourceType: 'TEXTBOOK',
      publisher: supplied.publisher,
      edition: '五年级上册（图片未注明版次年份）',
      sourceRef: 'user-provided://g5-pep-chinese-upper/literacy-images/2026-10-10',
      sourceVersion: `SHA256:${literacy.sourceSha256}`,
      copyrightStatus: 'PENDING',
      notes: literacy.sourceNote,
      verifiedAt: literacy.updatedAt,
      ...reviewed,
    },
    {
      id: G5_ASTRONAUT_IMAGE_SOURCE_ID,
      title: '19* 航天员写给孩子的信（用户三张页面图片转录）',
      sourceType: 'TEXTBOOK',
      publisher: supplied.publisher,
      edition: '五年级上册（图片未注明版次年份）',
      sourceRef: 'user-provided://g5-pep-chinese-upper/2026-10-10/reading-19-images',
      sourceVersion: `SHA256:${astronautCorrection.sourceSha256}`,
      copyrightStatus: 'PENDING',
      notes: astronautCorrection.sourceNote,
      verifiedAt: astronautCorrection.correctedAt,
      ...reviewed,
    },
    {
      id: G5_ASTRONAUT_PRACTICE_SOURCE_ID,
      title: '航天员写给孩子的信图片正文原创理解题',
      sourceType: 'AI_GENERATED',
      sourceRef: 'project://g5-pep-chinese-upper/reading-19-practice-v2',
      sourceVersion: 'V2',
      copyrightStatus: 'CLEARED',
      notes: '依据本次三张图片转录正文编写，替代旧简短文本的三道理解题。',
      verifiedAt: astronautCorrection.correctedAt,
      ...reviewed,
    },
    {
      id: G5_PEP_CHINESE_CONTENT_SOURCE_ID,
      title: supplied.title,
      sourceType: 'TEXTBOOK',
      publisher: supplied.publisher,
      edition: supplied.title,
      sourceRef: 'user-provided://g5-pep-chinese-upper/2026-10-09',
      sourceVersion: `SHA256:${supplied.sourceSha256}`,
      copyrightStatus: 'PENDING',
      notes: supplied.sourceNote,
      verifiedAt: importedAt,
      ...reviewed,
    },
    {
      id: G5_PEP_CHINESE_PRACTICE_SOURCE_ID,
      title: '五年级上册语文原创阅读理解与学习提示',
      sourceType: 'AI_GENERATED',
      sourceRef: 'local-original://g5-pep-chinese-upper/practice-v1',
      sourceVersion: 'ORIGINAL_PRACTICE_V1',
      copyrightStatus: 'PENDING',
      notes:
        'Codex依据提供文本逐题编写并校验原文依据；栏目学习提示为项目原创，开放表达无唯一答案，不自动判分。',
      verifiedAt: importedAt,
      ...reviewed,
    },
  ],
}
export const gradeFiveChineseQuestions: Question[] = []
export const gradeFiveChineseMappings: QuestionKnowledgePoint[] = []
export const gradeFiveChineseBundles: ContentExpansionBundle[] = []
const guidance: Record<string, string> = {
  oral: '先想清楚要告诉听众什么，按顺序介绍，留出时间倾听和提问。分享时不必公开家庭住址、联系方式等私人信息。',
  writing:
    '围绕题目选一件事或一个对象，列出要写的细节，按顺序写清楚，再读一遍检查是否通顺。续写和童话中的想象要与已有情节衔接。',
  garden:
    '回看本单元课文，挑出需要巩固的字词，摘录喜欢的句子，说说自己的发现。结合已提供的词句和积累内容练习表达。',
  'reading-bar': '选择一个民间故事，记录书名，梳理起因、经过和结果，尝试用自己的话讲述。',
  introduction: '先读单元导语，了解本单元的阅读和表达目标，再带着目标进入课文。',
  appendix:
    '按表认读或书写，标记还不熟悉的字词。保留图片中的课号、语文园地分组和字词顺序；识字表的蓝色字及拼音为原图标出的多音字。',
  reading: '读懂人物、景物或事情，回到文中找依据，再用自己的话说出发现。',
  example: '看看例文如何介绍事物的特点或制作步骤，找到清楚准确的表达方法，再试着介绍一种事物。',
}
for (const d of gradeFiveChineseDefinitions) {
  const corrected = d.key === astronautCorrection.key
  const appendix = literacy.tables.find((table) => table.key === d.key)
  const revision = appendix?.revision ?? (corrected ? 2 : 1)
  const contentSourceId = appendix
    ? G5_PEP_CHINESE_LITERACY_SOURCE_ID
    : corrected
      ? G5_ASTRONAUT_IMAGE_SOURCE_ID
      : G5_PEP_CHINESE_CONTENT_SOURCE_ID
  const practiceSourceId = corrected
    ? G5_ASTRONAUT_PRACTICE_SOURCE_ID
    : G5_PEP_CHINESE_PRACTICE_SOURCE_ID
  const contentImportedAt = appendix
    ? literacy.updatedAt
    : corrected
      ? astronautCorrection.correctedAt
      : importedAt
  const sourceId = d.text ? contentSourceId : practiceSourceId
  const goals = d.questions.length
    ? ['读通提供的文本，抓住关键信息。', '根据原句解释自己的判断。', '用自己的话表达阅读发现。']
    : [d.kind === 'appendix' ? '对照字词表认读、书写与复习。' : `围绕“${d.title}”准备自己的表达。`]
  const order = gradeFiveChineseDefinitions.filter((x) => x.unit === d.unit).indexOf(d) + 1
  gradeFiveChineseCurriculum.lessons.push({
    id: d.lessonId,
    unitId: d.unitId,
    code: `G5-PEP-CHINESE-S1-${d.key}`,
    title: d.title,
    sortOrder: order,
    sourceId: contentSourceId,
    status: 'ACTIVE',
    ...reviewed,
  })
  gradeFiveChineseCurriculum.knowledgePoints.push({
    id: d.knowledgePointId,
    code: `G5-PEP-CHINESE-S1-${d.key}`,
    name: d.title,
    subjectId: 'SUBJECT_CHINESE',
    gradeScope: { minGrade: 5, maxGrade: 5, explicitGradeIds: ['GRADE_5'] },
    description: d.sourceNote,
    learningObjective: goals,
    abilityTags: d.questions.length ? ['阅读理解', '原文依据', '表达交流'] : ['阅读与表达'],
    difficultyLevel: 'STANDARD',
    sourceId: contentSourceId,
    status: 'ACTIVE',
    ...reviewed,
  })
  gradeFiveChineseCurriculum.lessonKnowledgePointRelations.push({
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
  const texts = [
    d.sourceNote,
    ...paragraphs,
    ...(corrected
      ? [
          astronautCorrection.authorNote,
          `会认字（附件所列）\n${astronautCorrection.recognitionCharacters}`,
        ]
      : []),
  ]
  if (!d.text) texts.push(`项目原创学习提示\n${guidance[d.kind]}`)
  gradeFiveChineseCurriculum.courseContents.push({
    id: `${d.knowledgePointId}_CONTENT_V${revision}`,
    knowledgePointId: d.knowledgePointId,
    title: d.title,
    contentType: d.text ? 'TEXTBOOK' : 'EXTENSION',
    contentFormat: 'TEXT',
    body: {
      lessonId: d.lessonId,
      summary: d.sourceNote,
      learningGoals: goals,
      sourceScope: appendix
        ? 'USER_PROVIDED_TEXTBOOK_IMAGES'
        : d.text
          ? 'USER_PROVIDED_TEXT'
          : 'DIRECTORY_WITH_ORIGINAL_GUIDANCE',
      suppliedText: d.text,
      sourceNote: d.sourceNote,
      lessonKind: d.kind,
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
      ...(corrected
        ? {
            author: astronautCorrection.author,
            authorNote: astronautCorrection.authorNote,
            readingPrompt: astronautCorrection.readingPrompt,
            letterText: astronautCorrection.letterText,
            recognitionCharacters: astronautCorrection.recognitionCharacters,
            sourceImages: astronautCorrection.images,
            textQuality: 'USER_PROVIDED_IMAGE_TRANSCRIPTION',
          }
        : {}),
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
    const id = `${d.knowledgePointId}_Q${index + 1}${corrected ? '_R2' : ''}`
    const offset = (order + index) % seed.options.length
    const original = seed.options.map((label, n) => ({ label, n }))
    const labels = [...original.slice(offset), ...original.slice(0, offset)]
    const question: Question = {
      id,
      textbookVersionId: G5_PEP_CHINESE_S1_TEXTBOOK_ID,
      knowledgePointId: d.knowledgePointId,
      gradeId: 'GRADE_5',
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
      tags: ['g5-pep-chinese-upper-original', 'provided-text-comprehension'],
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
    gradeFiveChineseQuestions.push(question)
    gradeFiveChineseMappings.push({
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
  gradeFiveChineseBundles.push({
    textbookId: G5_PEP_CHINESE_S1_TEXTBOOK_ID,
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
