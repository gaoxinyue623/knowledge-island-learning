import type { TextbookIdentity } from '@/types'

function normalizeSegment(value: string): string {
  const normalized = value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
  return normalized.replace(/^-+|-+$/g, '') || 'UNKNOWN'
}

function normalizeSubjectCode(subjectCode: string): string {
  const normalized = normalizeSegment(subjectCode)
  if (normalized === 'CHINESE' || normalized === 'CHN') return 'CHI'
  if (normalized === 'MATH' || normalized === 'MATHEMATICS') return 'MAT'
  if (normalized === 'ENGLISH' || normalized === 'ENG') return 'ENG'
  return normalized
}

function normalizeStage(stage: TextbookIdentity['stage']): string {
  return stage === 'primary' ? 'PRI' : normalizeSegment(stage)
}

function normalizeEditionYear(editionYear: number | undefined): string {
  return editionYear === undefined ? 'UNKNOWN' : String(editionYear)
}

/**
 * Builds the stable textbook identity key used by imports and duplicate checks.
 * Missing edition years intentionally remain UNKNOWN instead of being guessed.
 */
export function buildTextbookIdentityKey(identity: TextbookIdentity): string {
  const seriesSegment = identity.seriesCode ? `${normalizeSegment(identity.seriesCode)}-` : ''
  return [
    normalizeStage(identity.stage),
    normalizeSubjectCode(identity.subjectCode),
    normalizeSegment(identity.publisherCode),
    `G${identity.grade}`,
    `S${identity.semester}`,
    seriesSegment ? `${seriesSegment.slice(0, -1)}` : undefined,
    normalizeEditionYear(identity.editionYear),
  ]
    .filter((segment): segment is string => Boolean(segment))
    .join('-')
}
