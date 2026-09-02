import type {
  Grade,
  Id,
  KnowledgePoint,
  LessonKnowledgePointRelation,
  LearningMapCurriculumSource,
  Lesson,
  MediaAsset,
  Publisher,
  Region,
  ResolveAvailableTextbooksInput,
  ResolveAvailableTextbooksOutput,
  Semester,
  Subject,
  StudentCurriculumProfile,
  TextbookDisplay,
  TextbookVersion,
  Unit,
} from '@/types'

export interface CurriculumService {
  getRegions(): Promise<Region[]>
  getGrades(): Promise<Grade[]>
  getSemesters(): Promise<Semester[]>
  getSubjects(): Promise<Subject[]>
  getTextbookVersions(input?: {
    subjectId?: Id
    gradeId?: Id
    semesterId?: Id
  }): Promise<TextbookVersion[]>
  getPublishers(): Promise<Publisher[]>
  getPublisher(publisherId: Id): Promise<Publisher | null>
  getTextbookDisplay(textbookVersionId: Id): Promise<TextbookDisplay | null>
  resolveAvailableTextbooks(
    input: ResolveAvailableTextbooksInput,
  ): Promise<ResolveAvailableTextbooksOutput>
  getCurriculumProfile(studentId: Id): Promise<StudentCurriculumProfile | null>
  saveCurriculumProfile(profile: StudentCurriculumProfile): Promise<StudentCurriculumProfile>
  getUnitsByTextbookVersion(textbookVersionId: Id): Promise<Unit[]>
  getLessonsByUnit(unitId: Id): Promise<Lesson[]>
  getKnowledgePointsByLesson(lessonId: Id): Promise<KnowledgePoint[]>
  getLessonKnowledgePointRelation?(
    lessonId: Id,
    knowledgePointId: Id,
  ): Promise<LessonKnowledgePointRelation | null>
  getKnowledgePointById(knowledgePointId: Id): Promise<KnowledgePoint | null>
  getLearningMapCurriculum(textbookVersionId: Id): Promise<LearningMapCurriculumSource | null>

  // Compatibility aliases retained for the PHASE 4 service stub.
  listRegions(): Promise<Region[]>
  listGrades(): Promise<Grade[]>
  listSemesters(): Promise<Semester[]>
  getTextbook(textbookVersionId: Id): Promise<TextbookVersion | null>
}

export interface StudentService {
  getCurriculumProfile(studentId: Id): Promise<StudentCurriculumProfile | null>
  saveCurriculumProfile(profile: StudentCurriculumProfile): Promise<StudentCurriculumProfile>
}

export interface ContentService {
  getKnowledgePoint(knowledgePointId: Id): Promise<KnowledgePoint | null>
  getMediaAsset(mediaAssetId: Id): Promise<MediaAsset | null>
}
