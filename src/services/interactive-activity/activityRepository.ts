import { goldenContentExpansionBundles } from '@/data/content-expansion'
import { productionConfig } from '@/config/production'
import { isProductionInteractiveActivity } from '@/services/production-readiness'
import type { ContentExpansionDataset, Id, InteractiveActivity } from '@/types'

export interface InteractiveActivityRepository {
  getById(id: Id, dataset?: ContentExpansionDataset): Promise<InteractiveActivity | null>
  listByKnowledgePoint(
    knowledgePointId: Id,
    dataset?: ContentExpansionDataset,
  ): Promise<InteractiveActivity[]>
  listAll(dataset?: ContentExpansionDataset): Promise<InteractiveActivity[]>
}

export interface InteractiveActivityRepositoryOptions {
  records?: InteractiveActivity[]
}

function readable(record: InteractiveActivity, dataset: ContentExpansionDataset): boolean {
  if (dataset === 'profile') return isProductionInteractiveActivity(record)
  return !productionConfig.isProduction
}

function sortActivities(records: readonly InteractiveActivity[]): InteractiveActivity[] {
  return records
    .filter((record) => record.id && record.knowledgePointId)
    .slice()
    .sort((left, right) => left.sort - right.sort || left.id.localeCompare(right.id))
    .map((record) => structuredClone(record) as InteractiveActivity)
}

export class StaticInteractiveActivityRepository implements InteractiveActivityRepository {
  private readonly records: InteractiveActivity[]

  constructor(options: InteractiveActivityRepositoryOptions = {}) {
    this.records =
      options.records ?? goldenContentExpansionBundles.flatMap((bundle) => bundle.activities)
  }

  async getById(
    id: Id,
    dataset: ContentExpansionDataset = 'profile',
  ): Promise<InteractiveActivity | null> {
    const record = this.records.find((candidate) => candidate.id === id)
    return record && readable(record, dataset) ? (sortActivities([record])[0] ?? null) : null
  }

  async listByKnowledgePoint(
    knowledgePointId: Id,
    dataset: ContentExpansionDataset = 'profile',
  ): Promise<InteractiveActivity[]> {
    return sortActivities(
      this.records.filter(
        (record) => record.knowledgePointId === knowledgePointId && readable(record, dataset),
      ),
    )
  }

  async listAll(dataset: ContentExpansionDataset = 'profile'): Promise<InteractiveActivity[]> {
    return sortActivities(this.records.filter((record) => readable(record, dataset)))
  }
}

export const interactiveActivityRepository = new StaticInteractiveActivityRepository()
