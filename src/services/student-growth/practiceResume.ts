import type { ReadingPracticeQuest } from '@/types/reading-quest'

export function practiceResumeHref(href: string, quest: ReadingPracticeQuest): string {
  const url = new URL(href, 'https://knowledge-island.local')
  if (!url.pathname.startsWith('/knowledge-point/')) return href
  url.searchParams.set('practiceMode', quest.training ? 'training' : 'foundation')
  if (quest.training) url.searchParams.set('practiceVariant', String(quest.training.variantIndex))
  else url.searchParams.delete('practiceVariant')
  return url.pathname + url.search + url.hash
}
export function requestedPracticeChoice(
  query: Record<string, unknown>,
): { mode: 'foundation' | 'training'; variant: number } | null {
  if (query.practiceMode === 'foundation') return { mode: 'foundation', variant: 0 }
  if (
    query.practiceMode !== 'training' ||
    typeof query.practiceVariant !== 'string' ||
    !/^[0-2]$/.test(query.practiceVariant)
  )
    return null
  return { mode: 'training', variant: Number(query.practiceVariant) }
}
