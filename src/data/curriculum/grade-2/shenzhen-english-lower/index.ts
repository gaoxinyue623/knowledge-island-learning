import supplied from './contents.json'
import supplement from './supplement.json'
import { G1_SHANGHAI_ENGLISH_PUBLISHER_ID } from '../../grade-1/english-shanghai-upper'
import {
  SHENZHEN_ENGLISH_LOWER_IMPORTED_AT as importedAt,
  SHENZHEN_ENGLISH_LOWER_IMPORT_APPROVAL as approval,
} from '../../production/shenzhenEnglishLowerApproval'
import type { CurriculumData } from '../../types'
import type {
  ContentExpansionBundle,
  CourseContent,
  LearningContent,
  Question,
  QuestionKnowledgePoint,
} from '@/types'

export const G2_SHENZHEN_ENGLISH_S2_TEXTBOOK_ID = 'G2_SHENZHEN_SHANGHAI_ENGLISH_S2_2024'
export const G2_SHENZHEN_ENGLISH_S2_CONTENT_SOURCE_ID = 'G2_SHENZHEN_ENGLISH_S2_USER_TEXT'
export const G2_SHENZHEN_ENGLISH_S2_SUPPLEMENT_SOURCE_ID =
  'G2_SHENZHEN_ENGLISH_S2_SUPPLEMENT_TEXT_V2'
export const G2_SHENZHEN_ENGLISH_S2_PRACTICE_SOURCE_ID =
  'G2_SHENZHEN_ENGLISH_S2_ORIGINAL_PRACTICE_V1'
export const shenzhenEnglishLowerSource = supplied
export const shenzhenEnglishLowerSupplement = supplement
const reviewed = {
  isSample: false,
  needsVerification: false,
  verificationStatus: 'REVIEWED' as const,
  releaseApprovalId: approval,
}
export const shenzhenEnglishLowerCurriculum: Pick<
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
      id: G2_SHENZHEN_ENGLISH_S2_TEXTBOOK_ID,
      subjectId: 'SUBJECT_ENGLISH',
      gradeId: 'GRADE_2',
      semesterId: 'SEMESTER_LOWER',
      publisherId: G1_SHANGHAI_ENGLISH_PUBLISHER_ID,
      versionName: supplied.title,
      editionYear: '2025复审版',
      sourceId: G2_SHENZHEN_ENGLISH_S2_CONTENT_SOURCE_ID,
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
      id: G2_SHENZHEN_ENGLISH_S2_SUPPLEMENT_SOURCE_ID,
      sourceType: 'TEXTBOOK',
      title: supplement.title,
      publisher: supplied.publisher,
      edition: supplied.title,
      sourceRef: 'user-provided://g2-shenzhen-shanghai-english-lower/2026-10-10/supplement',
      sourceVersion: `SHA256:${supplement.sourceSha256}`,
      copyrightStatus: 'PENDING',
      notes: supplement.sourceNote,
      verifiedAt: supplement.updatedAt,
      ...reviewed,
    },
    {
      id: G2_SHENZHEN_ENGLISH_S2_CONTENT_SOURCE_ID,
      sourceType: 'TEXTBOOK',
      title: `${supplied.title}用户提供双语文本`,
      publisher: supplied.publisher,
      edition: supplied.title,
      sourceRef: 'user-provided://g2-shenzhen-shanghai-english-lower/2026-10-08',
      sourceVersion: `SHA256:${supplied.sourceSha256}`,
      copyrightStatus: 'PENDING',
      notes: supplied.sourceNote,
      verifiedAt: importedAt,
      ...reviewed,
    },
    {
      id: G2_SHENZHEN_ENGLISH_S2_PRACTICE_SOURCE_ID,
      sourceType: 'AI_GENERATED',
      title: '深圳沪教牛津二年级下册英语原创配套词汇释义与练习',
      sourceRef: 'local-original://g2-shenzhen-shanghai-english-lower/practice-v1',
      sourceVersion: 'ORIGINAL_PRACTICE_V1',
      copyrightStatus: 'PENDING',
      notes: 'Codex 根据上传文本编写并校验；口头表达和 Think 活动无唯一答案，不自动判分。',
      verifiedAt: importedAt,
      ...reviewed,
    },
  ],
}

export const shenzhenEnglishLowerQuestions: Question[] = []
export const shenzhenEnglishLowerMappings: QuestionKnowledgePoint[] = []
export const shenzhenEnglishLowerBundles: ContentExpansionBundle[] = []
const sectionOrder: Record<string, number> = {
  listen: 0,
  chant: 1,
  story: 2,
  communicate: 3,
  think: 4,
  extend: 5,
}
type EnglishSection = {
  title: string
  kind: string
  english: string
  chinese: string
  topic?: string
  parts?: (typeof supplement.sections)[number]['parts']
}
export const shenzhenEnglishLowerDefinitions = supplied.units.map((unit) => {
  const additions = supplement.sections.filter((section) => section.unit === unit.number)
  const sections: EnglishSection[] = [...unit.sections, ...additions].sort(
    (a, b) => sectionOrder[a.kind]! - sectionOrder[b.kind]!,
  )
  return {
    ...unit,
    sections,
    revision: Math.max(1, ...additions.map((section) => section.revision ?? 2)),
    importNotes: additions.flatMap((section) => section.importNotes),
    text: sections.map((section) => `${section.english}\n${section.chinese}`).join('\n\n'),
    unitId: `G2_SHENZHEN_ENGLISH_S2_UNIT_${String(unit.number).padStart(2, '0')}`,
    lessonId: `G2_SHENZHEN_ENGLISH_S2_LESSON_${String(unit.number).padStart(2, '0')}`,
    knowledgePointId: `G2_SHENZHEN_ENGLISH_S2_KP_${String(unit.number).padStart(2, '0')}`,
  }
})
const sectionTitles: Record<string, string> = {
  listen: '认读与跟读',
  chant: '歌谣跟读',
  story: '故事阅读',
  communicate: '口语交际',
  think: '想一想',
  extend: '拓展阅读',
}
for (const d of shenzhenEnglishLowerDefinitions) {
  const missingSections = Object.keys(sectionTitles).filter(
    (kind) => !d.sections.some((section) => section.kind === kind),
  )
  const goals = [
    `能认读本单元 ${d.words.length} 个核心词汇，联系中文释义理解文本。`,
    `能借助“${d.sentencePattern}”进行简单问答。`,
    '能根据故事原文找出信息；表达个人想法时说明理由。',
  ]
  shenzhenEnglishLowerCurriculum.units.push({
    id: d.unitId,
    textbookVersionId: G2_SHENZHEN_ENGLISH_S2_TEXTBOOK_ID,
    code: `G2-SHENZHEN-ENGLISH-S2-U${d.number}`,
    title: d.title,
    subtitle: '认读、歌谣、故事与口语交际按上传文本学习。',
    sortOrder: d.number,
    sceneKey: `english-lower-unit-${d.number}`,
    sourceId: G2_SHENZHEN_ENGLISH_S2_CONTENT_SOURCE_ID,
    status: 'ACTIVE',
    ...reviewed,
  })
  shenzhenEnglishLowerCurriculum.lessons.push({
    id: d.lessonId,
    unitId: d.unitId,
    code: `G2-SHENZHEN-ENGLISH-S2-L${d.number}`,
    title: d.title,
    sortOrder: 1,
    sourceId: G2_SHENZHEN_ENGLISH_S2_CONTENT_SOURCE_ID,
    status: 'ACTIVE',
    ...reviewed,
  })
  shenzhenEnglishLowerCurriculum.knowledgePoints.push({
    id: d.knowledgePointId,
    code: `G2-SHENZHEN-ENGLISH-S2-K${d.number}`,
    name: d.title,
    subjectId: 'SUBJECT_ENGLISH',
    gradeScope: { minGrade: 2, maxGrade: 2, explicitGradeIds: ['GRADE_2'] },
    description: `学习${d.title}中的核心词汇、双语故事与日常问答。`,
    learningObjective: goals,
    abilityTags: ['词汇认读', '文本理解', '英语表达'],
    difficultyLevel: 'FOUNDATION',
    sourceId: G2_SHENZHEN_ENGLISH_S2_CONTENT_SOURCE_ID,
    status: 'ACTIVE',
    ...reviewed,
  })
  shenzhenEnglishLowerCurriculum.lessonKnowledgePointRelations.push({
    id: `${d.knowledgePointId}_LKP`,
    lessonId: d.lessonId,
    knowledgePointId: d.knowledgePointId,
    relationType: 'CORE',
    order: 1,
    isPrimary: true,
    sourceId: G2_SHENZHEN_ENGLISH_S2_CONTENT_SOURCE_ID,
    status: 'ACTIVE',
    ...reviewed,
  })
  // Keep English and Chinese separately visible; speech projects English only.
  const texts = d.sections.flatMap((section) => {
    if (section.parts) {
      return [
        `${sectionTitles[section.kind]}（用户补充）\n来稿主题：${section.topic}`,
        ...section.parts.map((part) => {
          const heading =
            part.kind === 'chant'
              ? `歌谣跟读：${part.title}\nListen and chant`
              : part.kind === 'words'
                ? `单词（来稿拓展词汇）：${part.title}`
                : part.kind === 'sounds'
                  ? `语音：${part.title}\n来稿语音组合：${part.phonics}`
                  : part.kind === 'pattern'
                    ? `核心句型（用户补充）：${part.title}`
                    : part.kind === 'task'
                      ? `活动任务：${part.title}`
                      : `拓展对话：${part.title}`
          return `${heading}\n${part.english}${part.chinese ? '\n\n中文参考释义（来稿）\n' + part.chinese : ''}`
        }),
      ]
    }
    const heading =
      section.kind === 'chant'
        ? 'Listen and chant'
        : section.kind === 'story'
          ? `Story: ${section.title.replace(/^Story\s*[:：]?\s*/, '').replace(/^\((.*)\)$/, '$1')}`
          : ''
    return `${sectionTitles[section.kind]}\n${heading ? heading + '\n' : ''}${section.english}\n\n中文译文\n${section.chinese}`
  })
  texts.push(
    `核心单词（项目补充释义）\n${d.words.map((w) => `${w.english} ${w.chinese}`).join('\n')}`,
  )
  if (d.importNotes.length) texts.push(`补充稿核对说明\n${d.importNotes.join('\n')}`)
  texts.push(
    `核心句型\n${d.sentencePattern}\n\n口语练习\n${d.sentencePrompt}\n参考表达：${d.sentenceAnswer}\n\n个人表达没有唯一答案，口语活动不自动评分。`,
  )
  if (missingSections.length)
    texts[texts.length - 1] +=
      `\n\n本单元上传文本未提供${missingSections.map((kind) => sectionTitles[kind]).join('、')}栏目。`
  const content: CourseContent = {
    id: `${d.knowledgePointId}_CONTENT_V${d.revision}`,
    knowledgePointId: d.knowledgePointId,
    title: d.title,
    contentType: 'TEXTBOOK',
    contentFormat: 'TEXT',
    body: {
      lessonId: d.lessonId,
      summary: `围绕${d.title}进行认读、跟读和口语交流。`,
      learningGoals: goals,
      sourceScope:
        d.revision > 1 ? 'USER_PROVIDED_TEXT_WITH_SUPPLEMENT' : 'USER_PROVIDED_BILINGUAL_TEXT',
      sourceNote:
        d.revision > 1 ? `${supplied.sourceNote}\n${supplement.sourceNote}` : supplied.sourceNote,
      sourceIds:
        d.revision > 1
          ? [G2_SHENZHEN_ENGLISH_S2_CONTENT_SOURCE_ID, G2_SHENZHEN_ENGLISH_S2_SUPPLEMENT_SOURCE_ID]
          : [G2_SHENZHEN_ENGLISH_S2_CONTENT_SOURCE_ID],
      sectionKinds: d.sections.map((s) => s.kind),
      sectionSources: d.sections.map((section) => ({
        kind: section.kind,
        title: section.title,
        sourceId: section.parts
          ? G2_SHENZHEN_ENGLISH_S2_SUPPLEMENT_SOURCE_ID
          : G2_SHENZHEN_ENGLISH_S2_CONTENT_SOURCE_ID,
      })),
      missingSections,
      importNotes: d.importNotes,
      vocabularySourceId: G2_SHENZHEN_ENGLISH_S2_PRACTICE_SOURCE_ID,
      blocks: texts.map((text) => ({ type: 'TEXT', text })),
    },
    difficulty: 'FOUNDATION',
    sourceId:
      d.revision > 1
        ? G2_SHENZHEN_ENGLISH_S2_SUPPLEMENT_SOURCE_ID
        : G2_SHENZHEN_ENGLISH_S2_CONTENT_SOURCE_ID,
    status: 'PUBLISHED',
    currentVersion: d.revision,
    createdAt: importedAt,
    updatedAt: d.revision > 1 ? supplement.updatedAt : importedAt,
    ...reviewed,
  }
  shenzhenEnglishLowerCurriculum.courseContents.push(content)
  const questions: Question[] = d.questions.map((seed, index) => {
    const id = `${d.knowledgePointId}_Q${index + 1}`
    const offset = (d.number + index) % seed.options.length
    const labels = seed.options.map((label, original) => ({ label, original }))
    const options = [...labels.slice(offset), ...labels.slice(0, offset)]
    return {
      id,
      questionType: 'singleChoice',
      textbookVersionId: G2_SHENZHEN_ENGLISH_S2_TEXTBOOK_ID,
      knowledgePointId: d.knowledgePointId,
      gradeId: 'GRADE_2',
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
      sourceId: G2_SHENZHEN_ENGLISH_S2_PRACTICE_SOURCE_ID,
      status: 'PUBLISHED',
      estimatedSeconds: 60,
      tags: ['shenzhen-english-lower-original', ['vocabulary', 'dialogue', 'story'][index]!],
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
  shenzhenEnglishLowerQuestions.push(...questions)
  shenzhenEnglishLowerMappings.push(
    ...questions.map((question, index): QuestionKnowledgePoint => ({
      id: `mapping:${question.id}`,
      questionId: question.id,
      knowledgePointId: d.knowledgePointId,
      relationType: 'PRIMARY',
      weight: 1,
      order: index + 1,
      isPrimary: true,
      sourceId: G2_SHENZHEN_ENGLISH_S2_PRACTICE_SOURCE_ID,
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
          text: '先阅读双语文本，再完成词义、对话和故事理解题。强化训练包含单词拼写、词义配对和组句。',
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
    sourceId: G2_SHENZHEN_ENGLISH_S2_PRACTICE_SOURCE_ID,
    status: 'PUBLISHED',
    contentStatus: 'PUBLISHED',
    currentVersion: 1,
    createdAt: importedAt,
    updatedAt: importedAt,
    ...reviewed,
  }
  shenzhenEnglishLowerBundles.push({
    textbookId: G2_SHENZHEN_ENGLISH_S2_TEXTBOOK_ID,
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
        title: '口语交流',
        instruction: d.sentencePrompt,
        content: {
          blocks: [{ type: 'hint', value: `用本课句型“${d.sentencePattern}”和同伴练习。` }],
        },
        referenceAnswer: `参考表达：${d.sentenceAnswer}。个人表达不自动判分。`,
        sourceId: G2_SHENZHEN_ENGLISH_S2_PRACTICE_SOURCE_ID,
        ...reviewed,
      },
    ],
  })
}
