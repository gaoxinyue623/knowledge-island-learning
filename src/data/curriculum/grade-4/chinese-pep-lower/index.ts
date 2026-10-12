import supplied from './contents.json'
import luhuaCorrection from './reading-21-image-correction.json'
import { luhuaIllustrationAsset, luhuaIllustrationSource } from './luhua-illustration'
import { G1_PEP_CHINESE_PUBLISHER_ID } from '../../grade-1/chinese-pep-upper'
import {
  G4_CHINESE_LOWER_IMPORT_APPROVAL as approval,
  G4_CHINESE_LOWER_IMPORTED_AT as importedAt,
} from '../../production/gradeFourChineseLowerApproval'
import type { CurriculumData } from '../../types'
import type { ContentExpansionBundle, Grade, Question, QuestionKnowledgePoint } from '@/types'

export const G4_PEP_CHINESE_S2_TEXTBOOK_ID = 'G4_PEP_CHINESE_S2_USER_IMPORTED'
export const G4_PEP_CHINESE_LOWER_CONTENT_SOURCE_ID = 'G4_PEP_CHINESE_S2_USER_TEXT_V1'
export const G4_PEP_CHINESE_LOWER_PRACTICE_SOURCE_ID = 'G4_PEP_CHINESE_S2_ORIGINAL_PRACTICE_V1'
export const G4_LUHUA_IMAGE_SOURCE_ID = 'G4_PEP_CHINESE_S2_LUHUA_IMAGES_V2'
export const G4_LUHUA_PRACTICE_SOURCE_ID = 'G4_PEP_CHINESE_S2_LUHUA_PRACTICE_V2'
export const gradeFourLuhuaCorrection = luhuaCorrection
export const gradeFourChineseLowerSource = supplied
export const gradeFourChineseLowerGrade: Grade = {
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
const pad = (n: number) => String(n).padStart(2, '0')
export const gradeFourChineseLowerDefinitions = supplied.lessons.map((original) => {
  const d = original.key === luhuaCorrection.key ? luhuaCorrection : original
  return {
    ...d,
    unitId: `G4_PEP_CHINESE_S2_UNIT_${pad(d.unit)}`,
    lessonId: `G4_PEP_CHINESE_S2_LESSON_${d.key.toUpperCase().replaceAll('-', '_')}`,
    knowledgePointId: `G4_PEP_CHINESE_S2_KP_${d.key.toUpperCase().replaceAll('-', '_')}`,
  }
})
export const gradeFourChineseLowerReadingOnlyIds = gradeFourChineseLowerDefinitions
  .filter((d) => !d.questions.length)
  .map((d) => d.knowledgePointId)
export const gradeFourChineseLowerAppendixIds = gradeFourChineseLowerDefinitions
  .filter((d) => d.kind === 'appendix')
  .map((d) => d.knowledgePointId)
export const gradeFourChineseLowerCurriculum: Pick<
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
      id: G4_PEP_CHINESE_S2_TEXTBOOK_ID,
      subjectId: 'SUBJECT_CHINESE',
      gradeId: 'GRADE_4',
      semesterId: 'SEMESTER_LOWER',
      publisherId: G1_PEP_CHINESE_PUBLISHER_ID,
      versionName: supplied.title,
      sourceId: G4_PEP_CHINESE_LOWER_CONTENT_SOURCE_ID,
      status: 'ACTIVE',
      createdAt: importedAt,
      updatedAt: luhuaCorrection.correctedAt,
      ...reviewed,
    },
  ],
  units: supplied.units.map((unit) => ({
    id: `G4_PEP_CHINESE_S2_UNIT_${pad(unit.number)}`,
    textbookVersionId: G4_PEP_CHINESE_S2_TEXTBOOK_ID,
    code: `G4-PEP-CHINESE-S2-U${unit.number}`,
    title: unit.title,
    subtitle:
      unit.number === 9
        ? '按表认读、书写和复习，全册附录不对应单篇课文。'
        : '按导入目录阅读、交流与写作。',
    sortOrder: unit.number,
    sourceId: G4_PEP_CHINESE_LOWER_CONTENT_SOURCE_ID,
    status: 'ACTIVE',
    ...reviewed,
  })),
  lessons: [],
  knowledgePoints: [],
  lessonKnowledgePointRelations: [],
  knowledgePrerequisites: [],
  courseContents: [],
  sources: [
    luhuaIllustrationSource,
    {
      id: G4_LUHUA_IMAGE_SOURCE_ID,
      title: '21* 芦花鞋（用户提供的六张教材图片校正版）',
      sourceType: 'TEXTBOOK',
      publisher: supplied.publisher,
      sourceRef: 'user-provided://g4-pep-chinese-lower/2026-10-09/luhua-images',
      sourceVersion: `TRANSCRIPTION_SHA256:${luhuaCorrection.transcriptionSha256}`,
      copyrightStatus: 'PENDING',
      notes:
        '以六张图片为依据逐段转录，作者曹文轩，选自《青铜葵花》。正文替代初次文字附件中的本课内容；图片哈希及四部分原文保存在校正记录中。',
      verifiedAt: luhuaCorrection.correctedAt,
      ...reviewed,
    },
    {
      id: G4_LUHUA_PRACTICE_SOURCE_ID,
      title: '芦花鞋图片校正版原创理解题',
      sourceType: 'AI_GENERATED',
      sourceRef: 'local-original://g4-pep-chinese-lower/luhua-practice-v2',
      sourceVersion: 'ORIGINAL_PRACTICE_V2',
      copyrightStatus: 'PENDING',
      notes:
        '3道理解题只依据此次图片校正文本，旧版3道题撤出当前题库；课文结尾没有写交易已完成，不把追去改写成已售出。',
      verifiedAt: luhuaCorrection.correctedAt,
      ...reviewed,
    },
    {
      id: G4_PEP_CHINESE_LOWER_CONTENT_SOURCE_ID,
      title: supplied.title,
      sourceType: 'TEXTBOOK',
      publisher: supplied.publisher,
      edition: supplied.title,
      sourceRef: 'user-provided://g4-pep-chinese-lower/2026-10-09',
      sourceVersion: `SHA256:${supplied.sourceSha256}`,
      copyrightStatus: 'PENDING',
      notes: supplied.sourceNote,
      verifiedAt: importedAt,
      ...reviewed,
    },
    {
      id: G4_PEP_CHINESE_LOWER_PRACTICE_SOURCE_ID,
      title: '四年级下册语文原创阅读理解与学习提示',
      sourceType: 'AI_GENERATED',
      sourceRef: 'local-original://g4-pep-chinese-lower/practice-v1',
      sourceVersion: 'ORIGINAL_PRACTICE_V1',
      copyrightStatus: 'PENDING',
      notes:
        'Codex依据提供文本逐题编写并校验原文依据；栏目学习提示为项目原创，开放表达无唯一答案，不自动判分。',
      verifiedAt: importedAt,
      ...reviewed,
    },
  ],
}
export const gradeFourChineseLowerQuestions: Question[] = []
export const gradeFourChineseLowerMappings: QuestionKnowledgePoint[] = []
export const gradeFourChineseLowerBundles: ContentExpansionBundle[] = []
const guidance: Record<string, string> = {
  oral: '先想清楚要告诉听众什么，按顺序介绍，留出时间倾听和提问。分享时不必公开家庭住址、联系方式等私人信息。',
  writing:
    '围绕题目选一件事或一个对象，列出要写的细节，按顺序写清楚，再读一遍检查是否通顺。续写和童话中的想象要与已有情节衔接。',
  garden:
    '回看本单元课文，挑出需要巩固的字词，摘录喜欢的句子，说说自己的发现。结合已提供的词句和积累内容练习表达。',
  'reading-bar': '选择一本适合自己的科普读物，记录书名、作者和感兴趣的问题，介绍读到的发现。',
  integrated: '收集喜欢的诗歌，试着朗读、交流与创作小诗，尊重不同的表达。',
  appendix: '按表认读或书写，标记还不熟悉的字词。词语表按原有单元顺序保留，不自动分配到单篇课文。',
  reading: '读懂人物、景物或事情，回到文中找依据，再用自己的话说出发现。',
  example:
    '看看例文怎样交代事情的起因、经过和结果，留意人物的动作、语言与感受，再尝试写一件自己的经历。',
}
for (const d of gradeFourChineseLowerDefinitions) {
  const corrected = d.key === luhuaCorrection.key
  const revision = corrected ? 2 : 1
  const contentSourceId = corrected
    ? G4_LUHUA_IMAGE_SOURCE_ID
    : G4_PEP_CHINESE_LOWER_CONTENT_SOURCE_ID
  const practiceSourceId = corrected
    ? G4_LUHUA_PRACTICE_SOURCE_ID
    : G4_PEP_CHINESE_LOWER_PRACTICE_SOURCE_ID
  const contentImportedAt = corrected ? luhuaCorrection.correctedAt : importedAt
  const sourceId = d.text ? contentSourceId : practiceSourceId
  const goals = d.questions.length
    ? ['读通提供的文本，抓住关键信息。', '根据原句解释自己的判断。', '用自己的话表达阅读发现。']
    : [d.kind === 'appendix' ? '对照字词表认读、书写与复习。' : `围绕“${d.title}”准备自己的表达。`]
  const order = gradeFourChineseLowerDefinitions.filter((x) => x.unit === d.unit).indexOf(d) + 1
  gradeFourChineseLowerCurriculum.lessons.push({
    id: d.lessonId,
    unitId: d.unitId,
    code: `G4-PEP-CHINESE-S2-${d.key}`,
    title: d.title,
    sortOrder: order,
    sourceId: contentSourceId,
    status: 'ACTIVE',
    ...reviewed,
  })
  gradeFourChineseLowerCurriculum.knowledgePoints.push({
    id: d.knowledgePointId,
    code: `G4-PEP-CHINESE-S2-${d.key}`,
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
  gradeFourChineseLowerCurriculum.lessonKnowledgePointRelations.push({
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
    ...(corrected ? [luhuaCorrection.readingPrompt] : []),
    ...paragraphs,
  ]
  if (!d.text) texts.push(`项目原创学习提示\n${guidance[d.kind]}`)
  gradeFourChineseLowerCurriculum.courseContents.push({
    id: `${d.knowledgePointId}_CONTENT_V${corrected ? 3 : revision}`,
    knowledgePointId: d.knowledgePointId,
    title: d.title,
    contentType: d.text ? 'TEXTBOOK' : 'EXTENSION',
    contentFormat: corrected ? 'RICH_TEXT' : 'TEXT',
    body: {
      lessonId: d.lessonId,
      summary: d.sourceNote,
      learningGoals: goals,
      sourceScope: d.text ? 'USER_PROVIDED_TEXT' : 'DIRECTORY_WITH_ORIGINAL_GUIDANCE',
      suppliedText: d.text,
      sourceNote: d.sourceNote,
      lessonKind: d.kind,
      ...(corrected
        ? {
            sections: luhuaCorrection.sections,
            readingPrompt: luhuaCorrection.readingPrompt,
            sourceImages: luhuaCorrection.images,
            generatedIllustrations: [luhuaIllustrationAsset.id],
            sourceIds: [contentSourceId, luhuaIllustrationSource.id],
          }
        : {}),
      missingSections: [],
      importNotes: d.importNotes,
      blocks: [
        ...(corrected
          ? [
              {
                type: 'IMAGE',
                mediaAssetId: luhuaIllustrationAsset.id,
                altText: luhuaIllustrationAsset.altText!,
                text: '',
              },
            ]
          : []),
        ...texts.map((text) => ({ type: 'TEXT', text })),
      ],
    },
    difficulty: 'STANDARD',
    sourceId,
    status: 'PUBLISHED',
    currentVersion: corrected ? 3 : revision,
    createdAt: contentImportedAt,
    updatedAt: corrected ? luhuaIllustrationAsset.updatedAt : contentImportedAt,
    ...reviewed,
  })
  for (const [index, seed] of d.questions.entries()) {
    const id = `${d.knowledgePointId}_Q${index + 1}${corrected ? '_R2' : ''}`
    const offset = (order + index) % seed.options.length
    const original = seed.options.map((label, n) => ({ label, n }))
    const labels = [...original.slice(offset), ...original.slice(0, offset)]
    const question: Question = {
      id,
      textbookVersionId: G4_PEP_CHINESE_S2_TEXTBOOK_ID,
      knowledgePointId: d.knowledgePointId,
      gradeId: 'GRADE_4',
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
      sourceId: practiceSourceId,
      status: 'PUBLISHED',
      estimatedSeconds: 90,
      tags: ['g4-pep-chinese-lower-original', 'provided-text-comprehension'],
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
    gradeFourChineseLowerQuestions.push(question)
    gradeFourChineseLowerMappings.push({
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
  gradeFourChineseLowerBundles.push({
    textbookId: G4_PEP_CHINESE_S2_TEXTBOOK_ID,
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
