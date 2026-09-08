import { petRepository, type PetRepository } from './petDatabase'
import {
  applyPetCommand,
  settlePetSources,
  type PetAccount,
  type PetCommand,
  type PetLearningSource,
} from './petPolicy'
import { collectPetSources, type PetSourceStorage } from './petSources'
export interface PetServiceResult {
  account: PetAccount
  warning: string | null
}
export function createPetService(
  repository: PetRepository = petRepository,
  storage: () => PetSourceStorage = () => window.localStorage,
  now = () => new Date().toISOString(),
) {
  return {
    async run(
      profileId: string,
      command?: PetCommand,
      operationId?: string,
      extraSources: PetLearningSource[] = [],
    ): Promise<PetServiceResult> {
      let sources: PetLearningSource[] = [],
        warning: string | null = null
      try {
        const collected = collectPetSources(storage(), profileId)
        sources = collected.sources
        warning = collected.warnings.join(' ') || null
      } catch {
        warning = '学习记录暂时无法读取，相关积分稍后再结算。'
      }
      const at = now()
      const account = await repository.update(profileId, (current) => {
        let next = settlePetSources(current, [...sources, ...extraSources], at)
        if (command) {
          if (!operationId) throw new Error('缺少操作编号。')
          next = applyPetCommand(next, command, operationId, at)
        }
        return next
      })
      return { account, warning }
    },
  }
}
export const petService = createPetService()
