import { localCurriculumData } from '../localCatalog'
import {
  approveLocalRecords,
  LOCAL_RELEASE_APPROVAL,
  LOCAL_RELEASE_APPROVED_AT,
} from '../localApproval'
import { approvedLocalBundles } from '../../content-expansion/localBundles'
import { createReadingQuest } from '../../../services/content-expansion/readingQuest'
import type { CurriculumData } from '../types'
import type {
  ContentSource,
  MvpCurriculumScope,
  Question,
  QuestionKnowledgePoint,
  SourceReference,
} from '@/types'

export const approvedCurriculum: CurriculumData = approveLocalRecords(localCurriculumData)
export const localQuestionVisuals = new Map<
  string,
  import('@/types/reading-quest').MathQuestVisual
>()
const questions: Question[] = []
const questionKnowledgePoints: QuestionKnowledgePoint[] = []
for (const bundle of approvedLocalBundles) {
  const content = approvedCurriculum.courseContents.find(
    (item) => item.knowledgePointId === bundle.knowledgePointId,
  )
  const lesson = approvedCurriculum.lessons.find((item) => item.id === bundle.lessonId)
  const blocks = content?.body.blocks as Array<{ text?: string }> | undefined
  const quest = createReadingQuest({
    bundle,
    title: lesson?.title ?? '',
    text: blocks?.map((block) => block.text ?? '').join('\n') ?? '',
  })
  for (const stage of quest?.stages ?? []) {
    if (stage.kind !== 'question') continue
    if (stage.visual) localQuestionVisuals.set(stage.question.id, stage.visual)
    const question = approveLocalRecords({
      ...stage.question,
      status: 'PUBLISHED' as const,
      textbookVersionId: bundle.textbookId,
      verificationStatus: 'REVIEWED' as const,
      needsVerification: false,
    })
    questions.push(question)
    questionKnowledgePoints.push({
      id: `mapping:${question.id}`,
      questionId: question.id,
      knowledgePointId: bundle.knowledgePointId,
      weight: 1,
      relationType: 'PRIMARY',
      order: 1,
      isPrimary: true,
      status: 'ACTIVE',
      sourceId: question.sourceId,
      isSample: false,
      needsVerification: false,
      verificationStatus: 'REVIEWED',
    })
  }
}
export const localReleaseQuestions = questions
export const localReleaseMappings = questionKnowledgePoints
const existingSources = new Map(approvedCurriculum.sources.map((source) => [source.id, source]))
const sourceIds = new Set(
  [
    ...approvedCurriculum.textbooks,
    ...approvedCurriculum.publishers,
    ...approvedCurriculum.units,
    ...approvedCurriculum.lessons,
    ...approvedCurriculum.knowledgePoints,
    ...approvedCurriculum.lessonKnowledgePointRelations,
    ...approvedCurriculum.knowledgePrerequisites,
    ...approvedCurriculum.regionTextbookRelations,
    ...approvedCurriculum.courseContents,
    ...questions,
  ].map((item) => item.sourceId),
)
export const localReleaseSources: ContentSource[] = [...sourceIds].map((id) => ({
  ...(existingSources.get(id) ?? {
    id,
    title: '本地导入配套练习',
    sourceType: 'TEACHER_CREATED' as const,
    copyrightStatus: 'UNKNOWN' as const,
  }),
  verificationStatus: 'REVIEWED',
  verifiedAt: LOCAL_RELEASE_APPROVED_AT,
  releaseApprovalId: LOCAL_RELEASE_APPROVAL,
}))
export const localReleaseReferences: SourceReference[] = localReleaseSources.map((source) => ({
  id: source.id,
  type: 'manual',
  title: source.title,
  sourceUrl: source.sourceRef,
  verifiedAt: LOCAL_RELEASE_APPROVED_AT,
  verifiedBy: '项目所有者（本次会话确认）',
  releaseApprovalId: LOCAL_RELEASE_APPROVAL,
  note: '本地课程正式使用审批；原始来源和版权字段保留，不代表外部机构认证。',
}))
export const localReleaseScope: MvpCurriculumScope = {
  id: 'LOCAL_IMPORTED_CURRICULUM_2026_09_07',
  version: 2,
  title: '本地导入正式课程',
  region: { code: 'MANUAL', name: '自主选教材' },
  selectionPolicy: 'MANUAL',
  minimumQuestionsPerKnowledgePoint: 1,
  readingOnlyKnowledgePointIds: [
    'G1_PEP_CHINESE_S1_KP_04',
    'G1_PEP_CHINESE_S1_KP_05',
    'G1_PEP_CHINESE_S1_KP_11',
    'G1_PEP_CHINESE_S1_KP_12',
    'G1_PEP_CHINESE_S1_KP_13',
    'G1_PEP_CHINESE_S2_KP_06',
    'G2_PEP_CHINESE_S1_KP_05',
    'G2_PEP_CHINESE_S2_KP_06',
  ],
  validFrom: '2026-09-07',
  entries: approvedCurriculum.textbooks.map((book) => ({
    id: `release:${book.id}`,
    textbookVersionId: book.id,
    status: 'RELEASED',
    regionCode: 'MANUAL',
    regionName: '自主选教材',
    grade: approvedCurriculum.grades.find((grade) => grade.id === book.gradeId)!.sortOrder,
    semester: approvedCurriculum.semesters.find((term) => term.id === book.semesterId)!.code as
      'UPPER' | 'LOWER',
    subjectCode: approvedCurriculum.subjects.find((subject) => subject.id === book.subjectId)!.code,
    sourceReferenceIds: [book.sourceId],
  })),
  sourceReferenceIds: [...sourceIds],
  releaseNote:
    '用户于 2026-09-07 确认当前本地导入课程为正式课程，直接通过内容审查。地区仅为个人资料，不宣称当地官方选用关系。',
}
