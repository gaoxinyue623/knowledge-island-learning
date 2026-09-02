import type { StudentService } from '@/services/contracts'
import {
  curriculumProfileRepository,
  type CurriculumProfileRepository,
} from '@/services/storage/curriculumProfileRepository'
import type { Id, StudentCurriculumProfile } from '@/types'

export class MockStudentService implements StudentService {
  constructor(
    private readonly profileRepository: CurriculumProfileRepository = curriculumProfileRepository,
  ) {}

  async getCurriculumProfile(studentId: Id): Promise<StudentCurriculumProfile | null> {
    const profile = this.profileRepository.load()
    return profile?.studentId === studentId ? profile : null
  }

  async saveCurriculumProfile(
    profile: StudentCurriculumProfile,
  ): Promise<StudentCurriculumProfile> {
    this.profileRepository.save(profile)
    return profile
  }
}
