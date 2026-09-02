import type { Id, SubjectCode, VerificationStatus } from './domain'

export type LearningNodeStatus =
  'locked' | 'available' | 'learning' | 'completed' | 'mastered' | 'perfect'

export type LearningMapNodeType = 'unit' | 'lesson' | 'knowledge' | 'checkpoint'

export interface LearningMapPosition {
  x: number
  y: number
}

export interface LearningMapSize {
  width: number
  height: number
}

export interface LearningMapVisual {
  variant: string
  iconKey?: string
  landmarkKey?: string
}

export interface LearningMapTextbook {
  id: Id
  title: string
  grade: number
  semester: number
  subject: SubjectCode
  edition?: string
  isSample: boolean
  verificationStatus?: VerificationStatus
}

export interface LearningMapCurriculumUnit {
  id: Id
  textbookId: Id
  title: string
  subtitle?: string
  sort: number
  isSample: boolean
  verificationStatus?: VerificationStatus
}

export interface LearningMapCurriculumLesson {
  id: Id
  unitId: Id
  title: string
  sort: number
  isSample: boolean
  verificationStatus?: VerificationStatus
  mappingSkipReason?: string
}

export interface LearningMapCurriculumKnowledgePoint {
  id: Id
  name: string
  shortTitle?: string
  isSample: boolean
  verificationStatus?: VerificationStatus
}

export type LearningMapLessonKnowledgeRole = 'core' | 'secondary' | 'extended'

export interface LearningMapCurriculumLessonKnowledgePoint {
  id: Id
  lessonId: Id
  knowledgePointId: Id
  role: LearningMapLessonKnowledgeRole
  weight: number
  sort: number
  isSample: boolean
  verificationStatus?: VerificationStatus
}

export type LearningMapKnowledgeRelationType = 'prerequisite' | 'related' | 'advanced'

export interface LearningMapCurriculumKnowledgeRelation {
  id: Id
  sourceKnowledgePointId: Id
  targetKnowledgePointId: Id
  relationType: LearningMapKnowledgeRelationType
  isSample: boolean
  verificationStatus?: VerificationStatus
}

/**
 * Presentation-safe curriculum input. It deliberately contains no map
 * coordinates, colors, image URLs, or other visual fields.
 */
export interface LearningMapCurriculumSource {
  textbook: LearningMapTextbook
  units: LearningMapCurriculumUnit[]
  lessons: LearningMapCurriculumLesson[]
  knowledgePoints: LearningMapCurriculumKnowledgePoint[]
  lessonKnowledgePoints: LearningMapCurriculumLessonKnowledgePoint[]
  knowledgeRelations: LearningMapCurriculumKnowledgeRelation[]
  isSample: boolean
  verificationStatus?: VerificationStatus
}

export interface KnowledgeMapNode {
  id: Id
  type: 'knowledge'
  mappingId?: Id
  knowledgePointId: Id
  lessonId: Id
  unitId: Id
  title: string
  shortTitle?: string
  status: LearningNodeStatus
  progress: number
  position: LearningMapPosition
  visual: LearningMapVisual
  /** KnowledgePoint IDs, not array indexes; used by the deterministic unlock rule. */
  prerequisites: Id[]
  isSample: boolean
  verificationStatus?: VerificationStatus
  role?: LearningMapLessonKnowledgeRole
  weight?: number
  sort: number
}

export interface LessonMapSection {
  id: Id
  lessonId: Id
  unitId: Id
  title: string
  status: LearningNodeStatus
  progress: number
  nodes: KnowledgeMapNode[]
  position: LearningMapPosition
  sort: number
}

export interface UnitIsland {
  id: Id
  unitId: Id
  title: string
  subtitle?: string
  status: LearningNodeStatus
  progress: number
  lessons: LessonMapSection[]
  position: LearningMapPosition
  size: LearningMapSize
  theme: {
    biome: string
    landmark?: string
    decorationSet?: string
  }
  sort: number
}

export interface LearningMapConnection {
  id: Id
  fromNodeId: Id
  toNodeId: Id
  relationType: LearningMapKnowledgeRelationType
  status: 'locked' | 'available' | 'completed'
}

export interface LearningMapProgressSummary {
  completedNodes: number
  totalNodes: number
  percentage: number
}

export interface LearningMapDiagnostic {
  code: string
  message: string
  severity: 'warning' | 'error'
  entityId?: Id
}

export type LearningMapDataset = 'profile' | 'golden' | 'demo'

export type LearningMapLoadState = 'loading' | 'ready' | 'empty' | 'error' | 'not_available'

export interface LearningMapViewModel {
  dataset: LearningMapDataset
  textbook: LearningMapTextbook
  progress: LearningMapProgressSummary
  currentNodeId?: Id
  islands: UnitIsland[]
  connections: LearningMapConnection[]
  canvasSize: LearningMapSize
  diagnostics: LearningMapDiagnostic[]
  flags: {
    isDemo: boolean
    isUnverified: boolean
    isReadOnly?: boolean
  }
}

export interface LearningMapProgressRecord {
  nodeId: Id
  status: LearningNodeStatus
  progress: number
  startedAt?: string
  completedAt?: string
}

export interface LearningMapProgressStoragePayload {
  schemaVersion: 1
  textbookId: Id
  records: LearningMapProgressRecord[]
}

export interface LessonLaunchContext {
  textbookId: Id
  unitId: Id
  lessonId: Id
  knowledgePointId: Id
}

export interface LearningMapDiagnosticResult {
  source: LearningMapCurriculumSource
  viewModel: LearningMapViewModel
}
