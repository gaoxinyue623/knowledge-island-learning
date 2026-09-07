import { curriculumData } from '@/data/curriculum'
import type { CurriculumService } from '@/services/contracts'
import { buildLearningMapSourceFromDomain } from '@/services/learning-map/curriculumSource'
import {
  curriculumAccessConfig,
  getRecordVerificationStatus,
  isCurriculumRecordReadable,
  type CurriculumAccessPolicy,
} from '@/services/curriculum'
import {
  curriculumProfileRepository,
  type CurriculumProfileRepository,
} from '@/services/storage/curriculumProfileRepository'
import type {
  Grade,
  Id,
  KnowledgePoint,
  Lesson,
  LessonKnowledgePointRelation,
  LearningMapCurriculumSource,
  KnowledgePrerequisite,
  Publisher,
  Region,
  RegionTextbookRelation,
  ResolveAvailableTextbooksInput,
  ResolveAvailableTextbooksOutput,
  Semester,
  Subject,
  StudentCurriculumProfile,
  TextbookDisplay,
  TextbookResolution,
  TextbookVersion,
  Unit,
  VerificationStatus,
} from '@/types'

type MockMode = 'success' | 'empty' | 'error' | 'unsupported'

export interface MockCurriculumData {
  regions: Region[]
  grades: Grade[]
  semesters: Semester[]
  subjects: Subject[]
  publishers: Publisher[]
  textbooks: TextbookVersion[]
  regionTextbookRelations: RegionTextbookRelation[]
  units: Unit[]
  lessons: Lesson[]
  knowledgePoints: KnowledgePoint[]
  lessonKnowledgePointRelations: LessonKnowledgePointRelation[]
  knowledgePrerequisites: KnowledgePrerequisite[]
}

export interface MockCurriculumServiceOptions {
  mode?: MockMode
  delayMs?: number
  profileRepository?: CurriculumProfileRepository
  accessPolicy?: CurriculumAccessPolicy
  data?: Partial<MockCurriculumData>
}

const FALLBACK_SUBJECT_ID_BY_CODE = {
  CHINESE: 'SUBJECT_CHINESE',
  MATH: 'SUBJECT_MATH',
  ENGLISH: 'SUBJECT_ENGLISH',
} as const

function groupBy<T>(records: T[], keyOf: (record: T) => string): Map<string, T[]> {
  const grouped = new Map<string, T[]>()
  for (const record of records) {
    const key = keyOf(record)
    const existing = grouped.get(key) ?? []
    existing.push(record)
    grouped.set(key, existing)
  }
  return grouped
}

export class MockCurriculumService implements CurriculumService {
  private readonly mode: MockMode
  private readonly delayMs: number
  private readonly accessPolicy: CurriculumAccessPolicy
  private readonly profileRepository: CurriculumProfileRepository
  private readonly data: MockCurriculumData
  private readonly textbookById: ReadonlyMap<Id, TextbookVersion>
  private readonly publisherById: ReadonlyMap<Id, Publisher>
  private readonly knowledgePointById: ReadonlyMap<Id, KnowledgePoint>
  private readonly relationsByRegionId: ReadonlyMap<
    Id,
    MockCurriculumData['regionTextbookRelations']
  >
  private readonly lessonsByUnitId: ReadonlyMap<Id, Lesson[]>
  private readonly relationByLessonId: ReadonlyMap<
    Id,
    MockCurriculumData['lessonKnowledgePointRelations']
  >
  private lastResolutionAnomalies: string[] = []

  constructor(options: MockCurriculumServiceOptions = {}) {
    this.mode = options.mode ?? 'success'
    this.delayMs = options.delayMs ?? 0
    this.accessPolicy = options.accessPolicy ?? curriculumAccessConfig
    this.profileRepository = options.profileRepository ?? curriculumProfileRepository
    this.data = {
      regions: options.data?.regions ?? curriculumData.regions,
      grades: options.data?.grades ?? curriculumData.grades,
      semesters: options.data?.semesters ?? curriculumData.semesters,
      subjects: options.data?.subjects ?? curriculumData.subjects,
      publishers: options.data?.publishers ?? curriculumData.publishers,
      textbooks: options.data?.textbooks ?? curriculumData.textbooks,
      regionTextbookRelations:
        options.data?.regionTextbookRelations ?? curriculumData.regionTextbookRelations,
      units: options.data?.units ?? curriculumData.units,
      lessons: options.data?.lessons ?? curriculumData.lessons,
      knowledgePoints: options.data?.knowledgePoints ?? curriculumData.knowledgePoints,
      lessonKnowledgePointRelations:
        options.data?.lessonKnowledgePointRelations ?? curriculumData.lessonKnowledgePointRelations,
      knowledgePrerequisites:
        options.data?.knowledgePrerequisites ?? curriculumData.knowledgePrerequisites,
    }
    this.textbookById = new Map(this.data.textbooks.map((textbook) => [textbook.id, textbook]))
    this.publisherById = new Map(this.data.publishers.map((publisher) => [publisher.id, publisher]))
    this.knowledgePointById = new Map(
      this.data.knowledgePoints.map((knowledgePoint) => [knowledgePoint.id, knowledgePoint]),
    )
    this.relationsByRegionId = groupBy(
      this.data.regionTextbookRelations,
      (relation) => relation.regionId,
    )
    this.lessonsByUnitId = groupBy(this.data.lessons, (lesson) => lesson.unitId)
    this.relationByLessonId = groupBy(
      this.data.lessonKnowledgePointRelations,
      (relation) => relation.lessonId,
    )
  }

  getLastResolutionAnomalies(): string[] {
    return [...this.lastResolutionAnomalies]
  }

  private async run<T>(operation: () => T): Promise<T> {
    if (this.delayMs > 0) {
      await new Promise<void>((resolve) => setTimeout(resolve, this.delayMs))
    }
    if (this.mode === 'error') throw new Error('SAMPLE_MOCK_ERROR')
    return operation()
  }

  private listOrEmpty<T>(records: T[]): T[] {
    return this.mode === 'empty' ? [] : [...records]
  }

  private readable<
    T extends {
      isSample?: boolean
      needsVerification?: boolean
      verificationStatus?: VerificationStatus
      status?: string
    },
  >(records: T[]): T[] {
    return records.filter((record) => isCurriculumRecordReadable(record, this.accessPolicy))
  }

  private usableForResolution<
    T extends {
      isSample?: boolean
      needsVerification?: boolean
      verificationStatus?: VerificationStatus
      status?: string
    },
  >(record: T): boolean {
    if (!isCurriculumRecordReadable(record, this.accessPolicy)) return false
    return (
      record.status === 'ACTIVE' ||
      (getRecordVerificationStatus(record) === 'SAMPLE' && this.accessPolicy.allowSampleCurriculum)
    )
  }

  async getRegions(): Promise<Region[]> {
    return this.run(() => this.listOrEmpty(this.readable(this.data.regions)))
  }

  async getGrades(): Promise<Grade[]> {
    return this.run(() => this.listOrEmpty(this.data.grades))
  }

  async getSemesters(): Promise<Semester[]> {
    return this.run(() => this.listOrEmpty(this.data.semesters))
  }

  async getSubjects(): Promise<Subject[]> {
    return this.run(() => this.listOrEmpty(this.data.subjects))
  }

  async getPublishers(): Promise<Publisher[]> {
    return this.run(() => this.listOrEmpty(this.readable(this.data.publishers)))
  }

  async getPublisher(publisherId: Id): Promise<Publisher | null> {
    return this.run(() =>
      this.mode === 'empty'
        ? null
        : (() => {
            const publisher = this.publisherById.get(publisherId)
            return publisher && isCurriculumRecordReadable(publisher, this.accessPolicy)
              ? publisher
              : null
          })(),
    )
  }

  async getTextbookVersions(
    input: { subjectId?: Id; gradeId?: Id; semesterId?: Id } = {},
  ): Promise<TextbookVersion[]> {
    return this.run(() => {
      if (this.mode === 'empty') return []
      return [...this.textbookById.values()].filter(
        (textbook) =>
          this.usableForResolution(textbook) &&
          (!input.subjectId || textbook.subjectId === input.subjectId) &&
          (!input.gradeId || textbook.gradeId === input.gradeId) &&
          (!input.semesterId || textbook.semesterId === input.semesterId),
      )
    })
  }

  async getTextbookDisplay(textbookVersionId: Id): Promise<TextbookDisplay | null> {
    return this.run(() => {
      const textbook = this.textbookById.get(textbookVersionId)
      if (!textbook || !this.usableForResolution(textbook)) return null
      const publisher = this.publisherById.get(textbook.publisherId)
      return publisher && this.usableForResolution(publisher) ? { textbook, publisher } : null
    })
  }

  private relationIsEffective(
    relation: MockCurriculumData['regionTextbookRelations'][number],
  ): boolean {
    const today = new Date().toISOString().slice(0, 10)
    return (
      relation.effectiveFrom <= today && (!relation.effectiveTo || today <= relation.effectiveTo)
    )
  }

  private getResolution(
    input: ResolveAvailableTextbooksInput,
    subjectId: Id,
    subjectLabel: string,
  ): TextbookResolution {
    if (this.mode === 'empty' || this.mode === 'unsupported') {
      return { subjectId, availableTextbooks: [], resolutionStatus: 'NOT_AVAILABLE' }
    }

    const availableTextbooks = [...this.textbookById.values()]
      .filter(
        (textbook) =>
          this.usableForResolution(textbook) &&
          this.usableForResolution(this.publisherById.get(textbook.publisherId) ?? {}) &&
          textbook.gradeId === input.gradeId &&
          textbook.semesterId === input.semesterId &&
          textbook.subjectId === subjectId,
      )
      .sort((left, right) => left.id.localeCompare(right.id))

    // Regional adoption metadata is diagnostic only, never a selection restriction.
    const relations = (this.relationsByRegionId.get(input.regionId) ?? []).filter((relation) => {
      const textbook = this.textbookById.get(relation.textbookVersionId)
      if (!textbook) return false
      return (
        this.usableForResolution(relation) &&
        this.usableForResolution(textbook) &&
        this.usableForResolution(this.publisherById.get(textbook.publisherId) ?? {}) &&
        this.relationIsEffective(relation) &&
        textbook.gradeId === input.gradeId &&
        textbook.semesterId === input.semesterId &&
        textbook.subjectId === subjectId
      )
    })

    const defaultIds = new Set(
      relations
        .filter((relation) => relation.usageType === 'DEFAULT')
        .map((relation) => relation.textbookVersionId),
    )

    if (defaultIds.size > 1) {
      this.lastResolutionAnomalies.push(
        `${input.regionId}/${subjectLabel}: 多个 DEFAULT，必须人工处理`,
      )
    }

    if (availableTextbooks.length === 0) {
      return { subjectId, availableTextbooks, resolutionStatus: 'NOT_AVAILABLE' }
    }
    return { subjectId, availableTextbooks, resolutionStatus: 'NEEDS_CONFIRMATION' }
  }

  async resolveAvailableTextbooks(
    input: ResolveAvailableTextbooksInput,
  ): Promise<ResolveAvailableTextbooksOutput> {
    return this.run(() => {
      this.lastResolutionAnomalies = []
      const subjectId = (subjectCode: keyof typeof FALLBACK_SUBJECT_ID_BY_CODE): Id =>
        this.data.subjects.find((subject) => subject.code === subjectCode)?.id ??
        FALLBACK_SUBJECT_ID_BY_CODE[subjectCode]
      return {
        chinese: this.getResolution(input, subjectId('CHINESE'), '语文'),
        math: this.getResolution(input, subjectId('MATH'), '数学'),
        english: this.getResolution(input, subjectId('ENGLISH'), '英语'),
      }
    })
  }

  async getCurriculumProfile(studentId: Id): Promise<StudentCurriculumProfile | null> {
    return this.run(() => {
      const profile = this.profileRepository.load()
      return profile?.studentId === studentId ? profile : null
    })
  }

  async saveCurriculumProfile(
    profile: StudentCurriculumProfile,
  ): Promise<StudentCurriculumProfile> {
    return this.run(() => {
      const selections = [
        ['CHINESE', profile.chineseTextbookVersionId],
        ['MATH', profile.mathTextbookVersionId],
        ['ENGLISH', profile.englishTextbookVersionId],
      ] as const
      if (!selections.some(([, id]) => id)) throw new Error('请至少选择一科教材')
      for (const [code, id] of selections) {
        if (!id) continue
        const subjectId =
          this.data.subjects.find((subject) => subject.code === code)?.id ??
          FALLBACK_SUBJECT_ID_BY_CODE[code]
        const book = this.textbookById.get(id)
        if (
          !book ||
          !this.usableForResolution(book) ||
          !this.usableForResolution(this.publisherById.get(book.publisherId) ?? {}) ||
          book.subjectId !== subjectId ||
          book.gradeId !== profile.gradeId ||
          book.semesterId !== profile.semesterId
        ) {
          throw new Error('所选教材不适用于当前年级、学期或学科，请重新选择')
        }
      }
      this.profileRepository.save(profile)
      return profile
    })
  }

  async getUnitsByTextbookVersion(textbookVersionId: Id): Promise<Unit[]> {
    return this.run(() =>
      this.readable(this.data.units)
        .filter((unit) => unit.textbookVersionId === textbookVersionId)
        .sort((left, right) => left.sortOrder - right.sortOrder),
    )
  }

  async getLessonsByUnit(unitId: Id): Promise<Lesson[]> {
    return this.run(() =>
      this.readable([...(this.lessonsByUnitId.get(unitId) ?? [])]).sort(
        (left, right) => left.sortOrder - right.sortOrder,
      ),
    )
  }

  async getKnowledgePointsByLesson(lessonId: Id): Promise<KnowledgePoint[]> {
    return this.run(() =>
      [...(this.relationByLessonId.get(lessonId) ?? [])]
        .filter((relation) => isCurriculumRecordReadable(relation, this.accessPolicy))
        .sort((left, right) => left.order - right.order)
        .map((relation) => this.knowledgePointById.get(relation.knowledgePointId))
        .filter((knowledgePoint): knowledgePoint is KnowledgePoint => {
          if (!knowledgePoint) return false
          return isCurriculumRecordReadable(knowledgePoint, this.accessPolicy)
        }),
    )
  }

  async getLessonKnowledgePointRelation(
    lessonId: Id,
    knowledgePointId: Id,
  ): Promise<LessonKnowledgePointRelation | null> {
    return this.run(() => {
      const relation = this.data.lessonKnowledgePointRelations.find(
        (candidate) =>
          candidate.lessonId === lessonId && candidate.knowledgePointId === knowledgePointId,
      )
      return relation && isCurriculumRecordReadable(relation, this.accessPolicy) ? relation : null
    })
  }

  async getKnowledgePointById(knowledgePointId: Id): Promise<KnowledgePoint | null> {
    return this.run(() => {
      const knowledgePoint = this.knowledgePointById.get(knowledgePointId)
      return knowledgePoint && isCurriculumRecordReadable(knowledgePoint, this.accessPolicy)
        ? knowledgePoint
        : null
    })
  }

  async getLearningMapCurriculum(
    textbookVersionId: Id,
  ): Promise<LearningMapCurriculumSource | null> {
    return this.run(() => {
      if (this.mode === 'empty' || this.mode === 'unsupported') return null
      const textbook = this.textbookById.get(textbookVersionId)
      if (!textbook || !this.usableForResolution(textbook)) return null
      const grade = this.data.grades.find((candidate) => candidate.id === textbook.gradeId)
      const semester = this.data.semesters.find((candidate) => candidate.id === textbook.semesterId)
      const subject = this.data.subjects.find((candidate) => candidate.id === textbook.subjectId)
      const publisher = this.publisherById.get(textbook.publisherId)
      if (!grade || !semester || !subject) return null

      const units = this.readable(this.data.units).filter(
        (unit) => unit.textbookVersionId === textbookVersionId,
      )
      const unitIds = new Set(units.map((unit) => unit.id))
      const lessons = this.readable(this.data.lessons).filter((lesson) =>
        unitIds.has(lesson.unitId),
      )
      const lessonIds = new Set(lessons.map((lesson) => lesson.id))
      const mappings = this.readable(this.data.lessonKnowledgePointRelations).filter((mapping) =>
        lessonIds.has(mapping.lessonId),
      )
      const knowledgePointIds = new Set(mappings.map((mapping) => mapping.knowledgePointId))
      const knowledgePoints = this.readable(this.data.knowledgePoints).filter((knowledgePoint) =>
        knowledgePointIds.has(knowledgePoint.id),
      )
      const knowledgePrerequisites = this.readable(this.data.knowledgePrerequisites).filter(
        (relation) =>
          knowledgePointIds.has(relation.prerequisiteKnowledgePointId) &&
          knowledgePointIds.has(relation.dependentKnowledgePointId),
      )
      return buildLearningMapSourceFromDomain({
        textbook,
        grade,
        semester,
        subject,
        publisher,
        units,
        lessons,
        knowledgePoints,
        lessonKnowledgePoints: mappings,
        knowledgePrerequisites,
      })
    })
  }

  async listRegions(): Promise<Region[]> {
    return this.getRegions()
  }

  async listGrades(): Promise<Grade[]> {
    return this.getGrades()
  }

  async listSemesters(): Promise<Semester[]> {
    return this.getSemesters()
  }

  async getTextbook(textbookVersionId: Id): Promise<TextbookVersion | null> {
    return this.run(() => {
      const textbook = this.textbookById.get(textbookVersionId)
      return textbook && isCurriculumRecordReadable(textbook, this.accessPolicy) ? textbook : null
    })
  }
}
