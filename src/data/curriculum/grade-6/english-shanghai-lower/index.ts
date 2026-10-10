import readingSigns from './reading-signs-supplement.json'
import {
  readingSignsIllustrationSource,
  readingSignsIllustrationAsset,
} from './reading-signs-illustration'
import supplied from './contents.json'
import intonation from './intonation-supplement.json'
import { G1_SHANGHAI_ENGLISH_PUBLISHER_ID } from '../../grade-1/english-shanghai-upper'
import {
  G6_SHANGHAI_ENGLISH_LOWER_IMPORTED_AT as importedAt,
  G6_SHANGHAI_ENGLISH_LOWER_IMPORT_APPROVAL as approval,
} from '../../production/gradeSixEnglishLowerApproval'
import type { CurriculumData } from '../../types'
import type {
  ContentExpansionBundle,
  CourseContent,
  LearningContent,
  Question,
  QuestionKnowledgePoint,
} from '@/types'

export const G6_SHANGHAI_ENGLISH_S2_TEXTBOOK_ID = 'G6_SHANGHAI_ENGLISH_S2_USER_TEXT'
export const G6_SHANGHAI_ENGLISH_S2_CONTENT_SOURCE_ID = 'G6_SHANGHAI_ENGLISH_S2_USER_TEXT'
export const G6_SHANGHAI_ENGLISH_S2_PRACTICE_SOURCE_ID =
  'G6_SHANGHAI_ENGLISH_S2_ORIGINAL_PRACTICE_V1'
export const G6_SHANGHAI_ENGLISH_S2_INTONATION_SOURCE_ID =
  'G6_SHANGHAI_ENGLISH_S2_INTONATION_SUPPLEMENT_2026_10_10'
export const G6_SHANGHAI_ENGLISH_S2_SIGNS_SOURCE_ID =
  'G6_SHANGHAI_ENGLISH_S2_READING_SIGNS_USER_TEXT_V3'
export const gradeSixEnglishLowerSource = supplied
export const gradeSixEnglishLowerIntonationSupplement = intonation
const currentSourceNote =
  supplied.sourceNote.replace('未注明版次年份', '版次年份按用户最新确认登记为2013年') +
  ` ${intonation.sourceNote}`
const reviewed = {
  isSample: false,
  needsVerification: false,
  verificationStatus: 'REVIEWED' as const,
  releaseApprovalId: approval,
}
export const gradeSixEnglishLowerCurriculum: Pick<
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
      id: G6_SHANGHAI_ENGLISH_S2_TEXTBOOK_ID,
      subjectId: 'SUBJECT_ENGLISH',
      gradeId: 'GRADE_6',
      semesterId: 'SEMESTER_LOWER',
      publisherId: G1_SHANGHAI_ENGLISH_PUBLISHER_ID,
      versionName: intonation.title,
      editionYear: intonation.editionYear,
      sourceId: G6_SHANGHAI_ENGLISH_S2_CONTENT_SOURCE_ID,
      status: 'ACTIVE',
      createdAt: importedAt,
      updatedAt: intonation.updatedAt,
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
    readingSignsIllustrationSource,
    {
      id: G6_SHANGHAI_ENGLISH_S2_SIGNS_SOURCE_ID,
      sourceType: 'TEXTBOOK',
      title: 'Unit 8 Reading signs用户补充对话与标识含义',
      publisher: supplied.publisher,
      edition: '2013版（用户明确确认）',
      sourceRef: 'user-provided://g6-shanghai-english-lower/reading-signs/2026-10-10',
      sourceVersion: `SHA256:${readingSigns.sourceSha256}`,
      copyrightStatus: 'PENDING',
      notes: readingSigns.sourceNote,
      verifiedAt: readingSigns.updatedAt,
      ...reviewed,
    },
    {
      id: G6_SHANGHAI_ENGLISH_S2_CONTENT_SOURCE_ID,
      sourceType: 'TEXTBOOK',
      title: `${supplied.title}用户提供双语文本`,
      publisher: supplied.publisher,
      edition: supplied.title,
      sourceRef: 'user-provided://g6-shanghai-english-lower/2026-10-09',
      sourceVersion: `SHA256:${supplied.sourceSha256}`,
      copyrightStatus: 'PENDING',
      notes: supplied.sourceNote,
      verifiedAt: importedAt,
      ...reviewed,
    },
    {
      id: G6_SHANGHAI_ENGLISH_S2_INTONATION_SOURCE_ID,
      sourceType: 'TEXTBOOK',
      title: '沪教牛津2013版六下Unit 12句子语调补充（用户提供）',
      publisher: supplied.publisher,
      edition: intonation.title,
      sourceRef: 'user-provided://g6-shanghai-english-lower/intonation/2026-10-10',
      sourceVersion: `SHA256:${intonation.sourceSha256}`,
      copyrightStatus: 'PENDING',
      notes: intonation.sourceNote,
      verifiedAt: intonation.updatedAt,
      ...reviewed,
    },
    {
      id: G6_SHANGHAI_ENGLISH_S2_PRACTICE_SOURCE_ID,
      sourceType: 'AI_GENERATED',
      title: '沪教牛津六年级下册英语原创配套练习与口语提示',
      sourceRef: 'local-original://g6-shanghai-english-lower/practice-v1',
      sourceVersion: 'ORIGINAL_PRACTICE_V1',
      copyrightStatus: 'PENDING',
      notes: 'Codex 根据用户文本编写并校验；口头表达和Project活动无唯一答案，不自动判分。',
      verifiedAt: importedAt,
      ...reviewed,
    },
  ],
}

export const gradeSixEnglishLowerQuestions: Question[] = []
export const gradeSixEnglishLowerMappings: QuestionKnowledgePoint[] = []
export const gradeSixEnglishLowerBundles: ContentExpansionBundle[] = []
export const gradeSixEnglishLowerDefinitions = supplied.units.map((originalUnit) => {
  const unit = originalUnit.number === 8 ? readingSigns.lesson : originalUnit
  return {
    ...unit,
    revision: unit.number === 8 ? 3 : unit.number === intonation.unitNumber ? 2 : 1,
    intonationSupplement: unit.number === intonation.unitNumber ? intonation : undefined,
    missingSections:
      unit.number === intonation.unitNumber
        ? unit.missingSections.filter((section) => section !== 'Sounds 示例文本')
        : unit.missingSections,
    speechExamples:
      unit.number === intonation.unitNumber
        ? [...intonation.examples, ...intonation.practice]
            .map((sample) => sample.sentence)
            .join('\n')
        : unit.speechExamples,
    text: unit.sections.map((section) => `${section.english}\n${section.chinese}`).join('\n\n'),
    unitId: `G6_SHANGHAI_ENGLISH_S2_MODULE_${String(unit.moduleNumber).padStart(2, '0')}`,
    lessonId: `G6_SHANGHAI_ENGLISH_S2_LESSON_${String(unit.number).padStart(2, '0')}`,
    knowledgePointId: `G6_SHANGHAI_ENGLISH_S2_KP_${String(unit.number).padStart(2, '0')}`,
  }
})
export const gradeSixEnglishLowerProjectIds = gradeSixEnglishLowerDefinitions
  .filter((d) => d.kind !== 'unit')
  .map((d) => d.knowledgePointId)
const sectionTitles: Record<string, string> = {
  story: '主课文 Listen and say',
  dialogue: '主课文 Listen and say',
  signs: '标识学习 Look and learn',
  review: '册末材料',
  project: '项目活动',
}
for (const module of supplied.modules) {
  gradeSixEnglishLowerCurriculum.units.push({
    id: `G6_SHANGHAI_ENGLISH_S2_MODULE_${String(module.number).padStart(2, '0')}`,
    textbookVersionId: G6_SHANGHAI_ENGLISH_S2_TEXTBOOK_ID,
    code: `G6-SHANGHAI-ENGLISH-S2-M${module.number}`,
    title: module.title,
    subtitle:
      module.number === 5 ? '册末附录按来稿完整展示。' : '按来稿 Module 分组学习各 Unit 和活动。',
    sortOrder: module.number,
    sceneKey: `english-lower-module-${module.number}`,
    sourceId: G6_SHANGHAI_ENGLISH_S2_CONTENT_SOURCE_ID,
    status: 'ACTIVE',
    ...reviewed,
  })
}
for (const d of gradeSixEnglishLowerDefinitions) {
  const missingSections: string[] = [...d.missingSections]
  const goals =
    d.kind === 'appendix'
      ? ['阅读本册词表、用语、动词及语法材料', '整理复习，由自己、老师或家长核对']
      : d.kind === 'project'
        ? ['运用已学英语词句完成作品', '向同伴介绍作品，由老师或家长核对表达']
        : [
            `认读本单元${d.words.length}个核心词汇并理解中文释义`,
            '理解课文信息并用本课句型交流',
            '听读英文，尝试自然表达',
          ]
  gradeSixEnglishLowerCurriculum.lessons.push({
    id: d.lessonId,
    unitId: d.unitId,
    code: `G6-SHANGHAI-ENGLISH-S2-L${d.number}`,
    title: d.title,
    sortOrder: supplied.units.findIndex((u) => u.number === d.number) + 1,
    sourceId: G6_SHANGHAI_ENGLISH_S2_CONTENT_SOURCE_ID,
    status: 'ACTIVE',
    ...reviewed,
  })
  gradeSixEnglishLowerCurriculum.knowledgePoints.push({
    id: d.knowledgePointId,
    code: `G6-SHANGHAI-ENGLISH-S2-K${d.number}`,
    name: d.title,
    subjectId: 'SUBJECT_ENGLISH',
    gradeScope: { minGrade: 6, maxGrade: 6, explicitGradeIds: ['GRADE_6'] },
    description:
      d.kind !== 'unit' ? d.sentencePrompt : `学习${d.title}中的核心词汇、双语课文与日常问答。`,
    learningObjective: goals,
    abilityTags:
      d.kind !== 'unit' ? ['开放实践', '英语表达'] : ['词汇认读', '文本理解', '英语表达'],
    difficultyLevel: 'FOUNDATION',
    sourceId: G6_SHANGHAI_ENGLISH_S2_CONTENT_SOURCE_ID,
    status: 'ACTIVE',
    ...reviewed,
  })
  gradeSixEnglishLowerCurriculum.lessonKnowledgePointRelations.push({
    id: `${d.knowledgePointId}_LKP`,
    lessonId: d.lessonId,
    knowledgePointId: d.knowledgePointId,
    relationType: 'CORE',
    order: 1,
    isPrimary: true,
    sourceId: G6_SHANGHAI_ENGLISH_S2_CONTENT_SOURCE_ID,
    status: 'ACTIVE',
    ...reviewed,
  })
  // Keep English and Chinese separately visible; speech projects English only.
  const texts = d.sections.map((section) => {
    let english = section.english
      .split('\n')
      .map((line) =>
        d.excludedReadingLines.some((excluded) => excluded === line)
          ? '来稿待核对句：' + line
          : line,
      )
      .join('\n')
    if (d.number === 21)
      english = supplied.verbRows
        .map(
          (row) =>
            `${row.kind === 'regular' ? '规则变化' : '不规则变化'}：${row.base} — ${row.past}`,
        )
        .join('\n')
    const heading =
      section.kind === 'story' || section.kind === 'dialogue'
        ? `${section.scope === 'Listen and say' ? '主课文 Listen and say' : '阅读短文 Look and read'}\n${section.kind === 'story' ? 'Story: ' + section.title + '\n' : ''}`
        : `${sectionTitles[section.kind]}\n${section.title.startsWith('Word list') ? section.title + '\n' : ''}`
    return `${heading}${section.byline ? '作者：' + section.byline + '\n' : ''}${english}${section.chinese ? '\n\n中文译文\n' + section.chinese : ''}`
  })
  if (d.corrections.length)
    texts.push(`项目校正参考表达（非教材原稿）\n${d.corrections.join('\n')}`)
  if (d.readingWords.length)
    texts.push(
      `本单元单词（项目按本课中译补充；未提供音标）\n${d.readingWords.map((w) => w.english + ' ' + w.chinese).join('\n')}`,
    )
  if (d.words.length)
    texts.push(
      `核心单词（用户提供）\n${[...d.words, ...d.aliases].map((w) => `${w.english} ${'phonetic' in w ? (w.phonetic ? w.phonetic + ' ' : '') : ''}${w.chinese}`).join('\n')}`,
    )
  if (d.sounds)
    texts.push(
      `自然拼读 Sounds\n本单元字母组合：${d.sounds}。\n发音示例：${d.soundExamples}\n来稿未提供示范音频。`,
    )
  if (d.intonationSupplement) {
    // Keep direction markers visible on Chinese-led lines so speech reads only the examples.
    texts.push(
      `语音练习 Sounds\n本次补充主题：${intonation.theme}。\n初次来稿栏目：${d.speechFeature}；本次补充句子语调示例。\n\n语音知识点\n${intonation.rules.join('\n')}`,
      `教材示例句子（用户提供的跟读范例）\n${intonation.examples.map((sample, index) => `示例${index + 1}：${sample.description}（${sample.direction}）\n${sample.sentence}`).join('\n\n')}`,
      `朗读练习\n${intonation.practice.map((sample, index) => `练习${index + 1}：${sample.description}（${sample.direction}）\n${sample.sentence}`).join('\n\n')}`,
      `补充小提示\n${intonation.tip}\n升降调以文字标记为准；跟读使用设备合成语音，来稿未提供示范录音。`,
    )
  } else if (d.speechFeature)
    texts.push(
      `语音练习\n本单元栏目：${d.speechFeature}。\n来稿示例：${d.speechExamples || '未提供示例文本'}\n来稿未提供示范音频。`,
    )
  if (d.sentencePattern)
    texts.push(`项目整理句型（取自本课已提供正文）
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
  texts.push(
    `来源说明\n${d.page ? `用户标注第${d.page}页` : '用户附加综合练习'}。${d.number === 8 ? readingSigns.sourceNote : currentSourceNote}`,
  )
  const content: CourseContent = {
    id: `${d.knowledgePointId}_CONTENT_V${d.revision}`,
    knowledgePointId: d.knowledgePointId,
    title: d.title,
    contentType: 'TEXTBOOK',
    contentFormat: d.number === 8 ? 'RICH_TEXT' : 'TEXT',
    body: {
      lessonId: d.lessonId,
      summary: d.kind !== 'unit' ? d.sentencePrompt : `围绕${d.title}进行认读、跟读和口语交流。`,
      learningGoals: goals,
      sourceScope: 'USER_PROVIDED_BILINGUAL_TEXT',
      sourceNote: d.number === 8 ? readingSigns.sourceNote : currentSourceNote,
      sourceIds:
        d.number === 8
          ? [
              G6_SHANGHAI_ENGLISH_S2_CONTENT_SOURCE_ID,
              G6_SHANGHAI_ENGLISH_S2_SIGNS_SOURCE_ID,
              readingSignsIllustrationSource.id,
            ]
          : d.intonationSupplement
            ? [
                G6_SHANGHAI_ENGLISH_S2_CONTENT_SOURCE_ID,
                G6_SHANGHAI_ENGLISH_S2_INTONATION_SOURCE_ID,
              ]
            : [G6_SHANGHAI_ENGLISH_S2_CONTENT_SOURCE_ID],
      sectionKinds: d.sections.map((s) => s.kind),
      missingSections,
      vocabularySourceId: G6_SHANGHAI_ENGLISH_S2_CONTENT_SOURCE_ID,
      suppliedPage: d.page || null,
      moduleNumber: d.moduleNumber,
      sounds: d.sounds,
      soundExamples: d.soundExamples,
      speechExamples: d.speechExamples,
      excludedReadingLines: d.excludedReadingLines,
      notes: d.notes,
      corrections: d.corrections,
      verbRows: d.number === 21 ? supplied.verbRows : [],
      speechFeature: d.speechFeature,
      intonationSupplement: d.intonationSupplement ?? null,
      activityOnly: d.kind !== 'unit',
      blocks: texts.flatMap((text) => [
        ...(d.number === 8 && text.startsWith('标识学习 Look and learn')
          ? [
              {
                type: 'IMAGE',
                mediaAssetId: readingSignsIllustrationAsset.id,
                altText: readingSignsIllustrationAsset.altText ?? undefined,
                text: 'Reading signs插图 · AI生成配套素材',
              },
            ]
          : []),
        { type: 'TEXT', text },
      ]),
    },
    difficulty: 'FOUNDATION',
    sourceId:
      d.number === 8
        ? G6_SHANGHAI_ENGLISH_S2_SIGNS_SOURCE_ID
        : d.intonationSupplement
          ? G6_SHANGHAI_ENGLISH_S2_INTONATION_SOURCE_ID
          : G6_SHANGHAI_ENGLISH_S2_CONTENT_SOURCE_ID,
    status: 'PUBLISHED',
    currentVersion: d.revision,
    createdAt: importedAt,
    updatedAt:
      d.number === 8
        ? readingSigns.updatedAt
        : d.intonationSupplement
          ? intonation.updatedAt
          : importedAt,
    ...reviewed,
  }
  gradeSixEnglishLowerCurriculum.courseContents.push(content)
  const questions: Question[] = d.questions.map((seed, index) => {
    const id = `${d.knowledgePointId}_Q${index + 1}`
    const offset = (d.number + index) % seed.options.length
    const labels = seed.options.map((label, original) => ({ label, original }))
    const options = [...labels.slice(offset), ...labels.slice(0, offset)]
    return {
      id,
      questionType: 'singleChoice',
      textbookVersionId: G6_SHANGHAI_ENGLISH_S2_TEXTBOOK_ID,
      knowledgePointId: d.knowledgePointId,
      gradeId: 'GRADE_6',
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
      sourceId: G6_SHANGHAI_ENGLISH_S2_PRACTICE_SOURCE_ID,
      status: 'PUBLISHED',
      estimatedSeconds: 60,
      tags: ['g6-shanghai-english-lower-original', ['vocabulary', 'dialogue', 'story'][index]!],
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
  gradeSixEnglishLowerQuestions.push(...questions)
  gradeSixEnglishLowerMappings.push(
    ...questions.map((question, index): QuestionKnowledgePoint => ({
      id: `mapping:${question.id}`,
      questionId: question.id,
      knowledgePointId: d.knowledgePointId,
      relationType: 'PRIMARY',
      weight: 1,
      order: index + 1,
      isPrimary: true,
      sourceId: G6_SHANGHAI_ENGLISH_S2_PRACTICE_SOURCE_ID,
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
    sourceId: G6_SHANGHAI_ENGLISH_S2_PRACTICE_SOURCE_ID,
    status: 'PUBLISHED',
    contentStatus: 'PUBLISHED',
    currentVersion: 1,
    createdAt: importedAt,
    updatedAt: importedAt,
    ...reviewed,
  }
  gradeSixEnglishLowerBundles.push({
    textbookId: G6_SHANGHAI_ENGLISH_S2_TEXTBOOK_ID,
    unitId: d.unitId,
    lessonId: d.lessonId,
    knowledgePointId: d.knowledgePointId,
    learningContent: learning,
    activities: [],
    exerciseTemplates: [],
    practiceSets: [],
    challenges: [],
    extensionActivities:
      d.kind === 'appendix'
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
              referenceAnswer: `参考表达：${d.sentenceAnswer}。个人表达不自动判分。`,
              sourceId: G6_SHANGHAI_ENGLISH_S2_PRACTICE_SOURCE_ID,
              ...reviewed,
            },
          ],
  })
}
