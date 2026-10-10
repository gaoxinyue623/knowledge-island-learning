import supplied from './contents.json'
import supplement from './supplement.json'
import { G1_SHANGHAI_ENGLISH_PUBLISHER_ID } from '../../grade-1/english-shanghai-upper'
import {
  G5_SHANGHAI_ENGLISH_LOWER_IMPORTED_AT as importedAt,
  G5_SHANGHAI_ENGLISH_LOWER_IMPORT_APPROVAL as approval,
} from '../../production/gradeFiveEnglishLowerApproval'
import type { CurriculumData } from '../../types'
import type {
  ContentExpansionBundle,
  CourseContent,
  LearningContent,
  Question,
  QuestionKnowledgePoint,
} from '@/types'

export const G5_SHANGHAI_ENGLISH_S2_TEXTBOOK_ID = 'G5_SHANGHAI_ENGLISH_S2_USER_TEXT'
export const G5_SHANGHAI_ENGLISH_S2_CONTENT_SOURCE_ID = 'G5_SHANGHAI_ENGLISH_S2_USER_TEXT'
export const G5_SHANGHAI_ENGLISH_S2_PRACTICE_SOURCE_ID =
  'G5_SHANGHAI_ENGLISH_S2_ORIGINAL_PRACTICE_V1'
export const G5_SHANGHAI_ENGLISH_S2_SUPPLEMENT_SOURCE_ID =
  'G5_SHANGHAI_ENGLISH_S2_USER_SUPPLEMENT_2026_10_10'
export const gradeFiveEnglishLowerSource = supplied
export const gradeFiveEnglishLowerSupplement = supplement
const sourceNote = `按用户提供文本整理，保留原有双语课文、词汇音标和配套练习。${supplement.sourceNote}`
const reviewed = {
  isSample: false,
  needsVerification: false,
  verificationStatus: 'REVIEWED' as const,
  releaseApprovalId: approval,
}
export const gradeFiveEnglishLowerCurriculum: Pick<
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
      id: G5_SHANGHAI_ENGLISH_S2_TEXTBOOK_ID,
      subjectId: 'SUBJECT_ENGLISH',
      gradeId: 'GRADE_5',
      semesterId: 'SEMESTER_LOWER',
      publisherId: G1_SHANGHAI_ENGLISH_PUBLISHER_ID,
      versionName: supplement.title,
      editionYear: supplement.editionYear,
      sourceId: G5_SHANGHAI_ENGLISH_S2_CONTENT_SOURCE_ID,
      status: 'ACTIVE',
      createdAt: importedAt,
      updatedAt: supplement.updatedAt,
      ...reviewed,
    },
  ],
  units: [],
  lessons: [],
  knowledgePoints: [],
  lessonKnowledgePointRelations: [],
  knowledgePrerequisites: [],
  courseContents: [],
  sources: [
    {
      id: G5_SHANGHAI_ENGLISH_S2_CONTENT_SOURCE_ID,
      sourceType: 'TEXTBOOK',
      title: `${supplied.title}用户提供双语文本`,
      publisher: supplied.publisher,
      edition: supplied.title,
      sourceRef: 'user-provided://g5-shanghai-english-lower/2026-10-09',
      sourceVersion: `SHA256:${supplied.sourceSha256}`,
      copyrightStatus: 'PENDING',
      notes: supplied.sourceNote,
      verifiedAt: importedAt,
      ...reviewed,
    },
    {
      id: G5_SHANGHAI_ENGLISH_S2_SUPPLEMENT_SOURCE_ID,
      sourceType: 'TEXTBOOK',
      title: `${supplement.title}用户补充稿`,
      publisher: supplied.publisher,
      edition: supplement.title,
      sourceRef: 'user-provided://g5-shanghai-english-lower/supplement/2026-10-10',
      sourceVersion: `SHA256:${supplement.sourceSha256}`,
      copyrightStatus: 'PENDING',
      notes: supplement.sourceNote,
      verifiedAt: supplement.updatedAt,
      ...reviewed,
    },
    {
      id: G5_SHANGHAI_ENGLISH_S2_PRACTICE_SOURCE_ID,
      sourceType: 'AI_GENERATED',
      title: '沪教牛津五年级下册英语原创配套练习与口语提示',
      sourceRef: 'local-original://g5-shanghai-english-lower/practice-v1',
      sourceVersion: 'ORIGINAL_PRACTICE_V1',
      copyrightStatus: 'PENDING',
      notes: 'Codex 根据用户文本编写并校验；口头表达和Project活动无唯一答案，不自动判分。',
      verifiedAt: importedAt,
      ...reviewed,
    },
  ],
}

export const gradeFiveEnglishLowerQuestions: Question[] = []
export const gradeFiveEnglishLowerMappings: QuestionKnowledgePoint[] = []
export const gradeFiveEnglishLowerBundles: ContentExpansionBundle[] = []
type SupplementNode = Partial<(typeof supplied.units)[number]> & {
  number: number
  phonicsExamples?: { letters: string; phonetic: string; word: string }[]
}
const updatesByNumber = new Map<number, SupplementNode>(
  supplement.nodes.map((node) => [node.number, node]),
)
export const gradeFiveEnglishLowerDefinitions = supplied.units.map((unit) => {
  const update = updatesByNumber.get(unit.number)
  const sections = update?.sections ?? unit.sections
  return {
    ...unit,
    ...update,
    sections,
    phonicsExamples: update?.phonicsExamples ?? [],
    missingSections: update ? [] : unit.missingSections,
    revision: update ? 2 : 1,
    text: sections.map((section) => `${section.english}\n${section.chinese}`).join('\n\n'),
    unitId: `G5_SHANGHAI_ENGLISH_S2_MODULE_${String(unit.moduleNumber).padStart(2, '0')}`,
    lessonId: `G5_SHANGHAI_ENGLISH_S2_LESSON_${String(unit.number).padStart(2, '0')}`,
    knowledgePointId: `G5_SHANGHAI_ENGLISH_S2_KP_${String(unit.number).padStart(2, '0')}`,
  }
})
export const gradeFiveEnglishLowerProjectIds = gradeFiveEnglishLowerDefinitions
  .filter((d) => d.kind !== 'unit')
  .map((d) => d.knowledgePointId)
const sectionTitles: Record<string, string> = {
  story: '主课文 Listen and say',
  dialogue: '主课文 Listen and say',
  directory: '目录栏目',
  project: '项目活动',
  review: '综合练习',
  revision: '模块复习（用户提供提要与任务）',
  appendix: '册末材料',
  'appendix-words': '单词复习',
}
for (const module of supplied.modules) {
  gradeFiveEnglishLowerCurriculum.units.push({
    id: `G5_SHANGHAI_ENGLISH_S2_MODULE_${String(module.number).padStart(2, '0')}`,
    textbookVersionId: G5_SHANGHAI_ENGLISH_S2_TEXTBOOK_ID,
    code: `G5-SHANGHAI-ENGLISH-S2-M${module.number}`,
    title: module.title,
    subtitle:
      module.number === 5
        ? 'Word list 1/2、Daily expressions和Proper nouns按用户补充稿展示。'
        : '按来稿 Module 分组学习各 Unit 和活动。',
    sortOrder: module.number,
    sceneKey: `english-lower-module-${module.number}`,
    sourceId: G5_SHANGHAI_ENGLISH_S2_CONTENT_SOURCE_ID,
    status: 'ACTIVE',
    ...reviewed,
  })
}
for (const d of gradeFiveEnglishLowerDefinitions) {
  const contentSourceId =
    d.revision === 2
      ? G5_SHANGHAI_ENGLISH_S2_SUPPLEMENT_SOURCE_ID
      : G5_SHANGHAI_ENGLISH_S2_CONTENT_SOURCE_ID
  const updatedAt = d.revision === 2 ? supplement.updatedAt : importedAt
  const missingSections: string[] = [...d.missingSections]
  const goals =
    d.kind === 'directory'
      ? d.sections.some((s) => s.kind === 'revision')
        ? ['复盘本模块的词汇、句型与语音', '按来稿任务进行交流和复习']
        : ['认读并复习册末词汇和日常用语', '联系单元内容进行积累']
      : d.kind === 'project'
        ? ['运用已学英语词句完成作品', '向同伴介绍作品，由老师或家长核对表达']
        : [
            `认读本单元${d.words.length}个核心词汇并理解中文释义`,
            '理解课文信息并用本课句型交流',
            '听读英文，尝试自然表达',
          ]
  gradeFiveEnglishLowerCurriculum.lessons.push({
    id: d.lessonId,
    unitId: d.unitId,
    code: `G5-SHANGHAI-ENGLISH-S2-L${d.number}`,
    title: d.title,
    sortOrder: supplied.units.findIndex((u) => u.number === d.number) + 1,
    sourceId: contentSourceId,
    status: 'ACTIVE',
    ...reviewed,
  })
  gradeFiveEnglishLowerCurriculum.knowledgePoints.push({
    id: d.knowledgePointId,
    code: `G5-SHANGHAI-ENGLISH-S2-K${d.number}`,
    name: d.title,
    subjectId: 'SUBJECT_ENGLISH',
    gradeScope: { minGrade: 5, maxGrade: 5, explicitGradeIds: ['GRADE_5'] },
    description:
      d.kind !== 'unit' ? d.sentencePrompt : `学习${d.title}中的核心词汇、双语课文与日常问答。`,
    learningObjective: goals,
    abilityTags:
      d.kind !== 'unit' ? ['开放实践', '英语表达'] : ['词汇认读', '文本理解', '英语表达'],
    difficultyLevel: 'FOUNDATION',
    sourceId: contentSourceId,
    status: 'ACTIVE',
    ...reviewed,
  })
  gradeFiveEnglishLowerCurriculum.lessonKnowledgePointRelations.push({
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
  // Keep English and Chinese separately visible; speech projects English only.
  const texts = d.sections.map((section) =>
    section.kind === 'dialogue' || section.kind === 'story'
      ? `${sectionTitles[section.kind]}\n${section.kind === 'story' ? 'Story: ' + section.title + '\n' : ''}${section.english}\n\n中文译文\n${section.chinese}`
      : `${sectionTitles[section.kind]}\n栏目：${section.title}\n${section.english}\n${section.chinese}`,
  )
  if (d.words.length)
    texts.push(
      `核心单词（用户提供）\n${[...d.words, ...d.aliases].map((w) => `${w.english} ${'phonetic' in w ? w.phonetic + ' ' : ''}${w.chinese}`).join('\n')}`,
    )
  if (d.sounds)
    texts.push(
      d.phonicsExamples?.length
        ? `自然拼读 Sounds\n${d.phonicsExamples.map((example) => `字母组合：${example.letters} ${example.phonetic}\n单词：${example.word}`).join('\n')}\n语音示例按用户补充稿展示，可使用英文跟读；未提供原版示范音频。`
        : `自然拼读 Sounds\n本单元字母组合：${d.sounds}。\n来稿仅提供字母组合，未提供示范音频。`,
    )
  if (d.intonation)
    texts.push(`语调练习 Intonation\n来稿栏目：${d.intonation}。未提供具体语调标记或示范音频。`)
  if (d.speechFeature)
    texts.push(`语音练习\n本单元栏目：${d.speechFeature}。\n来稿未提供具体语音标记或示范音频。`)
  if (d.sentencePattern)
    texts.push(`核心句型（用户提供）
${d.sentencePattern}`)
  if (d.kind === 'unit')
    texts.push(`项目补充口语练习
${d.sentencePrompt}
参考表达：${d.sentenceAnswer}
个人表达没有唯一答案，不自动评分。`)
  if (missingSections.length)
    texts.push(`栏目说明
来稿未提供：${missingSections.join('、')}。此处未补写教材正文。`)
  if (d.notes.length)
    texts.push(`内容核对说明
${d.notes.join('\n')}`)
  texts.push(`来源说明\n${d.page ? `用户标注第${d.page}页` : '用户附加综合练习'}。${sourceNote}`)
  const content: CourseContent = {
    id: `${d.knowledgePointId}_CONTENT_V${d.revision}`,
    knowledgePointId: d.knowledgePointId,
    title: d.title,
    contentType: 'TEXTBOOK',
    contentFormat: 'TEXT',
    body: {
      lessonId: d.lessonId,
      summary: d.kind !== 'unit' ? d.sentencePrompt : `围绕${d.title}进行认读、跟读和口语交流。`,
      learningGoals: goals,
      sourceScope: 'USER_PROVIDED_BILINGUAL_TEXT',
      sourceNote,
      sourceIds:
        d.revision === 2
          ? [G5_SHANGHAI_ENGLISH_S2_CONTENT_SOURCE_ID, contentSourceId]
          : [contentSourceId],
      sectionKinds: d.sections.map((s) => s.kind),
      missingSections,
      vocabularySourceId: G5_SHANGHAI_ENGLISH_S2_CONTENT_SOURCE_ID,
      suppliedPage: d.page || null,
      moduleNumber: d.moduleNumber,
      sounds: d.sounds,
      phonicsExamples: d.phonicsExamples ?? [],
      intonation: d.intonation,
      speechFeature: d.speechFeature,
      activityOnly: d.kind !== 'unit',
      blocks: texts.map((text) => ({ type: 'TEXT', text })),
    },
    difficulty: 'FOUNDATION',
    sourceId: contentSourceId,
    status: 'PUBLISHED',
    currentVersion: d.revision,
    createdAt: importedAt,
    updatedAt,
    ...reviewed,
  }
  gradeFiveEnglishLowerCurriculum.courseContents.push(content)
  const questions: Question[] = d.questions.map((seed, index) => {
    const id = `${d.knowledgePointId}_Q${index + 1}`
    const offset = (d.number + index) % seed.options.length
    const labels = seed.options.map((label, original) => ({ label, original }))
    const options = [...labels.slice(offset), ...labels.slice(0, offset)]
    return {
      id,
      questionType: 'singleChoice',
      textbookVersionId: G5_SHANGHAI_ENGLISH_S2_TEXTBOOK_ID,
      knowledgePointId: d.knowledgePointId,
      gradeId: 'GRADE_5',
      semesterId: 'SEMESTER_LOWER',
      subjectId: 'SUBJECT_ENGLISH',
      stem: [{ type: 'TEXT', text: seed.stem }],
      options: options.map((option, order) => ({
        id: `${id}:option:${order}`,
        questionId: id,
        optionKey: String.fromCharCode(65 + order),
        sortOrder: order,
        content: [{ type: 'TEXT', text: option.label }],
      })),
      answerRule: {
        ruleType: 'SINGLE_OPTION',
        correctOptionKey: String.fromCharCode(
          65 + options.findIndex((o) => o.original === seed.correctIndex),
        ),
      },
      difficulty: index === 0 ? 'FOUNDATION' : 'STANDARD',
      contentType: 'EXTENSION',
      sourceId: G5_SHANGHAI_ENGLISH_S2_PRACTICE_SOURCE_ID,
      status: 'PUBLISHED',
      estimatedSeconds: 60,
      tags: ['g5-shanghai-english-lower-original', ['vocabulary', 'dialogue', 'story'][index]!],
      hints: [
        {
          id: `${id}:hint`,
          order: 1,
          trigger: 'ON_REQUEST',
          content: [{ type: 'TEXT', text: '回看本单元词汇、对话或故事，找到原文依据。' }],
        },
      ],
      explanation: { summary: [{ type: 'TEXT', text: seed.explanation }], steps: [] },
      media: [],
      questionVersion: 1,
      ...reviewed,
    }
  })
  gradeFiveEnglishLowerQuestions.push(...questions)
  gradeFiveEnglishLowerMappings.push(
    ...questions.map((question, index): QuestionKnowledgePoint => ({
      id: `mapping:${question.id}`,
      questionId: question.id,
      knowledgePointId: d.knowledgePointId,
      relationType: 'PRIMARY',
      weight: 1,
      order: index + 1,
      isPrimary: true,
      sourceId: G5_SHANGHAI_ENGLISH_S2_PRACTICE_SOURCE_ID,
      status: 'ACTIVE',
      ...reviewed,
    })),
  )
  const learningRevision = d.kind === 'unit' ? 1 : d.revision
  const learning: LearningContent = {
    id: `${d.knowledgePointId}:learning:v${learningRevision}`,
    lessonId: d.lessonId,
    knowledgePointId: d.knowledgePointId,
    title: d.title,
    learningGoals: goals,
    blocks: [
      {
        id: `${d.knowledgePointId}:practice:intro`,
        block: {
          type: 'TEXT',
          text:
            d.kind !== 'unit'
              ? d.sentencePrompt + (d.kind === 'project' ? '作品和个人表达不自动评分。' : '')
              : '先阅读双语文本，再完成词义、句型和阅读理解题。强化训练包含拼写、词义配对和组句。',
        },
        stepType: 'intro',
        sort: 1,
        ...reviewed,
      },
    ],
    steps: [
      {
        id: `${d.knowledgePointId}:practice:step`,
        type: 'intro',
        contentBlockIds: [`${d.knowledgePointId}:practice:intro`],
        required: true,
        sort: 1,
      },
    ],
    sourceId: d.kind === 'unit' ? G5_SHANGHAI_ENGLISH_S2_PRACTICE_SOURCE_ID : contentSourceId,
    status: 'PUBLISHED',
    contentStatus: 'PUBLISHED',
    currentVersion: learningRevision,
    createdAt: importedAt,
    updatedAt: learningRevision === 2 ? updatedAt : importedAt,
    ...reviewed,
  }
  gradeFiveEnglishLowerBundles.push({
    textbookId: G5_SHANGHAI_ENGLISH_S2_TEXTBOOK_ID,
    unitId: d.unitId,
    lessonId: d.lessonId,
    knowledgePointId: d.knowledgePointId,
    learningContent: learning,
    activities: [],
    exerciseTemplates: [],
    practiceSets: [],
    challenges: [],
    extensionActivities:
      d.kind === 'directory'
        ? []
        : [
            {
              id: `${d.knowledgePointId}:speak`,
              knowledgePointId: d.knowledgePointId,
              title: d.kind !== 'unit' ? '完成作品并交流' : '口语交流',
              instruction: d.sentencePrompt,
              content: {
                blocks: [
                  {
                    type: 'hint',
                    value:
                      d.kind !== 'unit'
                        ? '完成作品后，用已学英语向同伴介绍。'
                        : d.sentencePattern
                          ? `用本课句型“${d.sentencePattern}”和同伴练习。`
                          : '用主课文中的词句和同伴交流；参考表达为项目补充。',
                  },
                ],
              },
              referenceAnswer:
                d.kind === 'project'
                  ? d.sentenceAnswer
                  : `参考表达：${d.sentenceAnswer}。个人表达不自动判分。`,
              sourceId:
                d.kind === 'project' ? contentSourceId : G5_SHANGHAI_ENGLISH_S2_PRACTICE_SOURCE_ID,
              ...reviewed,
            },
          ],
  })
}
