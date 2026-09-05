import type {
  CurriculumImportPackage,
  Grade,
  KnowledgePrerequisite,
  KnowledgePoint,
  Lesson,
  LessonKnowledgePointRelation,
  Semester,
  Subject,
  SubjectCode,
  TextbookVersion,
  Unit,
  Publisher,
} from '@/types'
import type {
  LearningMapCurriculumKnowledgePoint,
  LearningMapCurriculumKnowledgeRelation,
  LearningMapCurriculumLesson,
  LearningMapCurriculumLessonKnowledgePoint,
  LearningMapCurriculumSource,
  LearningMapCurriculumUnit,
  LearningMapLessonKnowledgeRole,
} from '@/types'

function sampleStatus(record: {
  isSample?: boolean
  verificationStatus?: LearningMapCurriculumSource['verificationStatus']
}) {
  return {
    isSample: record.isSample === true,
    verificationStatus: record.verificationStatus,
  }
}

function mapRelationRole(
  relationType: LessonKnowledgePointRelation['relationType'],
): LearningMapLessonKnowledgeRole {
  if (relationType === 'EXTENSION') return 'extended'
  if (relationType === 'CORE') return 'core'
  return 'secondary'
}

function parseGradeNumber(grade: Grade): number {
  const match = grade.code.match(/\d+/)
  return match ? Number(match[0]) : grade.sortOrder
}

function semesterNumber(semester: Semester): number {
  return semester.code === 'LOWER' ? 2 : 1
}

function importSubjectCode(value: string): SubjectCode {
  if (value === 'CHINESE' || value === 'MATH' || value === 'ENGLISH') return value
  throw new Error(`地图暂不支持 ${value} 学科数据`)
}

export interface DomainLearningMapSourceInput {
  textbook: TextbookVersion
  grade: Grade
  semester: Semester
  subject: Subject
  publisher?: Publisher
  units: Unit[]
  lessons: Lesson[]
  knowledgePoints: KnowledgePoint[]
  lessonKnowledgePoints: LessonKnowledgePointRelation[]
  knowledgePrerequisites: KnowledgePrerequisite[]
}

export function buildLearningMapSourceFromDomain(
  input: DomainLearningMapSourceInput,
): LearningMapCurriculumSource {
  const textbookStatus = sampleStatus(input.textbook)
  const sourceStatus = input.textbook.verificationStatus
  return {
    textbook: {
      id: input.textbook.id,
      title: input.textbook.versionName,
      grade: parseGradeNumber(input.grade),
      semester: semesterNumber(input.semester),
      subject: input.subject.code,
      edition:
        input.publisher?.officialName ??
        (input.textbook.editionYear ? String(input.textbook.editionYear) : undefined),
      ...textbookStatus,
    },
    units: input.units.map((unit): LearningMapCurriculumUnit => ({
      id: unit.id,
      textbookId: unit.textbookVersionId,
      title: unit.title,
      subtitle: unit.subtitle,
      sort: unit.sortOrder,
      ...sampleStatus(unit),
    })),
    lessons: input.lessons.map((lesson): LearningMapCurriculumLesson => ({
      id: lesson.id,
      unitId: lesson.unitId,
      title: lesson.title,
      sort: lesson.sortOrder,
      ...sampleStatus(lesson),
    })),
    knowledgePoints: input.knowledgePoints.map(
      (knowledgePoint): LearningMapCurriculumKnowledgePoint => ({
        id: knowledgePoint.id,
        name: knowledgePoint.name,
        ...sampleStatus(knowledgePoint),
      }),
    ),
    lessonKnowledgePoints: input.lessonKnowledgePoints.map(
      (relation): LearningMapCurriculumLessonKnowledgePoint => ({
        id: relation.id,
        lessonId: relation.lessonId,
        knowledgePointId: relation.knowledgePointId,
        role: mapRelationRole(relation.relationType),
        weight: relation.isPrimary ? 1 : 0.5,
        sort: relation.order,
        ...sampleStatus(relation),
      }),
    ),
    knowledgeRelations: input.knowledgePrerequisites.map(
      (relation): LearningMapCurriculumKnowledgeRelation => ({
        id: relation.id,
        sourceKnowledgePointId: relation.prerequisiteKnowledgePointId,
        targetKnowledgePointId: relation.dependentKnowledgePointId,
        relationType: 'prerequisite',
        ...sampleStatus(relation),
      }),
    ),
    isSample: textbookStatus.isSample,
    verificationStatus: sourceStatus,
  }
}

export function buildLearningMapSourceFromImportPackage(
  pkg: CurriculumImportPackage,
): LearningMapCurriculumSource {
  const packageStatus = pkg.textbook.verificationStatus
  return {
    textbook: {
      id: pkg.textbook.id,
      title: pkg.textbook.title,
      grade: pkg.textbook.identity.grade,
      semester: pkg.textbook.identity.semester,
      subject: importSubjectCode(pkg.textbook.identity.subjectCode),
      edition: pkg.textbook.identity.publisherCode,
      isSample: pkg.textbook.isSample ?? false,
      verificationStatus: packageStatus,
    },
    units: pkg.units.map((unit): LearningMapCurriculumUnit => ({
      id: unit.id,
      textbookId: unit.textbookId,
      title: unit.title,
      sort: unit.sort,
      isSample: unit.isSample ?? false,
      verificationStatus: unit.verificationStatus,
    })),
    lessons: pkg.lessons.map((lesson): LearningMapCurriculumLesson => ({
      id: lesson.id,
      unitId: lesson.unitId,
      title: lesson.title,
      sort: lesson.sort,
      mappingSkipReason: lesson.mappingSkipReason,
      isSample: lesson.isSample ?? false,
      verificationStatus: lesson.verificationStatus,
    })),
    knowledgePoints: pkg.knowledgePoints.map(
      (knowledgePoint): LearningMapCurriculumKnowledgePoint => ({
        id: knowledgePoint.id,
        name: knowledgePoint.name,
        ...sampleStatus(knowledgePoint),
      }),
    ),
    lessonKnowledgePoints: pkg.lessonKnowledgePoints.map(
      (mapping, index): LearningMapCurriculumLessonKnowledgePoint => ({
        id: mapping.id,
        lessonId: mapping.lessonId,
        knowledgePointId: mapping.knowledgePointId,
        role: mapping.role,
        weight: mapping.weight,
        sort: index + 1,
        isSample: mapping.isSample ?? false,
        verificationStatus: mapping.verificationStatus,
      }),
    ),
    knowledgeRelations: pkg.knowledgeRelations.map(
      (relation): LearningMapCurriculumKnowledgeRelation => ({
        id: relation.id,
        sourceKnowledgePointId: relation.sourceKnowledgePointId,
        targetKnowledgePointId: relation.targetKnowledgePointId,
        relationType: relation.relationType,
        isSample: relation.isSample ?? false,
        verificationStatus: relation.verificationStatus,
      }),
    ),
    isSample: pkg.textbook.isSample ?? false,
    verificationStatus: packageStatus,
  }
}
