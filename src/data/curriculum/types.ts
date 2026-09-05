import type {
  ContentSource,
  CourseContent,
  Grade,
  KnowledgePoint,
  KnowledgePrerequisite,
  LearningMap,
  Lesson,
  LessonKnowledgePointRelation,
  MapNode,
  MediaAsset,
  Publisher,
  Question,
  QuestionKnowledgePoint,
  Region,
  RegionTextbookRelation,
  Semester,
  Subject,
  TextbookVersion,
  Unit,
} from '@/types'

/**
 * The curriculum data boundary used by runtime adapters.
 *
 * SAMPLE fixtures implement the same shape, but are kept in a separate
 * explicitly named dataset so they cannot leak into the user-facing runtime.
 */
export interface CurriculumData {
  grades: Grade[]
  semesters: Semester[]
  subjects: Subject[]
  regions: Region[]
  publishers: Publisher[]
  textbooks: TextbookVersion[]
  regionTextbookRelations: RegionTextbookRelation[]
  units: Unit[]
  lessons: Lesson[]
  knowledgePoints: KnowledgePoint[]
  lessonKnowledgePointRelations: LessonKnowledgePointRelation[]
  knowledgePrerequisites: KnowledgePrerequisite[]
  courseContents: CourseContent[]
  questions: Question[]
  questionKnowledgePoints: QuestionKnowledgePoint[]
  mediaAssets: MediaAsset[]
  learningMaps: LearningMap[]
  mapNodes: MapNode[]
  sources: ContentSource[]
}

/**
 * SAMPLE records are deliberately richer than the domain interfaces so the
 * development data can be blocked from production publishing.
 */
export type SampleRecord<T> = T & {
  isSample: true
  needsVerification: true
  verificationStatus: 'SAMPLE'
}

export type SampleContentSource = ContentSource & {
  isSample: true
  needsVerification: true
  verificationStatus: 'SAMPLE'
}

export interface SampleQuestion extends Question {
  isSample: true
  verificationStatus: 'SAMPLE'
}

export type SampleQuestionKnowledgePoint = SampleRecord<QuestionKnowledgePoint>

export interface SampleRecordStatus {
  isSample: boolean
  needsVerification: boolean
  status: string
}
