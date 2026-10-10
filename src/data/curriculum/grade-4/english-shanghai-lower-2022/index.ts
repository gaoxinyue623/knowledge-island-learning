import soundsSupplement from './sounds-supplement.json'
import supplied from './contents.json'
import { G1_SHANGHAI_ENGLISH_PUBLISHER_ID } from '../../grade-1/english-shanghai-upper'
import {
  G4_SHANGHAI_ENGLISH_LOWER_IMPORTED_AT as importedAt,
  G4_SHANGHAI_ENGLISH_LOWER_IMPORT_APPROVAL as approval,
} from '../../production/gradeFourEnglishLowerApproval'
import type { CurriculumData } from '../../types'
import type {
  ContentExpansionBundle,
  CourseContent,
  LearningContent,
  Question,
  QuestionKnowledgePoint,
} from '@/types'

export const G4_SHANGHAI_ENGLISH_S2_TEXTBOOK_ID = 'G4_SHANGHAI_ENGLISH_S2_2022'
export const G4_SHANGHAI_ENGLISH_S2_CONTENT_SOURCE_ID = 'G4_SHANGHAI_ENGLISH_S2_USER_TEXT'
export const G4_SHANGHAI_ENGLISH_S2_PRACTICE_SOURCE_ID =
  'G4_SHANGHAI_ENGLISH_S2_ORIGINAL_PRACTICE_V1'
export const G4_SHANGHAI_ENGLISH_S2_SOUNDS_SOURCE_ID = 'G4_SHANGHAI_ENGLISH_S2_SOUNDS_USER_TEXT_V1'
export const gradeFourEnglishLowerSource = supplied
const reviewed = {
  isSample: false,
  needsVerification: false,
  verificationStatus: 'REVIEWED' as const,
  releaseApprovalId: approval,
}
export const gradeFourEnglishLowerCurriculum: Pick<
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
      id: G4_SHANGHAI_ENGLISH_S2_TEXTBOOK_ID,
      subjectId: 'SUBJECT_ENGLISH',
      gradeId: 'GRADE_4',
      semesterId: 'SEMESTER_LOWER',
      publisherId: G1_SHANGHAI_ENGLISH_PUBLISHER_ID,
      versionName: supplied.title,
      editionYear: 2022,
      sourceId: G4_SHANGHAI_ENGLISH_S2_CONTENT_SOURCE_ID,
      status: 'ACTIVE',
      createdAt: importedAt,
      updatedAt: importedAt,
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
      id: G4_SHANGHAI_ENGLISH_S2_SOUNDS_SOURCE_ID,
      sourceType: 'TEXTBOOK',
      title: '四年级下册12单元Phonics与Intonation（用户补充文本）',
      publisher: supplied.publisher,
      edition: supplied.title,
      sourceRef: 'user-provided://g4-shanghai-english-lower/sounds/2026-10-10',
      sourceVersion: `SHA256:${soundsSupplement.sourceSha256}`,
      copyrightStatus: 'PENDING',
      notes: soundsSupplement.sourceNote,
      verifiedAt: soundsSupplement.updatedAt,
      ...reviewed,
    },
    {
      id: G4_SHANGHAI_ENGLISH_S2_CONTENT_SOURCE_ID,
      sourceType: 'TEXTBOOK',
      title: `${supplied.title}用户提供双语文本`,
      publisher: supplied.publisher,
      edition: supplied.title,
      sourceRef: 'user-provided://g4-shanghai-english-lower/2026-10-09',
      sourceVersion: `SHA256:${supplied.sourceSha256}`,
      copyrightStatus: 'PENDING',
      notes: supplied.sourceNote,
      verifiedAt: importedAt,
      ...reviewed,
    },
    {
      id: G4_SHANGHAI_ENGLISH_S2_PRACTICE_SOURCE_ID,
      sourceType: 'AI_GENERATED',
      title: '沪教牛津四年级下册英语原创配套练习与口语提示',
      sourceRef: 'local-original://g4-shanghai-english-lower/practice-v1',
      sourceVersion: 'ORIGINAL_PRACTICE_V1',
      copyrightStatus: 'PENDING',
      notes: 'Codex 根据用户文本编写并校验；口头表达和Project活动无唯一答案，不自动判分。',
      verifiedAt: importedAt,
      ...reviewed,
    },
  ],
}

export const gradeFourEnglishLowerQuestions: Question[] = []
export const gradeFourEnglishLowerMappings: QuestionKnowledgePoint[] = []
export const gradeFourEnglishLowerBundles: ContentExpansionBundle[] = []
export const gradeFourEnglishLowerDefinitions = [...supplied.units, ...soundsSupplement.units].map(
  (unit) => ({
    ...unit,
    text: unit.sections.map((section) => `${section.english}\n${section.chinese}`).join('\n\n'),
    unitId: `G4_SHANGHAI_ENGLISH_S2_UNIT_${String(unit.number).padStart(2, '0')}`,
    lessonId: `G4_SHANGHAI_ENGLISH_S2_LESSON_${String(unit.number).padStart(2, '0')}`,
    knowledgePointId: `G4_SHANGHAI_ENGLISH_S2_KP_${String(unit.number).padStart(2, '0')}`,
  }),
)
export const gradeFourEnglishLowerProjectIds = gradeFourEnglishLowerDefinitions
  .filter((d) => d.kind !== 'unit')
  .map((d) => d.knowledgePointId)
const sectionTitles: Record<string, string> = {
  story: '课文阅读',
  project: '项目活动',
  review: '综合练习',
  appendix: '语音附录',
}
for (const d of gradeFourEnglishLowerDefinitions) {
  const isSoundsSupplement = d.kind === 'appendix'
  const contentSourceId = isSoundsSupplement
    ? G4_SHANGHAI_ENGLISH_S2_SOUNDS_SOURCE_ID
    : G4_SHANGHAI_ENGLISH_S2_CONTENT_SOURCE_ID
  const contentImportedAt = isSoundsSupplement ? soundsSupplement.updatedAt : importedAt
  const sourceNote = isSoundsSupplement ? soundsSupplement.sourceNote : supplied.sourceNote
  const pageNote = d.page
    ? `用户标注第${d.page}页`
    : isSoundsSupplement
      ? '用户补充语音附录'
      : '用户附加综合练习'
  const missingSections: string[] = []
  const goals = isSoundsSupplement
    ? ['按来稿分组认读例词、朗读韵文或完整语调示范', '观察字母组合及↗、↘标记，练习朗读']
    : d.kind === 'review'
      ? ['复习作息、职业、喜好与现在进行时', '完成配套综合练习并核对答案']
      : d.kind === 'project'
        ? ['运用已学英语词句完成作品', '向同伴介绍作品，由老师或家长核对表达']
        : [
            `认读本单元${d.words.length}个核心词汇并理解中文释义`,
            '理解课文信息并用本课句型交流',
            '听读英文，尝试自然表达',
          ]
  gradeFourEnglishLowerCurriculum.units.push({
    id: d.unitId,
    textbookVersionId: G4_SHANGHAI_ENGLISH_S2_TEXTBOOK_ID,
    code: `G4-SHANGHAI-ENGLISH-S2-U${d.number}`,
    title: d.title,
    subtitle: `${pageNote}；按提供的双语文本学习。`,
    sortOrder: d.number,
    sceneKey: `english-lower-unit-${d.number}`,
    sourceId: contentSourceId,
    status: 'ACTIVE',
    ...reviewed,
  })
  gradeFourEnglishLowerCurriculum.lessons.push({
    id: d.lessonId,
    unitId: d.unitId,
    code: `G4-SHANGHAI-ENGLISH-S2-L${d.number}`,
    title: d.title,
    sortOrder: 1,
    sourceId: contentSourceId,
    status: 'ACTIVE',
    ...reviewed,
  })
  gradeFourEnglishLowerCurriculum.knowledgePoints.push({
    id: d.knowledgePointId,
    code: `G4-SHANGHAI-ENGLISH-S2-K${d.number}`,
    name: d.title,
    subjectId: 'SUBJECT_ENGLISH',
    gradeScope: { minGrade: 4, maxGrade: 4, explicitGradeIds: ['GRADE_4'] },
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
  gradeFourEnglishLowerCurriculum.lessonKnowledgePointRelations.push({
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
  const texts = d.sections.map(
    (section) =>
      `${sectionTitles[section.kind]}${isSoundsSupplement ? ' · ' + section.title : ''}\n${section.kind === 'story' ? 'Story: ' + section.title + '\n' : ''}${section.english}\n\n中文译文\n${section.chinese}`,
  )
  if ('notes' in d && Array.isArray(d.notes) && d.notes.length)
    texts.unshift(`接入说明\n${d.notes.join('\n')}`)
  if (d.words.length)
    texts.push(
      `核心单词（用户提供）\n${[...d.words, ...d.aliases].map((w) => `${w.english} ${'phonetic' in w ? w.phonetic + ' ' : ''}${w.chinese}`).join('\n')}`,
    )
  if (d.sounds)
    texts.push(
      `自然拼读 Sounds\n本单元字母组合：${d.sounds}。\n来稿仅提供字母组合，未提供示范音频。`,
    )
  if (d.intonation)
    texts.push(
      `语调练习 Intonation\n来稿栏目：${d.intonation}。完整示范与↗、↘语调标记见Intonation语调附录；原版示范音频未提供。`,
    )
  if (d.sentencePattern)
    texts.push(
      `核心句型\n${d.sentencePattern}\n\n项目补充口语练习\n${d.sentencePrompt}\n参考表达：${d.sentenceAnswer}\n\n个人表达没有唯一答案，不自动评分。`,
    )
  texts.push(`来源说明\n${pageNote}。${sourceNote}`)
  const content: CourseContent = {
    id: `${d.knowledgePointId}_CONTENT_V1`,
    knowledgePointId: d.knowledgePointId,
    title: d.title,
    contentType: 'TEXTBOOK',
    contentFormat: 'TEXT',
    body: {
      lessonId: d.lessonId,
      summary: d.kind !== 'unit' ? d.sentencePrompt : `围绕${d.title}进行认读、跟读和口语交流。`,
      learningGoals: goals,
      sourceScope: isSoundsSupplement
        ? 'USER_PROVIDED_SOUNDS_SUPPLEMENT'
        : 'USER_PROVIDED_BILINGUAL_TEXT',
      sourceNote,
      sectionKinds: d.sections.map((s) => s.kind),
      missingSections,
      vocabularySourceId: contentSourceId,
      suppliedPage: d.page || null,
      sounds: d.sounds,
      intonation: d.intonation,
      activityOnly: d.kind !== 'unit',
      blocks: texts.map((text) => ({ type: 'TEXT', text })),
    },
    difficulty: 'FOUNDATION',
    sourceId: contentSourceId,
    status: 'PUBLISHED',
    currentVersion: 1,
    createdAt: contentImportedAt,
    updatedAt: contentImportedAt,
    ...reviewed,
  }
  gradeFourEnglishLowerCurriculum.courseContents.push(content)
  const questions: Question[] = d.questions.map((seed, index) => {
    const id = `${d.knowledgePointId}_Q${index + 1}`
    const offset = (d.number + index) % seed.options.length
    const labels = seed.options.map((label, original) => ({ label, original }))
    const options = [...labels.slice(offset), ...labels.slice(0, offset)]
    return {
      id,
      questionType: 'singleChoice',
      textbookVersionId: G4_SHANGHAI_ENGLISH_S2_TEXTBOOK_ID,
      knowledgePointId: d.knowledgePointId,
      gradeId: 'GRADE_4',
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
      sourceId: G4_SHANGHAI_ENGLISH_S2_PRACTICE_SOURCE_ID,
      status: 'PUBLISHED',
      estimatedSeconds: 60,
      tags: ['g4-shanghai-english-lower-original', ['vocabulary', 'dialogue', 'story'][index]!],
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
  gradeFourEnglishLowerQuestions.push(...questions)
  gradeFourEnglishLowerMappings.push(
    ...questions.map((question, index): QuestionKnowledgePoint => ({
      id: `mapping:${question.id}`,
      questionId: question.id,
      knowledgePointId: d.knowledgePointId,
      relationType: 'PRIMARY',
      weight: 1,
      order: index + 1,
      isPrimary: true,
      sourceId: G4_SHANGHAI_ENGLISH_S2_PRACTICE_SOURCE_ID,
      status: 'ACTIVE',
      ...reviewed,
    })),
  )
  const learning: LearningContent = {
    id: `${d.knowledgePointId}:learning:v1`,
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
    sourceId: G4_SHANGHAI_ENGLISH_S2_PRACTICE_SOURCE_ID,
    status: 'PUBLISHED',
    contentStatus: 'PUBLISHED',
    currentVersion: 1,
    createdAt: importedAt,
    updatedAt: importedAt,
    ...reviewed,
  }
  gradeFourEnglishLowerBundles.push({
    textbookId: G4_SHANGHAI_ENGLISH_S2_TEXTBOOK_ID,
    unitId: d.unitId,
    lessonId: d.lessonId,
    knowledgePointId: d.knowledgePointId,
    learningContent: learning,
    activities: [],
    exerciseTemplates: [],
    practiceSets: [],
    challenges: [],
    extensionActivities:
      d.kind === 'review' || isSoundsSupplement
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
                        : `用本课句型“${d.sentencePattern}”和同伴练习。`,
                  },
                ],
              },
              referenceAnswer: `参考表达：${d.sentenceAnswer}。个人表达不自动判分。`,
              sourceId: G4_SHANGHAI_ENGLISH_S2_PRACTICE_SOURCE_ID,
              ...reviewed,
            },
          ],
  })
}
