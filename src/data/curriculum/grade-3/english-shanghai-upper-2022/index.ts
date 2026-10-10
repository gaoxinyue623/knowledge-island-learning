import supplied from './contents.json'
import { G1_SHANGHAI_ENGLISH_PUBLISHER_ID } from '../../grade-1/english-shanghai-upper'
import {
  G3_SHANGHAI_ENGLISH_UPPER_IMPORTED_AT as importedAt,
  G3_SHANGHAI_ENGLISH_UPPER_IMPORT_APPROVAL as approval,
} from '../../production/gradeThreeEnglishUpperApproval'
import type { CurriculumData } from '../../types'
import type {
  ContentExpansionBundle,
  CourseContent,
  LearningContent,
  Question,
  QuestionKnowledgePoint,
} from '@/types'

export const G3_SHANGHAI_ENGLISH_S1_TEXTBOOK_ID = 'G3_SHANGHAI_ENGLISH_S1_2022'
export const G3_SHANGHAI_ENGLISH_S1_CONTENT_SOURCE_ID = 'G3_SHANGHAI_ENGLISH_S1_USER_TEXT'
export const G3_SHANGHAI_ENGLISH_S1_PRACTICE_SOURCE_ID =
  'G3_SHANGHAI_ENGLISH_S1_ORIGINAL_PRACTICE_V1'
export const gradeThreeEnglishUpperSource = supplied
const reviewed = {
  isSample: false,
  needsVerification: false,
  verificationStatus: 'REVIEWED' as const,
  releaseApprovalId: approval,
}
export const gradeThreeEnglishUpperCurriculum: Pick<
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
      id: G3_SHANGHAI_ENGLISH_S1_TEXTBOOK_ID,
      subjectId: 'SUBJECT_ENGLISH',
      gradeId: 'GRADE_3',
      semesterId: 'SEMESTER_UPPER',
      publisherId: G1_SHANGHAI_ENGLISH_PUBLISHER_ID,
      versionName: supplied.title,
      editionYear: 2022,
      sourceId: G3_SHANGHAI_ENGLISH_S1_CONTENT_SOURCE_ID,
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
      id: G3_SHANGHAI_ENGLISH_S1_CONTENT_SOURCE_ID,
      sourceType: 'TEXTBOOK',
      title: `${supplied.title}用户提供双语文本`,
      publisher: supplied.publisher,
      edition: supplied.title,
      sourceRef: 'user-provided://g3-shanghai-english-upper/2026-10-09',
      sourceVersion: `SHA256:${supplied.sourceSha256}`,
      copyrightStatus: 'PENDING',
      notes: supplied.sourceNote,
      verifiedAt: importedAt,
      ...reviewed,
    },
    {
      id: G3_SHANGHAI_ENGLISH_S1_PRACTICE_SOURCE_ID,
      sourceType: 'AI_GENERATED',
      title: '沪教牛津三年级上册英语原创配套练习与口语提示',
      sourceRef: 'local-original://g3-shanghai-english-upper/practice-v1',
      sourceVersion: 'ORIGINAL_PRACTICE_V1',
      copyrightStatus: 'PENDING',
      notes: 'Codex 根据用户文本编写并校验；口头表达和Project活动无唯一答案，不自动判分。',
      verifiedAt: importedAt,
      ...reviewed,
    },
  ],
}

export const gradeThreeEnglishUpperQuestions: Question[] = []
export const gradeThreeEnglishUpperMappings: QuestionKnowledgePoint[] = []
export const gradeThreeEnglishUpperBundles: ContentExpansionBundle[] = []
export const gradeThreeEnglishUpperDefinitions = supplied.units.map((unit) => ({
  ...unit,
  text: unit.sections.map((section) => `${section.english}\n${section.chinese}`).join('\n\n'),
  unitId: `G3_SHANGHAI_ENGLISH_S1_UNIT_${String(unit.number).padStart(2, '0')}`,
  lessonId: `G3_SHANGHAI_ENGLISH_S1_LESSON_${String(unit.number).padStart(2, '0')}`,
  knowledgePointId: `G3_SHANGHAI_ENGLISH_S1_KP_${String(unit.number).padStart(2, '0')}`,
}))
export const gradeThreeEnglishUpperProjectIds = gradeThreeEnglishUpperDefinitions
  .filter((d) => d.kind === 'project')
  .map((d) => d.knowledgePointId)
const sectionTitles: Record<string, string> = { story: '课文阅读', project: '项目活动' }
for (const d of gradeThreeEnglishUpperDefinitions) {
  const missingSections: string[] = []
  const goals =
    d.kind === 'project'
      ? ['运用已学英语词句完成作品', '向同伴介绍作品，由老师或家长核对表达']
      : [
          `认读本单元${d.words.length}个核心词汇并理解中文释义`,
          '理解课文信息并用本课句型交流',
          '听读英文，尝试自然表达',
        ]
  gradeThreeEnglishUpperCurriculum.units.push({
    id: d.unitId,
    textbookVersionId: G3_SHANGHAI_ENGLISH_S1_TEXTBOOK_ID,
    code: `G3-SHANGHAI-ENGLISH-S1-U${d.number}`,
    title: d.title,
    subtitle: `用户标注第${d.page}页；按提供的双语文本学习。`,
    sortOrder: d.number,
    sceneKey: `english-upper-unit-${d.number}`,
    sourceId: G3_SHANGHAI_ENGLISH_S1_CONTENT_SOURCE_ID,
    status: 'ACTIVE',
    ...reviewed,
  })
  gradeThreeEnglishUpperCurriculum.lessons.push({
    id: d.lessonId,
    unitId: d.unitId,
    code: `G3-SHANGHAI-ENGLISH-S1-L${d.number}`,
    title: d.title,
    sortOrder: 1,
    sourceId: G3_SHANGHAI_ENGLISH_S1_CONTENT_SOURCE_ID,
    status: 'ACTIVE',
    ...reviewed,
  })
  gradeThreeEnglishUpperCurriculum.knowledgePoints.push({
    id: d.knowledgePointId,
    code: `G3-SHANGHAI-ENGLISH-S1-K${d.number}`,
    name: d.title,
    subjectId: 'SUBJECT_ENGLISH',
    gradeScope: { minGrade: 3, maxGrade: 3, explicitGradeIds: ['GRADE_3'] },
    description:
      d.kind === 'project' ? d.sentencePrompt : `学习${d.title}中的核心词汇、双语课文与日常问答。`,
    learningObjective: goals,
    abilityTags:
      d.kind === 'project' ? ['开放实践', '英语表达'] : ['词汇认读', '文本理解', '英语表达'],
    difficultyLevel: 'FOUNDATION',
    sourceId: G3_SHANGHAI_ENGLISH_S1_CONTENT_SOURCE_ID,
    status: 'ACTIVE',
    ...reviewed,
  })
  gradeThreeEnglishUpperCurriculum.lessonKnowledgePointRelations.push({
    id: `${d.knowledgePointId}_LKP`,
    lessonId: d.lessonId,
    knowledgePointId: d.knowledgePointId,
    relationType: 'CORE',
    order: 1,
    isPrimary: true,
    sourceId: G3_SHANGHAI_ENGLISH_S1_CONTENT_SOURCE_ID,
    status: 'ACTIVE',
    ...reviewed,
  })
  // Keep English and Chinese separately visible; speech projects English only.
  const texts = d.sections.map(
    (section) =>
      `${sectionTitles[section.kind]}\n${section.kind === 'story' ? 'Story: ' + section.title + '\n' : ''}${section.english}\n\n中文译文\n${section.chinese}`,
  )
  if (d.words.length)
    texts.push(
      `核心单词（用户提供）\n${[...d.words, ...d.aliases].map((w) => `${w.english} ${w.chinese}`).join('\n')}`,
    )
  if (d.sentencePattern)
    texts.push(
      `核心句型\n${d.sentencePattern}\n\n项目补充口语练习\n${d.sentencePrompt}\n参考表达：${d.sentenceAnswer}\n\n个人表达没有唯一答案，不自动评分。`,
    )
  texts.push(`来源说明\n用户标注第${d.page}页。${supplied.sourceNote}`)
  const content: CourseContent = {
    id: `${d.knowledgePointId}_CONTENT_V1`,
    knowledgePointId: d.knowledgePointId,
    title: d.title,
    contentType: 'TEXTBOOK',
    contentFormat: 'TEXT',
    body: {
      lessonId: d.lessonId,
      summary: d.kind === 'project' ? d.sentencePrompt : `围绕${d.title}进行认读、跟读和口语交流。`,
      learningGoals: goals,
      sourceScope: 'USER_PROVIDED_BILINGUAL_TEXT',
      sourceNote: supplied.sourceNote,
      sectionKinds: d.sections.map((s) => s.kind),
      missingSections,
      vocabularySourceId: G3_SHANGHAI_ENGLISH_S1_CONTENT_SOURCE_ID,
      suppliedPage: d.page,
      activityOnly: d.kind === 'project',
      blocks: texts.map((text) => ({ type: 'TEXT', text })),
    },
    difficulty: 'FOUNDATION',
    sourceId: G3_SHANGHAI_ENGLISH_S1_CONTENT_SOURCE_ID,
    status: 'PUBLISHED',
    currentVersion: 1,
    createdAt: importedAt,
    updatedAt: importedAt,
    ...reviewed,
  }
  gradeThreeEnglishUpperCurriculum.courseContents.push(content)
  const questions: Question[] = d.questions.map((seed, index) => {
    const id = `${d.knowledgePointId}_Q${index + 1}`
    const offset = (d.number + index) % seed.options.length
    const labels = seed.options.map((label, original) => ({ label, original }))
    const options = [...labels.slice(offset), ...labels.slice(0, offset)]
    return {
      id,
      questionType: 'singleChoice',
      textbookVersionId: G3_SHANGHAI_ENGLISH_S1_TEXTBOOK_ID,
      knowledgePointId: d.knowledgePointId,
      gradeId: 'GRADE_3',
      semesterId: 'SEMESTER_UPPER',
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
      sourceId: G3_SHANGHAI_ENGLISH_S1_PRACTICE_SOURCE_ID,
      status: 'PUBLISHED',
      estimatedSeconds: 60,
      tags: ['g3-shanghai-english-upper-original', ['vocabulary', 'dialogue', 'story'][index]!],
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
  gradeThreeEnglishUpperQuestions.push(...questions)
  gradeThreeEnglishUpperMappings.push(
    ...questions.map((question, index): QuestionKnowledgePoint => ({
      id: `mapping:${question.id}`,
      questionId: question.id,
      knowledgePointId: d.knowledgePointId,
      relationType: 'PRIMARY',
      weight: 1,
      order: index + 1,
      isPrimary: true,
      sourceId: G3_SHANGHAI_ENGLISH_S1_PRACTICE_SOURCE_ID,
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
            d.kind === 'project'
              ? d.sentencePrompt + '作品和个人表达不自动评分。'
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
    sourceId: G3_SHANGHAI_ENGLISH_S1_PRACTICE_SOURCE_ID,
    status: 'PUBLISHED',
    contentStatus: 'PUBLISHED',
    currentVersion: 1,
    createdAt: importedAt,
    updatedAt: importedAt,
    ...reviewed,
  }
  gradeThreeEnglishUpperBundles.push({
    textbookId: G3_SHANGHAI_ENGLISH_S1_TEXTBOOK_ID,
    unitId: d.unitId,
    lessonId: d.lessonId,
    knowledgePointId: d.knowledgePointId,
    learningContent: learning,
    activities: [],
    exerciseTemplates: [],
    practiceSets: [],
    challenges: [],
    extensionActivities: [
      {
        id: `${d.knowledgePointId}:speak`,
        knowledgePointId: d.knowledgePointId,
        title: d.kind === 'project' ? '完成作品并交流' : '口语交流',
        instruction: d.sentencePrompt,
        content: {
          blocks: [
            {
              type: 'hint',
              value:
                d.kind === 'project'
                  ? '完成作品后，用已学英语向同伴介绍。'
                  : `用本课句型“${d.sentencePattern}”和同伴练习。`,
            },
          ],
        },
        referenceAnswer: `参考表达：${d.sentenceAnswer}。个人表达不自动判分。`,
        sourceId: G3_SHANGHAI_ENGLISH_S1_PRACTICE_SOURCE_ID,
        ...reviewed,
      },
    ],
  })
}
