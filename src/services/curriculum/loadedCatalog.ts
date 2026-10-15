import { computed, shallowRef } from 'vue'
import type { ProductionIndex } from '@/types'

const catalog = shallowRef<ProductionIndex | null>(null)

// Textbook pages initialize the approved catalog before building their quests.
// Shared activity players can read that catalog without making stories import it.
export const loadedCurriculumCatalog = computed(() => catalog.value)
export function registerLoadedCurriculumCatalog(index: ProductionIndex): void {
  catalog.value = index
}
