import supplied from './contents.json'
import communicateSupplement from './communicate-supplement.json'
import communicateCorrection from './communicate-correction.json'
import { G1_SHANGHAI_ENGLISH_PUBLISHER_ID } from '../../grade-1/english-shanghai-upper'
import {
  G6_SHANGHAI_ENGLISH_UPPER_IMPORTED_AT as importedAt,
  G6_SHANGHAI_ENGLISH_UPPER_IMPORT_APPROVAL as approval,
} from '../../production/gradeSixEnglishUpperApproval'
import type { CurriculumData } from '../../types'
import type {
  ContentExpansionBundle,
  CourseContent,
  LearningContent,
  Question,
  QuestionKnowledgePoint,
} from '@/types'

export const G6_SHANGHAI_ENGLISH_S1_TEXTBOOK_ID = 'G6_SHANGHAI_ENGLISH_S1_2022'
export const G6_SHANGHAI_ENGLISH_S1_CONTENT_SOURCE_ID = 'G6_SHANGHAI_ENGLISH_S1_USER_TEXT'
export const G6_SHANGHAI_ENGLISH_S1_PRACTICE_SOURCE_ID =
  'G6_SHANGHAI_ENGLISH_S1_ORIGINAL_PRACTICE_V1'
export const G6_SHANGHAI_ENGLISH_S1_COMMUNICATE_SOURCE_ID =
  'G6_SHANGHAI_ENGLISH_S1_COMMUNICATE_SUPPLEMENT_2026_10_10'
export const G6_SHANGHAI_ENGLISH_S1_COMMUNICATE_CORRECTION_SOURCE_ID =
  'G6_SHANGHAI_ENGLISH_S1_COMMUNICATE_CORRECTION_2026_10_10'
export const gradeSixEnglishUpperSource = supplied
export const gradeSixEnglishUpperCommunicateSupplement = communicateSupplement
export const gradeSixEnglishUpperCommunicateCorrection = communicateCorrection
const currentCommunicateNodes = communicateSupplement.nodes.map((node) => {
  const correction = communicateCorrection.nodes.find((item) => item.number === node.number)
  return {
    ...node,
    ...correction,
    listenTask: correction?.listenTask ?? '',
    answers: correction?.answers ?? [],
    answerNotes: correction?.answerNotes ?? '',
    revision: correction ? communicateCorrection.revision : 2,
    sourceId: correction
      ? G6_SHANGHAI_ENGLISH_S1_COMMUNICATE_CORRECTION_SOURCE_ID
      : G6_SHANGHAI_ENGLISH_S1_COMMUNICATE_SOURCE_ID,
    updatedAt: correction ? communicateCorrection.updatedAt : communicateSupplement.updatedAt,
  }
})
const updatedSourceNote = `用户提供的2022课标修订版六上双语文本；保留主阅读、拓展阅读和册末材料。${communicateCorrection.sourceNote}Unit页码沿用初次来稿，未提供。基础练习为项目原创；开放口语与写作由老师或家长核对。`
const reviewed = {
  isSample: false,
  needsVerification: false,
  verificationStatus: 'REVIEWED' as const,
  releaseApprovalId: approval,
}
export const gradeSixEnglishUpperCurriculum: Pick<
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
      id: G6_SHANGHAI_ENGLISH_S1_TEXTBOOK_ID,
      subjectId: 'SUBJECT_ENGLISH',
      gradeId: 'GRADE_6',
      semesterId: 'SEMESTER_UPPER',
      publisherId: G1_SHANGHAI_ENGLISH_PUBLISHER_ID,
      versionName: supplied.title,
      editionYear: 2022,
      sourceId: G6_SHANGHAI_ENGLISH_S1_CONTENT_SOURCE_ID,
      status: 'ACTIVE',
      createdAt: importedAt,
      updatedAt: communicateCorrection.updatedAt,
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
      id: G6_SHANGHAI_ENGLISH_S1_CONTENT_SOURCE_ID,
      sourceType: 'TEXTBOOK',
      title: `${supplied.title}用户提供双语文本`,
      publisher: supplied.publisher,
      edition: supplied.title,
      sourceRef: 'user-provided://g6-shanghai-english-upper/2026-10-09',
      sourceVersion: `SHA256:${supplied.sourceSha256}`,
      copyrightStatus: 'PENDING',
      notes: supplied.sourceNote,
      verifiedAt: importedAt,
      ...reviewed,
    },
    {
      id: G6_SHANGHAI_ENGLISH_S1_COMMUNICATE_SOURCE_ID,
      sourceType: 'TEXTBOOK',
      title: '沪教牛津六年级上册英语（标注2022课标修订）Communicate用户补充稿',
      publisher: supplied.publisher,
      edition: supplied.title,
      sourceRef: 'user-provided://g6-shanghai-english-upper/communicate/2026-10-10',
      sourceVersion: `SHA256:${communicateSupplement.sourceSha256}`,
      copyrightStatus: 'PENDING',
      notes: communicateSupplement.sourceNote,
      verifiedAt: communicateSupplement.updatedAt,
      ...reviewed,
    },
    {
      id: G6_SHANGHAI_ENGLISH_S1_COMMUNICATE_CORRECTION_SOURCE_ID,
      sourceType: 'TEXTBOOK',
      title: '沪教牛津六上2022课标修订版Unit 4—6 Communicate修正稿（用户提供）',
      publisher: supplied.publisher,
      edition: supplied.title,
      sourceRef: 'user-provided://g6-shanghai-english-upper/communicate-correction/2026-10-10',
      sourceVersion: `SHA256:${communicateCorrection.sourceSha256}`,
      copyrightStatus: 'PENDING',
      notes: communicateCorrection.sourceNote,
      verifiedAt: communicateCorrection.updatedAt,
      ...reviewed,
    },
    {
      id: G6_SHANGHAI_ENGLISH_S1_PRACTICE_SOURCE_ID,
      sourceType: 'AI_GENERATED',
      title: '沪教牛津六年级上册英语原创配套练习与口语提示',
      sourceRef: 'local-original://g6-shanghai-english-upper/practice-v1',
      sourceVersion: 'ORIGINAL_PRACTICE_V1',
      copyrightStatus: 'PENDING',
      notes: 'Codex 根据用户文本编写并校验；口头表达和Project活动无唯一答案，不自动判分。',
      verifiedAt: importedAt,
      ...reviewed,
    },
  ],
}

export const gradeSixEnglishUpperQuestions: Question[] = []
export const gradeSixEnglishUpperMappings: QuestionKnowledgePoint[] = []
export const gradeSixEnglishUpperBundles: ContentExpansionBundle[] = []
export const gradeSixEnglishUpperDefinitions = supplied.units.map((unit) => {
  const material = currentCommunicateNodes.find((node) => node.number === unit.number)
  return {
    ...unit,
    communicateSupplement: material,
    revision: material?.revision ?? 1,
    missingSections: material?.topicMismatch
      ? ['原目录主题的Communicate听说写正文（补充稿主题不同）']
      : [],
    text: unit.sections.map((section) => `${section.english}\n${section.chinese}`).join('\n\n'),
    unitId: `G6_SHANGHAI_ENGLISH_S1_UNIT_${String(unit.number).padStart(2, '0')}`,
    lessonId: `G6_SHANGHAI_ENGLISH_S1_LESSON_${String(unit.number).padStart(2, '0')}`,
    knowledgePointId: `G6_SHANGHAI_ENGLISH_S1_KP_${String(unit.number).padStart(2, '0')}`,
  }
})
export const gradeSixEnglishUpperProjectIds = gradeSixEnglishUpperDefinitions
  .filter((d) => d.kind !== 'unit')
  .map((d) => d.knowledgePointId)
const sectionTitles: Record<string, string> = {
  story: '课文阅读',
  project: '项目活动',
  review: '册末材料',
}
for (const d of gradeSixEnglishUpperDefinitions) {
  const missingSections = d.missingSections
  const material = d.communicateSupplement
  const sourceNote = material ? updatedSourceNote : supplied.sourceNote
  const goals =
    d.kind === 'appendix'
      ? ['阅读完整册末材料', '按单词、句型和自查目标整理学习收获']
      : d.kind === 'project'
        ? ['运用已学英语词句完成作品', '向同伴介绍作品，由老师或家长核对表达']
        : [
            `认读本单元${d.words.length}个核心词汇并理解中文释义`,
            '理解课文信息并用本课句型交流',
            '听读英文，尝试自然表达',
          ]
  gradeSixEnglishUpperCurriculum.units.push({
    id: d.unitId,
    textbookVersionId: G6_SHANGHAI_ENGLISH_S1_TEXTBOOK_ID,
    code: `G6-SHANGHAI-ENGLISH-S1-U${d.number}`,
    title: d.title,
    subtitle: `${d.page ? `用户标注第${d.page}页` : '来稿未标注单元页码'}；按提供的双语文本学习。`,
    sortOrder: d.number,
    sceneKey: `english-upper-unit-${d.number}`,
    sourceId: G6_SHANGHAI_ENGLISH_S1_CONTENT_SOURCE_ID,
    status: 'ACTIVE',
    ...reviewed,
  })
  gradeSixEnglishUpperCurriculum.lessons.push({
    id: d.lessonId,
    unitId: d.unitId,
    code: `G6-SHANGHAI-ENGLISH-S1-L${d.number}`,
    title: d.title,
    sortOrder: 1,
    sourceId: G6_SHANGHAI_ENGLISH_S1_CONTENT_SOURCE_ID,
    status: 'ACTIVE',
    ...reviewed,
  })
  gradeSixEnglishUpperCurriculum.knowledgePoints.push({
    id: d.knowledgePointId,
    code: `G6-SHANGHAI-ENGLISH-S1-K${d.number}`,
    name: d.title,
    subjectId: 'SUBJECT_ENGLISH',
    gradeScope: { minGrade: 6, maxGrade: 6, explicitGradeIds: ['GRADE_6'] },
    description:
      d.kind !== 'unit' ? d.sentencePrompt : `学习${d.title}中的核心词汇、双语课文与日常问答。`,
    learningObjective: goals,
    abilityTags:
      d.kind !== 'unit' ? ['开放实践', '英语表达'] : ['词汇认读', '文本理解', '英语表达'],
    difficultyLevel: 'FOUNDATION',
    sourceId: G6_SHANGHAI_ENGLISH_S1_CONTENT_SOURCE_ID,
    status: 'ACTIVE',
    ...reviewed,
  })
  gradeSixEnglishUpperCurriculum.lessonKnowledgePointRelations.push({
    id: `${d.knowledgePointId}_LKP`,
    lessonId: d.lessonId,
    knowledgePointId: d.knowledgePointId,
    relationType: 'CORE',
    order: 1,
    isPrimary: true,
    sourceId: G6_SHANGHAI_ENGLISH_S1_CONTENT_SOURCE_ID,
    status: 'ACTIVE',
    ...reviewed,
  })
  // Keep English and Chinese separately visible; speech projects English only.
  const texts = d.sections.map((section) => {
    const english = section.excludeFromSpeech
      ? section.english
          .split('\n')
          .map((line) => '来稿急救原句（待核对）：' + line)
          .join('\n')
      : section.english
    return `${sectionTitles[section.kind]} ${section.scope}\n${section.kind === 'story' ? 'Story: ' + section.title + '\n' : ''}${english}\n\n中文译文\n${section.chinese}`
  })
  if (d.reviewNotes.length)
    texts.push(
      `文本核对说明\n${d.reviewNotes.join('\n')}\n${d.number === 3 ? supplied.reviewReferences.map((r) => '核对来源：' + r.title + '：' + r.url).join('\n') : ''}`,
    )
  if (d.readingWords.length)
    texts.push(
      `本单元单词（册末词表补充）\n${d.readingWords.map((w) => `${w.english} ${w.phonetic} ${w.chinese}`).join('\n')}`,
    )
  if (d.communicate.length)
    texts.push(
      `听说写 Communicate\n初次来稿活动标题（供目录对照）\n${d.communicate.map((c) => `${({ Listening: '听力', Speaking: '口语', Writing: '写作' } as const)[c.kind as 'Listening' | 'Speaking' | 'Writing']}：${c.title}`).join('\n')}`,
    )
  if (material) {
    texts.push(
      `补充材料来源\n补充稿题名：Unit ${material.number} ${material.title}。\n${material.notes.join('\n')}\n材料按用户来稿保存；口语和写作没有唯一答案，不自动判分。`,
      `听力 Listen（用户提供）\n${material.listenTask ? `听力任务：${material.listenTask}\n` : ''}${material.listen}`,
    )
    if (material.answers.length)
      texts.push(
        `听力答案与匹配（用户提供）\n${material.answerNotes}\n${material.answers.map((answer, index) => `答案${index + 1}：${answer}`).join('\n')}`,
      )
    if (material.questions.length)
      texts.push(
        `听力问题（用户提供）\n${material.questions.map((question, index) => `${index + 1}. ${question}`).join('\n')}`,
      )
    texts.push(
      `口语 Speak（用户提供）\n${material.speak}`,
      `核心句型支架（用户提供）\n${material.frames}`,
      `课后练习：Communicate Write（用户提供写作任务）\n${material.write}\n写作表达由老师或家长核对，不自动判分。`,
    )
  }
  if (d.words.length)
    texts.push(
      `核心单词（用户提供；音标取自本册Word list）\n${[...d.words, ...d.aliases].map((w) => `${w.english} ${'phonetic' in w ? (w.phonetic ? w.phonetic + ' ' : '') : ''}${w.chinese}`).join('\n')}`,
    )
  if (d.sounds)
    texts.push(
      `自然拼读 Sounds\n本单元字母组合：${d.sounds}。\n${d.soundExamples
        .split('\n')
        .map((line) => '发音示例：' + line)
        .join('\n')}\n来稿未提供示范音频。`,
    )
  if (d.intonation)
    texts.push(`语调练习 Intonation\n来稿栏目：${d.intonation}。未提供具体语调标记或示范音频。`)
  if (d.speechFeature)
    texts.push(`语音练习\n本单元栏目：${d.speechFeature}。\n来稿未提供具体语音标记或示范音频。`)
  if (d.sentencePattern)
    texts.push(
      `核心句型\n${d.sentencePattern}\n${d.grammarNote}\n\n项目补充口语练习\n${d.sentencePrompt}\n参考表达：${d.sentenceAnswer}\n\n个人表达没有唯一答案，不自动评分。`,
    )
  texts.push(`来源说明\n${d.page ? `用户标注第${d.page}页` : '来稿未标注单元页码'}。${sourceNote}`)
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
      sourceIds: material
        ? [G6_SHANGHAI_ENGLISH_S1_CONTENT_SOURCE_ID, material.sourceId]
        : [G6_SHANGHAI_ENGLISH_S1_CONTENT_SOURCE_ID],
      sectionKinds: [
        ...d.sections.map((s) => s.kind),
        ...(material ? ['communicate-listen', 'communicate-speak', 'communicate-write'] : []),
      ],
      missingSections,
      missingMedia: material ? ['Communicate教材原版录音'] : [],
      vocabularySourceId: G6_SHANGHAI_ENGLISH_S1_CONTENT_SOURCE_ID,
      suppliedPage: d.page || null,
      sounds: d.sounds,
      soundExamples: d.soundExamples,
      communicate: d.communicate,
      communicateSupplement: material ?? null,
      communicateSupplementSourceId: material?.sourceId ?? null,
      supersedesCommunicateSourceId:
        material?.revision === 3 ? G6_SHANGHAI_ENGLISH_S1_COMMUNICATE_SOURCE_ID : null,
      reviewNotes: d.reviewNotes,
      wordListEntries: d.number === 10 ? supplied.wordLists : [],
      intonation: d.intonation,
      speechFeature: d.speechFeature,
      activityOnly: d.kind !== 'unit',
      blocks: texts.map((text) => ({ type: 'TEXT', text })),
    },
    difficulty: 'FOUNDATION',
    sourceId: material?.sourceId ?? G6_SHANGHAI_ENGLISH_S1_CONTENT_SOURCE_ID,
    status: 'PUBLISHED',
    currentVersion: d.revision,
    createdAt: importedAt,
    updatedAt: material?.updatedAt ?? importedAt,
    ...reviewed,
  }
  gradeSixEnglishUpperCurriculum.courseContents.push(content)
  const questions: Question[] = d.questions.map((seed, index) => {
    const id = `${d.knowledgePointId}_Q${index + 1}`
    const offset = (d.number + index) % seed.options.length
    const labels = seed.options.map((label, original) => ({ label, original }))
    const options = [...labels.slice(offset), ...labels.slice(0, offset)]
    return {
      id,
      questionType: 'singleChoice',
      textbookVersionId: G6_SHANGHAI_ENGLISH_S1_TEXTBOOK_ID,
      knowledgePointId: d.knowledgePointId,
      gradeId: 'GRADE_6',
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
      sourceId: G6_SHANGHAI_ENGLISH_S1_PRACTICE_SOURCE_ID,
      status: 'PUBLISHED',
      estimatedSeconds: 60,
      tags: ['g6-shanghai-english-upper-original', ['vocabulary', 'dialogue', 'story'][index]!],
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
  gradeSixEnglishUpperQuestions.push(...questions)
  gradeSixEnglishUpperMappings.push(
    ...questions.map((question, index): QuestionKnowledgePoint => ({
      id: `mapping:${question.id}`,
      questionId: question.id,
      knowledgePointId: d.knowledgePointId,
      relationType: 'PRIMARY',
      weight: 1,
      order: index + 1,
      isPrimary: true,
      sourceId: G6_SHANGHAI_ENGLISH_S1_PRACTICE_SOURCE_ID,
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
    sourceId: G6_SHANGHAI_ENGLISH_S1_PRACTICE_SOURCE_ID,
    status: 'PUBLISHED',
    contentStatus: 'PUBLISHED',
    currentVersion: 1,
    createdAt: importedAt,
    updatedAt: importedAt,
    ...reviewed,
  }
  gradeSixEnglishUpperBundles.push({
    textbookId: G6_SHANGHAI_ENGLISH_S1_TEXTBOOK_ID,
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
                        : `用本课句型“${d.sentencePattern}”和同伴练习。`,
                  },
                ],
              },
              referenceAnswer: `参考表达：${d.sentenceAnswer}。个人表达不自动判分。`,
              sourceId: G6_SHANGHAI_ENGLISH_S1_PRACTICE_SOURCE_ID,
              ...reviewed,
            },
            ...(material
              ? [
                  {
                    id: `${d.knowledgePointId}:communicate:speak:v1`,
                    knowledgePointId: d.knowledgePointId,
                    title: `补充口语：${material.title}`,
                    instruction: '和同伴按补充稿对话练习，再结合自己的想法交流。',
                    content: {
                      blocks: [{ type: 'hint' as const, value: material.frames }],
                    },
                    referenceAnswer: '口语表达没有唯一答案，不自动判分。',
                    sourceId: material.sourceId,
                    ...reviewed,
                  },
                  {
                    id: `${d.knowledgePointId}:communicate:write:v1`,
                    knowledgePointId: d.knowledgePointId,
                    title: `补充写作：${material.title}`,
                    instruction: material.write,
                    content: {
                      blocks: [
                        {
                          type: 'hint' as const,
                          value: '用自己的信息完成表达，请老师或家长核对。',
                        },
                      ],
                    },
                    referenceAnswer: '写作表达没有唯一答案，不自动判分。',
                    sourceId: material.sourceId,
                    ...reviewed,
                  },
                ]
              : []),
          ],
  })
}
