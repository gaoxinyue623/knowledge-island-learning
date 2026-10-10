import supplied from './contents.json'
import { G1_PEP_CHINESE_PUBLISHER_ID } from '../../grade-1/chinese-pep-upper'
import {
  G6_CHINESE_2019_LOWER_IMPORT_APPROVAL as approval,
  G6_CHINESE_2019_LOWER_IMPORTED_AT as importedAt,
} from '../../production/gradeSixChinese2019LowerApproval'
import type { CurriculumData } from '../../types'
import type { ContentExpansionBundle, Question, QuestionKnowledgePoint } from '@/types'

export const G6_CHINESE_2019_LOWER_S2_TEXTBOOK_ID = 'G6_PEP_CHINESE_2019_S2_USER_IMPORTED'
export const G6_CHINESE_2019_LOWER_CONTENT_SOURCE_ID = 'G6_PEP_CHINESE_2019_S2_USER_TEXT_V1'
export const G6_CHINESE_2019_LOWER_PRACTICE_SOURCE_ID = 'G6_PEP_CHINESE_2019_S2_PRACTICE_V1'
export const gradeSixChinese2019LowerSource = supplied
const reviewed = {
  isSample: false,
  needsVerification: false,
  verificationStatus: 'REVIEWED' as const,
  releaseApprovalId: approval,
}
const pad = (n: number) => String(n).padStart(2, '0')
export const gradeSixChinese2019LowerDefinitions = supplied.lessons.map((d) => ({
  ...d,
  unitId: `G6_PEP_CHINESE_2019_S2_UNIT_${pad(d.unit)}`,
  lessonId: `G6_PEP_CHINESE_2019_S2_LESSON_${d.key.toUpperCase().replaceAll('-', '_')}`,
  knowledgePointId: `G6_PEP_CHINESE_2019_S2_KP_${d.key.toUpperCase().replaceAll('-', '_')}`,
}))
export const gradeSixChinese2019LowerReadingOnlyIds = gradeSixChinese2019LowerDefinitions
  .filter((d) => !d.questions.length)
  .map((d) => d.knowledgePointId)
export const gradeSixChinese2019LowerAppendixIds = gradeSixChinese2019LowerDefinitions
  .filter((d) => d.kind === 'appendix')
  .map((d) => d.knowledgePointId)
export const gradeSixChinese2019LowerCurriculum: Pick<
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
      id: G6_CHINESE_2019_LOWER_S2_TEXTBOOK_ID,
      subjectId: 'SUBJECT_CHINESE',
      gradeId: 'GRADE_6',
      semesterId: 'SEMESTER_LOWER',
      publisherId: G1_PEP_CHINESE_PUBLISHER_ID,
      versionName: supplied.title,
      editionYear: 2019,
      sourceId: G6_CHINESE_2019_LOWER_CONTENT_SOURCE_ID,
      status: 'ACTIVE',
      createdAt: importedAt,
      updatedAt: importedAt,
      ...reviewed,
    },
  ],
  units: supplied.units.map((unit) => ({
    id: `G6_PEP_CHINESE_2019_S2_UNIT_${pad(unit.number)}`,
    textbookVersionId: G6_CHINESE_2019_LOWER_S2_TEXTBOOK_ID,
    code: `G6-2019-CHINESE-S2-U${unit.number}`,
    title: unit.title,
    subtitle:
      unit.number === 8
        ? '按单元、专题和课外古诗词分组复习，不自动判分。'
        : unit.number >= 6
          ? '按专题与诵读任务学习，不自动判分。'
          : '按提供目录阅读、交流与写作。',
    sortOrder: unit.number,
    sourceId: G6_CHINESE_2019_LOWER_CONTENT_SOURCE_ID,
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
      id: G6_CHINESE_2019_LOWER_CONTENT_SOURCE_ID,
      title: supplied.title,
      sourceType: 'TEXTBOOK',
      publisher: supplied.publisher,
      edition: supplied.title,
      sourceRef: 'user-provided://g6-2019-chinese-lower/2026-10-09',
      sourceVersion: `SHA256:${supplied.sourceSha256}`,
      copyrightStatus: 'PENDING',
      notes: supplied.sourceNote,
      verifiedAt: importedAt,
      ...reviewed,
    },
    {
      id: G6_CHINESE_2019_LOWER_PRACTICE_SOURCE_ID,
      title: '2019版六年级下册语文原创理解题与学习提示',
      sourceType: 'AI_GENERATED',
      sourceRef: 'local-original://g6-2019-chinese-lower/practice-v1',
      sourceVersion: 'PRACTICE_V1',
      copyrightStatus: 'PENDING',
      notes:
        '根据本版本来稿编写理解题，逐题保留文本依据；习作例文、综合性学习、诵读和附录不自动判分。',
      verifiedAt: importedAt,
      ...reviewed,
    },
  ],
}
export const gradeSixChinese2019LowerQuestions: Question[] = []
export const gradeSixChinese2019LowerMappings: QuestionKnowledgePoint[] = []
export const gradeSixChinese2019LowerBundles: ContentExpansionBundle[] = []
const guidance: Record<string, string> = {
  activity: '按照任务提示阅读、搜集资料或交流，记录自己的发现；开放任务不自动判分。',
  recitation: '朗读诗句，借助注释理解画面和情感，尝试背诵喜欢的句子。',
  oral: '先想清楚要告诉听众什么，按顺序介绍，留出时间倾听和提问。分享时不必公开家庭住址、联系方式等私人信息。',
  writing:
    '围绕题目选一件事或一个对象，列出要写的细节，按顺序写清楚，再读一遍检查是否通顺。续写和童话中的想象要与已有情节衔接。',
  garden:
    '回看本单元课文，挑出需要巩固的字词，摘录喜欢的句子，说说自己的发现。结合已提供的词句和积累内容练习表达。',
  'reading-bar': '按照本栏目提示选择阅读材料，梳理人物和情节，交流自己的感受。',
  introduction: '先读单元导语，了解本单元的阅读和表达目标，再带着目标进入课文。',
  appendix: '按表认读或书写，标记还不熟悉的字词。词语表按原有单元顺序保留，不自动分配到单篇课文。',
  reading: '读懂人物、景物或事情，回到文中找依据，再用自己的话说出发现。',
  example: '观察例文如何围绕中心选材，找到人物的动作、语言和心理描写，再试着表达自己的中心意思。',
}
for (const d of gradeSixChinese2019LowerDefinitions) {
  const revision = 1
  const contentSourceId = G6_CHINESE_2019_LOWER_CONTENT_SOURCE_ID
  const practiceSourceId = G6_CHINESE_2019_LOWER_PRACTICE_SOURCE_ID
  const contentImportedAt = importedAt
  const sourceId = d.text ? contentSourceId : practiceSourceId
  const goals = d.questions.length
    ? ['读通提供的文本，抓住关键信息。', '根据原句解释自己的判断。', '用自己的话表达阅读发现。']
    : [d.kind === 'appendix' ? '对照字词表认读、书写与复习。' : `围绕“${d.title}”准备自己的表达。`]
  const order = gradeSixChinese2019LowerDefinitions.filter((x) => x.unit === d.unit).indexOf(d) + 1
  gradeSixChinese2019LowerCurriculum.lessons.push({
    id: d.lessonId,
    unitId: d.unitId,
    code: `G6-2019-CHINESE-S2-${d.key}`,
    title: d.title,
    sortOrder: order,
    sourceId: contentSourceId,
    status: 'ACTIVE',
    ...reviewed,
  })
  gradeSixChinese2019LowerCurriculum.knowledgePoints.push({
    id: d.knowledgePointId,
    code: `G6-2019-CHINESE-S2-${d.key}`,
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
  gradeSixChinese2019LowerCurriculum.lessonKnowledgePointRelations.push({
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
  if (!d.text) texts.push(`项目原创学习提示\n${guidance[d.kind]}`)
  gradeSixChinese2019LowerCurriculum.courseContents.push({
    id: `${d.knowledgePointId}_CONTENT_V${revision}`,
    knowledgePointId: d.knowledgePointId,
    title: d.title,
    contentType: d.text && d.quality !== 'RECONSTRUCTED' ? 'TEXTBOOK' : 'EXTENSION',
    contentFormat: 'TEXT',
    body: {
      lessonId: d.lessonId,
      summary: d.sourceNote,
      learningGoals: goals,
      sourceScope:
        d.quality === 'RECONSTRUCTED'
          ? 'USER_RECONSTRUCTED_TEXT'
          : d.quality === 'REFERENCED'
            ? 'USER_REQUESTED_REFERENCE'
            : d.text
              ? 'USER_PROVIDED_TEXT'
              : 'DIRECTORY_WITH_ORIGINAL_GUIDANCE',
      suppliedText: d.text,
      referenceBookId: d.referenceBookId,
      referenceKnowledgePointId: d.referenceKnowledgePointId,
      referenceSourceId: d.referenceSourceId,
      originalHeading: d.originalHeading,
      suppliedLowerText: d.suppliedText,
      textQuality: d.quality,
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
    const id = `${d.knowledgePointId}_Q${index + 1}`
    const offset = (order + index) % seed.options.length
    const original = seed.options.map((label, n) => ({ label, n }))
    const labels = [...original.slice(offset), ...original.slice(0, offset)]
    const question: Question = {
      id,
      textbookVersionId: G6_CHINESE_2019_LOWER_S2_TEXTBOOK_ID,
      knowledgePointId: d.knowledgePointId,
      gradeId: 'GRADE_6',
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
      tags: ['g6-2019-chinese-lower-original', 'provided-text-comprehension'],
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
    gradeSixChinese2019LowerQuestions.push(question)
    gradeSixChinese2019LowerMappings.push({
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
  gradeSixChinese2019LowerBundles.push({
    textbookId: G6_CHINESE_2019_LOWER_S2_TEXTBOOK_ID,
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
