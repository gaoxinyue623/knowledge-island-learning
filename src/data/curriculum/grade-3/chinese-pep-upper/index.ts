import supplied from './contents.json'
import supplement from './supplement.json'
import fullLesson from './lesson-10-full.json'
import writingMaterial from './writing-3-material.json'
import {
  gradeThreeStoryWritingMediaAssets,
  storyWritingSources,
  storyWritingTextSourceId,
  storyWritingImageSourceId,
} from './story-writing-media'
export { gradeThreeStoryWritingMediaAssets } from './story-writing-media'
import { G1_PEP_CHINESE_PUBLISHER_ID } from '../../grade-1/chinese-pep-upper'
import {
  G3_CHINESE_IMPORT_APPROVAL as approval,
  G3_CHINESE_IMPORTED_AT as importedAt,
} from '../../production/gradeThreeChineseApproval'
import type { CurriculumData } from '../../types'
import type { ContentExpansionBundle, Grade, Question, QuestionKnowledgePoint } from '@/types'

export const G3_PEP_CHINESE_S1_TEXTBOOK_ID = 'G3_PEP_CHINESE_S1_2022_USER_IMPORTED'
export const G3_PEP_CHINESE_CONTENT_SOURCE_ID = 'G3_PEP_CHINESE_S1_USER_TEXT_V1'
export const G3_PEP_CHINESE_PRACTICE_SOURCE_ID = 'G3_PEP_CHINESE_S1_ORIGINAL_PRACTICE_V1'
export const G3_PEP_CHINESE_SUPPLEMENT_SOURCE_ID = 'G3_PEP_CHINESE_S1_SUPPLEMENT_TEXT_V2'
export const G3_PEP_CHINESE_FULL_LESSON_SOURCE_ID = 'G3_PEP_CHINESE_S1_LESSON_10_FULL_V3'
export const gradeThreeChineseSource = supplied
export const gradeThreeChineseSupplement = supplement
export const gradeThreeChineseGrade: Grade = {
  id: 'GRADE_3',
  code: 'G3',
  name: '三年级',
  sortOrder: 3,
  status: 'ACTIVE',
}
const reviewed = {
  isSample: false,
  needsVerification: false,
  verificationStatus: 'REVIEWED' as const,
  releaseApprovalId: approval,
}
const pad = (n: number) => String(n).padStart(2, '0')
const updates = new Map([...supplement.lessons, fullLesson, writingMaterial].map((d) => [d.key, d]))
const baseKeys = new Set(supplied.lessons.map((d) => d.key))
const kindOrder: Record<string, number> = {
  reading: 0,
  oral: 1,
  writing: 2,
  example: 3,
  garden: 4,
  'reading-bar': 5,
  appendix: 6,
}
export const gradeThreeChineseDefinitions = [
  ...supplied.lessons.map((d) => {
    const update = updates.get(d.key)
    return {
      ...d,
      ...update,
      // Keep the original lesson identity and comprehension questions. The new
      // endings supplement the earlier synopsis; they do not certify a full text.
      text:
        update?.mode === 'APPEND_ENDINGS'
          ? `此前提供的故事概要\n\n${d.text.replace(/\n\n（课文有三种结局）$/, '')}\n\n本次补充：三个结局\n\n${update.text}`
          : (update?.text ?? d.text),
      questions:
        d.key === fullLesson.key
          ? d.questions.map((question, index) => {
              const evidence = [
                '“你跟我学。”有一次，一只同情它的小公鸡对它说。',
                '公鸡终于来找我了，我得去感谢它的来访。',
                '听见树丛中传来咕咕的叫声，就举枪瞄准，“砰！砰！”连开了两枪。',
              ][index]!
              return { ...question, evidence, explanation: `本次完整来稿的依据：“${evidence}”` }
            })
          : d.questions,
    }
  }),
  ...supplement.lessons.filter((d) => !baseKeys.has(d.key)).map((d) => ({ ...d, questions: [] })),
]
  .sort((a, b) => a.unit - b.unit || (kindOrder[a.kind] ?? 0) - (kindOrder[b.kind] ?? 0))
  .map((d) => ({
    ...d,
    revision:
      d.key === fullLesson.key || d.key === writingMaterial.key ? 3 : updates.has(d.key) ? 2 : 1,
    importNotes: updates.get(d.key)?.importNotes ?? [],
    unitId: `G3_PEP_CHINESE_S1_UNIT_${pad(d.unit)}`,
    lessonId: `G3_PEP_CHINESE_S1_LESSON_${d.key.toUpperCase().replaceAll('-', '_')}`,
    knowledgePointId: `G3_PEP_CHINESE_S1_KP_${d.key.toUpperCase().replaceAll('-', '_')}`,
  }))
export const gradeThreeChineseReadingOnlyIds = gradeThreeChineseDefinitions
  .filter((d) => !d.questions.length)
  .map((d) => d.knowledgePointId)
export const gradeThreeChineseCurriculum: Pick<
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
      id: G3_PEP_CHINESE_S1_TEXTBOOK_ID,
      subjectId: 'SUBJECT_CHINESE',
      gradeId: 'GRADE_3',
      semesterId: 'SEMESTER_UPPER',
      publisherId: G1_PEP_CHINESE_PUBLISHER_ID,
      versionName: supplied.title,
      editionYear: 2022,
      sourceId: G3_PEP_CHINESE_CONTENT_SOURCE_ID,
      status: 'ACTIVE',
      createdAt: importedAt,
      updatedAt: supplement.updatedAt,
      ...reviewed,
    },
  ],
  units: supplied.units.map((unit) => ({
    id: `G3_PEP_CHINESE_S1_UNIT_${pad(unit.number)}`,
    textbookVersionId: G3_PEP_CHINESE_S1_TEXTBOOK_ID,
    code: `G3-PEP-CHINESE-S1-U${unit.number}`,
    title: unit.title,
    subtitle: '按导入目录阅读、交流与写作。',
    sortOrder: unit.number,
    sourceId: G3_PEP_CHINESE_CONTENT_SOURCE_ID,
    status: 'ACTIVE',
    ...reviewed,
  })),
  lessons: [],
  knowledgePoints: [],
  lessonKnowledgePointRelations: [],
  knowledgePrerequisites: [],
  courseContents: [],
  sources: [
    ...storyWritingSources,
    {
      id: G3_PEP_CHINESE_FULL_LESSON_SOURCE_ID,
      title: '三年级上册第10课小狗学叫完整来稿及配套资料',
      sourceType: 'TEXTBOOK',
      publisher: supplied.publisher,
      edition: '三年级上册·第三单元·2022修订版（用户标注）',
      sourceRef: 'user-provided://g3-pep-chinese-upper/2026-10-10/lesson-10-full',
      sourceVersion: `SHA256:${fullLesson.sourceSha256}`,
      copyrightStatus: 'PENDING',
      notes: fullLesson.sourceNote,
      verifiedAt: fullLesson.updatedAt,
      ...reviewed,
    },
    {
      id: G3_PEP_CHINESE_SUPPLEMENT_SOURCE_ID,
      title: supplement.title,
      sourceType: 'TEXTBOOK',
      publisher: supplied.publisher,
      edition: supplied.title,
      sourceRef: 'user-provided://g3-pep-chinese-upper/2026-10-10/supplement',
      sourceVersion: `SHA256:${supplement.sourceSha256}`,
      copyrightStatus: 'PENDING',
      notes: supplement.sourceNote,
      verifiedAt: supplement.updatedAt,
      ...reviewed,
    },
    {
      id: G3_PEP_CHINESE_CONTENT_SOURCE_ID,
      title: `${supplied.title}目录、文本与字词表`,
      sourceType: 'TEXTBOOK',
      publisher: supplied.publisher,
      edition: supplied.title,
      sourceRef: 'user-provided://g3-pep-chinese-upper/2026-10-08',
      sourceVersion: `SHA256:${supplied.sourceSha256}`,
      copyrightStatus: 'PENDING',
      notes: supplied.sourceNote,
      verifiedAt: importedAt,
      ...reviewed,
    },
    {
      id: G3_PEP_CHINESE_PRACTICE_SOURCE_ID,
      title: '三年级上册语文原创阅读理解与学习提示',
      sourceType: 'AI_GENERATED',
      sourceRef: 'local-original://g3-pep-chinese-upper/practice-v1',
      sourceVersion: 'ORIGINAL_PRACTICE_V1',
      copyrightStatus: 'PENDING',
      notes:
        'Codex依据提供文本逐题编写并校验原文依据；栏目学习提示为项目原创，开放表达无唯一答案，不自动判分。',
      verifiedAt: importedAt,
      ...reviewed,
    },
  ],
}
export const gradeThreeChineseQuestions: Question[] = []
export const gradeThreeChineseMappings: QuestionKnowledgePoint[] = []
export const gradeThreeChineseBundles: ContentExpansionBundle[] = []
const guidance: Record<string, string> = {
  oral: '先想清楚要告诉听众什么，按顺序介绍，留出时间倾听和提问。分享时不必公开家庭住址、联系方式等私人信息。',
  writing:
    '围绕题目选一件事或一个对象，列出要写的细节，按顺序写清楚，再读一遍检查是否通顺。续写和童话中的想象要与已有情节衔接。',
  garden: '回看本单元课文，结合园地提供的词句和积累内容，摘录喜欢的句子，说说自己的发现。',
  'reading-bar':
    '选择一个适合自己的童话故事，记录书名与作者。读后介绍人物、经历和感受；不要把其他故事当成本册课文。',
  appendix: '按表认读或书写，标记还不熟悉的字词。词语表按原有单元顺序保留，不自动分配到单篇课文。',
  reading: '读懂人物、景物或事情，回到文中找依据，再用自己的话说出发现。',
  example: '观察作者怎样描写外形、动作、颜色或感受，再观察一个自己的对象，尝试写出具体细节。',
}
for (const d of gradeThreeChineseDefinitions) {
  const contentSourceId =
    d.key === writingMaterial.key
      ? storyWritingTextSourceId
      : d.revision === 3
        ? G3_PEP_CHINESE_FULL_LESSON_SOURCE_ID
        : d.revision === 2
          ? G3_PEP_CHINESE_SUPPLEMENT_SOURCE_ID
          : G3_PEP_CHINESE_CONTENT_SOURCE_ID
  const contentUpdatedAt =
    d.key === writingMaterial.key
      ? writingMaterial.updatedAt
      : d.revision === 3
        ? fullLesson.updatedAt
        : d.revision === 2
          ? supplement.updatedAt
          : importedAt
  const sourceId = d.text ? contentSourceId : G3_PEP_CHINESE_PRACTICE_SOURCE_ID
  const goals = d.questions.length
    ? ['读通提供的文本，抓住关键信息。', '根据原句解释自己的判断。', '用自己的话表达阅读发现。']
    : [d.kind === 'appendix' ? '对照字词表认读、书写与复习。' : `围绕“${d.title}”准备自己的表达。`]
  const order = gradeThreeChineseDefinitions.filter((x) => x.unit === d.unit).indexOf(d) + 1
  gradeThreeChineseCurriculum.lessons.push({
    id: d.lessonId,
    unitId: d.unitId,
    code: `G3-PEP-CHINESE-S1-${d.key}`,
    title: d.title,
    sortOrder: order,
    sourceId: contentSourceId,
    status: 'ACTIVE',
    ...reviewed,
  })
  gradeThreeChineseCurriculum.knowledgePoints.push({
    id: d.knowledgePointId,
    code: `G3-PEP-CHINESE-S1-${d.key}`,
    name: d.title,
    subjectId: 'SUBJECT_CHINESE',
    gradeScope: { minGrade: 3, maxGrade: 3, explicitGradeIds: ['GRADE_3'] },
    description: d.sourceNote,
    learningObjective: goals,
    abilityTags: d.questions.length ? ['阅读理解', '原文依据', '表达交流'] : ['阅读与表达'],
    difficultyLevel: 'STANDARD',
    sourceId: contentSourceId,
    status: 'ACTIVE',
    ...reviewed,
  })
  gradeThreeChineseCurriculum.lessonKnowledgePointRelations.push({
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
    .replace(/^#{1,6} /gm, '')
    .split(/\n\n+/)
    .filter(Boolean)
  const texts = [d.sourceNote, ...paragraphs]
  if (d.key === fullLesson.key)
    texts.push(`配套资料（用户提供，独立于课文正文）\n${fullLesson.supportingMaterials}`)
  if (!d.text) texts.push(`项目原创学习提示\n${guidance[d.kind]}`)
  gradeThreeChineseCurriculum.courseContents.push({
    id: `${d.knowledgePointId}_CONTENT_V${d.revision}`,
    knowledgePointId: d.knowledgePointId,
    title: d.title,
    contentType: d.text ? 'TEXTBOOK' : 'EXTENSION',
    contentFormat: d.key === writingMaterial.key ? 'RICH_TEXT' : 'TEXT',
    body: {
      lessonId: d.lessonId,
      summary: d.sourceNote,
      learningGoals: goals,
      sourceScope: d.text ? 'USER_PROVIDED_TEXT' : 'DIRECTORY_WITH_ORIGINAL_GUIDANCE',
      suppliedText: d.text,
      sourceNote: d.sourceNote,
      lessonKind: d.kind,
      missingSections: !d.text ? ['教材栏目正文'] : [],
      importNotes: d.importNotes,
      ...(d.key === fullLesson.key
        ? {
            supportingMaterials: fullLesson.supportingMaterials,
            textQuality: 'USER_PROVIDED_FULL_TEXT',
          }
        : {}),
      sourceIds:
        updates.get(d.key)?.mode === 'APPEND_ENDINGS'
          ? [G3_PEP_CHINESE_CONTENT_SOURCE_ID, contentSourceId]
          : [sourceId],
      blocks: texts.flatMap((text) => {
        const scene = d.key === writingMaterial.key ? text.match(/^第([123])幅图/) : null
        if (!scene) return [{ type: 'TEXT', text }]
        const asset = gradeThreeStoryWritingMediaAssets[Number(scene[1]) - 1]!
        return [
          {
            type: 'IMAGE',
            mediaAssetId: asset.id,
            altText: asset.altText!,
            text: `第${scene[1]}幅图 · AI生成配套素材`,
          },
          { type: 'TEXT', text },
        ]
      }),
      ...(d.key === writingMaterial.key
        ? {
            generatedIllustrations: gradeThreeStoryWritingMediaAssets.map((asset) => asset.id),
            sourceIds: [storyWritingTextSourceId, storyWritingImageSourceId],
          }
        : {}),
    },
    difficulty: 'STANDARD',
    sourceId,
    status: 'PUBLISHED',
    currentVersion: d.revision,
    createdAt: importedAt,
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
      textbookVersionId: G3_PEP_CHINESE_S1_TEXTBOOK_ID,
      knowledgePointId: d.knowledgePointId,
      gradeId: 'GRADE_3',
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
      sourceId: G3_PEP_CHINESE_PRACTICE_SOURCE_ID,
      status: 'PUBLISHED',
      estimatedSeconds: 90,
      tags: ['g3-pep-chinese-upper-original', 'provided-text-comprehension'],
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
      questionVersion: d.key === fullLesson.key ? 2 : 1,
      ...reviewed,
    }
    gradeThreeChineseQuestions.push(question)
    gradeThreeChineseMappings.push({
      id: `mapping:${id}`,
      questionId: id,
      knowledgePointId: d.knowledgePointId,
      relationType: 'PRIMARY',
      weight: 1,
      order: index + 1,
      isPrimary: true,
      sourceId: G3_PEP_CHINESE_PRACTICE_SOURCE_ID,
      status: 'ACTIVE',
      ...reviewed,
    })
  }
  const blockId = `${d.knowledgePointId}:intro`
  gradeThreeChineseBundles.push({
    textbookId: G3_PEP_CHINESE_S1_TEXTBOOK_ID,
    unitId: d.unitId,
    lessonId: d.lessonId,
    knowledgePointId: d.knowledgePointId,
    learningContent: {
      id: `${d.knowledgePointId}:learning:v1`,
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
      sourceId: G3_PEP_CHINESE_PRACTICE_SOURCE_ID,
      status: 'PUBLISHED',
      contentStatus: 'PUBLISHED',
      currentVersion: 1,
      createdAt: importedAt,
      updatedAt: importedAt,
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
        sourceId: G3_PEP_CHINESE_PRACTICE_SOURCE_ID,
        ...reviewed,
      },
    ],
  })
}
