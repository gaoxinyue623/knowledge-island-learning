import { classroomIllustrationSource, classroomIllustrationAsset } from './classroom-illustration'
import junshenCorrection from './junshen-image-correction.json'
import honglouCorrection from './honglou-image-correction.json'
import supplied from './contents.json'
import supplement from './supplement.json'
import readingBarSupplement from './reading-bar-supplement.json'
import unitThreeSupplement from './unit-3-image-supplement.json'
import { G5_CHINESE_LOWER_UNIT_3_SOURCE_ID, unitThreeContentBlocks } from './unit-3-media'
import { G1_PEP_CHINESE_PUBLISHER_ID } from '../../grade-1/chinese-pep-upper'
import {
  G5_CHINESE_LOWER_IMPORT_APPROVAL as approval,
  G5_CHINESE_LOWER_IMPORTED_AT as importedAt,
} from '../../production/gradeFiveChineseLowerApproval'
import type { CurriculumData } from '../../types'
import type { ContentExpansionBundle, Grade, Question, QuestionKnowledgePoint } from '@/types'

export const G5_PEP_CHINESE_S2_TEXTBOOK_ID = 'G5_PEP_CHINESE_S2_USER_IMPORTED'
export const G5_PEP_CHINESE_LOWER_CONTENT_SOURCE_ID = 'G5_PEP_CHINESE_S2_USER_TEXT_V1'
export const G5_PEP_CHINESE_LOWER_PRACTICE_SOURCE_ID = 'G5_PEP_CHINESE_S2_ORIGINAL_PRACTICE_V1'
export const G5_CHINESE_LOWER_SUPPLEMENT_SOURCE_ID = 'G5_PEP_CHINESE_S2_SUPPLEMENT_TEXT_V2'
export const G5_CHINESE_LOWER_SUPPLEMENT_PRACTICE_ID = 'G5_PEP_CHINESE_S2_SUPPLEMENT_PRACTICE_V2'
export const G5_CHINESE_LOWER_READING_BAR_SOURCE_ID = 'G5_PEP_CHINESE_S2_READING_BAR_IMAGES_V3'
export const G5_CHINESE_LOWER_JUNSHEN_SOURCE_ID = 'G5_PEP_CHINESE_S2_JUNSHEN_IMAGES_V5'
export const G5_CHINESE_LOWER_HONGLOU_SOURCE_ID = 'G5_PEP_CHINESE_S2_HONGLOU_IMAGES_V7'
export const gradeFiveChineseLowerSupplement = supplement
export const gradeFiveChineseLowerReadingBarSupplement = readingBarSupplement
export const gradeFiveChineseLowerSource = supplied
export const gradeFiveChineseLowerGrade: Grade = {
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
const updates = new Map(supplement.lessons.map((d) => [d.key, d]))
const imageUpdates = new Map(readingBarSupplement.lessons.map((d) => [d.key, d]))
const unitThreeUpdates = new Map(unitThreeSupplement.lessons.map((d) => [d.key, d]))
const baseKeys = new Set(supplied.lessons.map((d) => d.key))
const kindOrder: Record<string, number> = {
  reading: 0,
  integrated: 0,
  exchange: 1,
  trial: 2,
  example: 3,
  oral: 4,
  writing: 5,
  garden: 6,
  'reading-bar': 7,
  appendix: 0,
}
export const gradeFiveChineseLowerDefinitions = [
  ...supplied.lessons.map((d) =>
    d.key === 'reading-08'
      ? honglouCorrection.lesson
      : d.key === 'reading-11'
        ? junshenCorrection.lesson
        : (unitThreeUpdates.get(d.key) ?? imageUpdates.get(d.key) ?? updates.get(d.key) ?? d),
  ),
  ...supplement.lessons.filter((d) => !baseKeys.has(d.key)),
]
  .sort((a, b) => a.unit - b.unit || (kindOrder[a.kind] ?? 0) - (kindOrder[b.kind] ?? 0))
  .map((d) => ({
    ...d,
    ...(d.key === 'try-5'
      ? {
          sourceNote:
            '按用户补充文本学习，已附AI生成的课间教室观察插图，供选择人物观察动作和神态；非教材原图。',
          importNotes: ['按用户要求补入项目配套插图。'],
        }
      : {}),
    revision:
      d.key === 'reading-08'
        ? 7
        : d.key === 'try-5'
          ? 6
          : d.key === 'reading-11'
            ? 5
            : unitThreeUpdates.has(d.key)
              ? 4
              : imageUpdates.has(d.key)
                ? 3
                : updates.has(d.key)
                  ? 2
                  : 1,
    unitId: `G5_PEP_CHINESE_S2_UNIT_${pad(d.unit)}`,
    lessonId: `G5_PEP_CHINESE_S2_LESSON_${d.key.toUpperCase().replaceAll('-', '_')}`,
    knowledgePointId: `G5_PEP_CHINESE_S2_KP_${d.key.toUpperCase().replaceAll('-', '_')}`,
  }))
export const gradeFiveChineseLowerReadingOnlyIds = gradeFiveChineseLowerDefinitions
  .filter((d) => !d.questions.length)
  .map((d) => d.knowledgePointId)
export const gradeFiveChineseLowerAppendixIds = gradeFiveChineseLowerDefinitions
  .filter((d) => d.kind === 'appendix')
  .map((d) => d.knowledgePointId)
export const gradeFiveChineseLowerCurriculum: Pick<
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
      id: G5_PEP_CHINESE_S2_TEXTBOOK_ID,
      subjectId: 'SUBJECT_CHINESE',
      gradeId: 'GRADE_5',
      semesterId: 'SEMESTER_LOWER',
      publisherId: G1_PEP_CHINESE_PUBLISHER_ID,
      versionName: '部编（人教版）语文五年级下册（2019版·用户提供文本及教材图片）',
      editionYear: readingBarSupplement.editionYear,
      sourceId: G5_PEP_CHINESE_LOWER_CONTENT_SOURCE_ID,
      status: 'ACTIVE',
      createdAt: importedAt,
      updatedAt: readingBarSupplement.updatedAt,
      ...reviewed,
    },
  ],
  units: supplied.units.map((unit) => ({
    id: `G5_PEP_CHINESE_S2_UNIT_${pad(unit.number)}`,
    textbookVersionId: G5_PEP_CHINESE_S2_TEXTBOOK_ID,
    code: `G5-PEP-CHINESE-S2-U${unit.number}`,
    title: unit.title,
    subtitle:
      unit.number === 9
        ? '按表认读、书写和复习，全册附录不对应单篇课文。'
        : '按导入目录阅读、交流与写作。',
    sortOrder: unit.number,
    sourceId: G5_PEP_CHINESE_LOWER_CONTENT_SOURCE_ID,
    status: 'ACTIVE',
    ...reviewed,
  })),
  lessons: [],
  knowledgePoints: [],
  lessonKnowledgePointRelations: [],
  knowledgePrerequisites: [],
  courseContents: [],
  sources: [
    classroomIllustrationSource,
    {
      id: G5_CHINESE_LOWER_HONGLOU_SOURCE_ID,
      title: '第8课红楼春趣（用户四张教材图片）',
      sourceType: 'TEXTBOOK',
      publisher: supplied.publisher,
      sourceRef: 'user-provided://g5-pep-chinese-lower/2026-10-10/honglou-images',
      sourceVersion: `SHA256:${honglouCorrection.sourceSha256}`,
      copyrightStatus: 'PENDING',
      notes: honglouCorrection.lesson.sourceNote,
      verifiedAt: honglouCorrection.updatedAt,
      ...reviewed,
    },
    {
      id: G5_CHINESE_LOWER_JUNSHEN_SOURCE_ID,
      title: '五年级下册第11课军神（用户四张教材图片）',
      sourceType: 'TEXTBOOK',
      publisher: supplied.publisher,
      edition: '2019版（本册用户确认）',
      sourceRef: 'user-provided://g5-pep-chinese-lower/2026-10-10/junshen-images',
      sourceVersion: `SHA256:${junshenCorrection.sourceSha256}`,
      copyrightStatus: 'PENDING',
      notes: junshenCorrection.lesson.sourceNote,
      verifiedAt: junshenCorrection.updatedAt,
      ...reviewed,
    },
    {
      id: G5_CHINESE_LOWER_UNIT_3_SOURCE_ID,
      title: '五年级下册第三单元汉字综合学习（用户10张教材图片）',
      sourceType: 'TEXTBOOK',
      publisher: supplied.publisher,
      edition: '2019版（用户明确指定）',
      sourceRef: 'user-provided://g5-pep-chinese-lower/2026-10-10/unit-3-images',
      sourceVersion: `SHA256:${unitThreeSupplement.sourceSha256}`,
      copyrightStatus: 'PENDING',
      notes: unitThreeSupplement.sourceNote,
      verifiedAt: unitThreeSupplement.updatedAt,
      ...reviewed,
    },
    {
      id: G5_CHINESE_LOWER_READING_BAR_SOURCE_ID,
      title: readingBarSupplement.title,
      sourceType: 'TEXTBOOK',
      publisher: supplied.publisher,
      edition: '2019年（用户明确确认）',
      sourceRef: 'user-provided://g5-pep-chinese-lower/2026-10-10/reading-bar-images',
      sourceVersion: `SHA256:${readingBarSupplement.sourceSha256}`,
      copyrightStatus: 'PENDING',
      notes:
        '两张用户提供教材图片的可见文字完整转录，原始图片与转录稿独立归档；版本年份按用户明确确认登记。',
      verifiedAt: readingBarSupplement.updatedAt,
      ...reviewed,
    },
    {
      id: G5_CHINESE_LOWER_SUPPLEMENT_SOURCE_ID,
      title: supplement.title,
      sourceType: 'TEXTBOOK',
      publisher: supplied.publisher,
      sourceRef: 'user-provided://g5-pep-chinese-lower/2026-10-09/supplement',
      sourceVersion: `SHA256:${supplement.sourceSha256}`,
      copyrightStatus: 'PENDING',
      notes:
        '按会话补充文本导入例文、旁批和栏目；栏目归属按用户明确确认。第三单元仅更新活动建议，保留初稿阅读材料。未独立核验出版社电子课本。',
      verifiedAt: supplement.updatedAt,
      ...reviewed,
    },
    {
      id: G5_CHINESE_LOWER_SUPPLEMENT_PRACTICE_ID,
      title: '五年级下册补充例文原创理解题与栏目提示',
      sourceType: 'AI_GENERATED',
      sourceRef: 'local-original://g5-pep-chinese-lower/supplement-practice-v2',
      sourceVersion: 'ORIGINAL_SUPPLEMENT_PRACTICE_V2',
      copyrightStatus: 'PENDING',
      notes: '两篇补充例文各3道原创理解题，开放栏目不自动判分。',
      verifiedAt: supplement.updatedAt,
      ...reviewed,
    },
    {
      id: G5_PEP_CHINESE_LOWER_CONTENT_SOURCE_ID,
      title: supplied.title,
      sourceType: 'TEXTBOOK',
      publisher: supplied.publisher,
      edition: supplied.title,
      sourceRef: 'user-provided://g5-pep-chinese-lower/2026-10-09',
      sourceVersion: `SHA256:${supplied.sourceSha256}`,
      copyrightStatus: 'PENDING',
      notes: supplied.sourceNote,
      verifiedAt: importedAt,
      ...reviewed,
    },
    {
      id: G5_PEP_CHINESE_LOWER_PRACTICE_SOURCE_ID,
      title: '五年级下册语文原创阅读理解与学习提示',
      sourceType: 'AI_GENERATED',
      sourceRef: 'local-original://g5-pep-chinese-lower/practice-v1',
      sourceVersion: 'ORIGINAL_PRACTICE_V1',
      copyrightStatus: 'PENDING',
      notes:
        'Codex依据提供文本逐题编写并校验原文依据；栏目学习提示为项目原创，开放表达无唯一答案，不自动判分。',
      verifiedAt: importedAt,
      ...reviewed,
    },
  ],
}
export const gradeFiveChineseLowerQuestions: Question[] = []
export const gradeFiveChineseLowerMappings: QuestionKnowledgePoint[] = []
export const gradeFiveChineseLowerBundles: ContentExpansionBundle[] = []
const guidance: Record<string, string> = {
  oral: '先想清楚要告诉听众什么，按顺序介绍，留出时间倾听和提问。分享时不必公开家庭住址、联系方式等私人信息。',
  writing:
    '围绕题目选一件事或一个对象，列出要写的细节，按顺序写清楚，再读一遍检查是否通顺。续写和童话中的想象要与已有情节衔接。',
  garden:
    '回看本单元课文，挑出需要巩固的字词，摘录喜欢的句子，说说自己的发现。结合已提供的词句和积累内容练习表达。',
  'reading-bar': '选择一本适合自己的古典名著，记录书名和人物，联系上下文理解难词，再交流阅读感受。',
  integrated: '按活动建议搜集资料，交流汉字的特点和用字现象，记录信息来源，再整理自己的发现。',
  appendix:
    '按表认读或书写，标记还不熟悉的字词。未分组的字表按全册查阅，词语表保留原有七个单元分组，不自动分配到单篇课文。',
  reading: '读懂人物、景物或事情，回到文中找依据，再用自己的话说出发现。',
  example: '阅读例文，观察作者怎样选取小事并描写动作、神态和语言，再找出表现人物特点的细节。',
  exchange: '结合本单元课文，交流表现人物特点的方法，说明自己找到的依据。',
  trial:
    '观察熟悉的人物，选择动作、神态等细节写一个片段。图片尚未提供，可先完成身边人物的观察练习。',
}
for (const d of gradeFiveChineseLowerDefinitions) {
  const revision = d.revision
  const contentSourceId =
    revision === 7
      ? G5_CHINESE_LOWER_HONGLOU_SOURCE_ID
      : revision === 6
        ? G5_CHINESE_LOWER_SUPPLEMENT_SOURCE_ID
        : revision === 5
          ? G5_CHINESE_LOWER_JUNSHEN_SOURCE_ID
          : revision === 4
            ? G5_CHINESE_LOWER_UNIT_3_SOURCE_ID
            : revision === 3
              ? G5_CHINESE_LOWER_READING_BAR_SOURCE_ID
              : revision === 2
                ? G5_CHINESE_LOWER_SUPPLEMENT_SOURCE_ID
                : G5_PEP_CHINESE_LOWER_CONTENT_SOURCE_ID
  const practiceSourceId =
    revision === 2
      ? G5_CHINESE_LOWER_SUPPLEMENT_PRACTICE_ID
      : G5_PEP_CHINESE_LOWER_PRACTICE_SOURCE_ID
  const contentImportedAt =
    revision === 7
      ? honglouCorrection.updatedAt
      : revision === 6
        ? classroomIllustrationAsset.updatedAt
        : revision === 5
          ? junshenCorrection.updatedAt
          : revision === 4
            ? unitThreeSupplement.updatedAt
            : revision === 3
              ? readingBarSupplement.updatedAt
              : revision === 2
                ? supplement.updatedAt
                : importedAt
  const sourceId = d.text ? contentSourceId : practiceSourceId
  const goals = d.questions.length
    ? ['读通提供的文本，抓住关键信息。', '根据原句解释自己的判断。', '用自己的话表达阅读发现。']
    : [d.kind === 'appendix' ? '对照字词表认读、书写与复习。' : `围绕“${d.title}”准备自己的表达。`]
  const order = gradeFiveChineseLowerDefinitions.filter((x) => x.unit === d.unit).indexOf(d) + 1
  gradeFiveChineseLowerCurriculum.lessons.push({
    id: d.lessonId,
    unitId: d.unitId,
    code: `G5-PEP-CHINESE-S2-${d.key}`,
    title: d.title,
    sortOrder: order,
    sourceId: contentSourceId,
    status: 'ACTIVE',
    ...reviewed,
  })
  gradeFiveChineseLowerCurriculum.knowledgePoints.push({
    id: d.knowledgePointId,
    code: `G5-PEP-CHINESE-S2-${d.key}`,
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
  gradeFiveChineseLowerCurriculum.lessonKnowledgePointRelations.push({
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
  gradeFiveChineseLowerCurriculum.courseContents.push({
    id: `${d.knowledgePointId}_CONTENT_V${revision}`,
    knowledgePointId: d.knowledgePointId,
    title: d.title,
    contentType: d.text ? 'TEXTBOOK' : 'EXTENSION',
    contentFormat: revision === 4 || revision === 6 ? 'RICH_TEXT' : 'TEXT',
    body: {
      lessonId: d.lessonId,
      summary: d.sourceNote,
      learningGoals: goals,
      sourceScope:
        revision >= 3 && revision !== 6
          ? 'USER_PROVIDED_IMAGE_TRANSCRIPTION'
          : d.text
            ? 'USER_PROVIDED_TEXT'
            : 'DIRECTORY_WITH_ORIGINAL_GUIDANCE',
      suppliedText: d.text,
      sourceIds:
        revision === 6
          ? [sourceId, classroomIllustrationSource.id]
          : d.kind === 'integrated' && revision !== 4
            ? [G5_PEP_CHINESE_LOWER_CONTENT_SOURCE_ID, contentSourceId]
            : [sourceId],
      sourceNote: d.sourceNote,
      lessonKind: d.kind,
      missingSections: d.text ? [] : ['教材正文（附件仅提供标题）'],
      importNotes: d.importNotes,
      blocks:
        revision === 6
          ? [
              ...texts.map((text) => ({ type: 'TEXT', text })),
              {
                type: 'IMAGE',
                mediaAssetId: classroomIllustrationAsset.id,
                altText: classroomIllustrationAsset.altText,
                text: '课间教室观察插图 · AI生成配套素材',
              },
            ]
          : revision === 4
            ? unitThreeContentBlocks(d.key, texts)
            : texts.map((text) => ({ type: 'TEXT', text })),
      ...(revision === 5 ? { sourceImages: junshenCorrection.sourceImages } : {}),
      ...(revision === 7 ? { sourceImages: honglouCorrection.sourceImages } : {}),
      ...(revision === 4
        ? {
            sourceImages: unitThreeSupplement.sourceImages.filter((image) =>
              d.key === 'integrated-fun' ? image.page <= 4 : image.page >= 5,
            ),
            extractedImages: unitThreeSupplement.assets
              .filter((asset) => asset.ownerKey === d.key)
              .map((asset) => asset.mediaAssetId),
          }
        : {}),
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
    const id = `${d.knowledgePointId}_Q${index + 1}${revision === 7 ? '_R7' : revision === 2 ? '_R2' : ''}`
    const offset = (order + index) % seed.options.length
    const original = seed.options.map((label, n) => ({ label, n }))
    const labels = [...original.slice(offset), ...original.slice(0, offset)]
    const question: Question = {
      id,
      textbookVersionId: G5_PEP_CHINESE_S2_TEXTBOOK_ID,
      knowledgePointId: d.knowledgePointId,
      gradeId: 'GRADE_5',
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
      tags: ['g5-pep-chinese-lower-original', 'provided-text-comprehension'],
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
      questionVersion: revision === 5 ? 1 : revision,
      ...reviewed,
    }
    gradeFiveChineseLowerQuestions.push(question)
    gradeFiveChineseLowerMappings.push({
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
  gradeFiveChineseLowerBundles.push({
    textbookId: G5_PEP_CHINESE_S2_TEXTBOOK_ID,
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
