import type { LearningMapVisual, LearningMapTextbook, UnitIsland } from '@/types'

const MATH_BIOMES = [
  { biome: 'mist-forest', landmark: 'treehouse', decorationSet: 'leafy-path' },
  { biome: 'sunny-port', landmark: 'lighthouse', decorationSet: 'paper-sails' },
  { biome: 'starlight-valley', landmark: 'observatory', decorationSet: 'star-dots' },
  { biome: 'mechanical-city', landmark: 'clock-tower', decorationSet: 'gear-garden' },
  { biome: 'cloud-garden', landmark: 'sky-bridge', decorationSet: 'soft-clouds' },
] as const

const DEFAULT_BIOMES = [
  { biome: 'mist-forest', landmark: 'treehouse', decorationSet: 'leafy-path' },
  { biome: 'sunny-port', landmark: 'lighthouse', decorationSet: 'paper-sails' },
  { biome: 'starlight-valley', landmark: 'observatory', decorationSet: 'star-dots' },
] as const

export function getUnitTheme(subject: LearningMapTextbook['subject'], unitIndex: number) {
  const themes = subject === 'MATH' ? MATH_BIOMES : DEFAULT_BIOMES
  return themes[unitIndex % themes.length]
}

export function getLessonVisual(
  subject: LearningMapTextbook['subject'],
  lessonIndex: number,
): LearningMapVisual {
  const variants =
    subject === 'MATH'
      ? ['number-station', 'pattern-garden', 'calculation-workshop', 'measurement-dock']
      : ['story-clearing', 'reading-grove', 'language-harbor', 'word-workshop']
  return {
    variant: variants[lessonIndex % variants.length],
    iconKey: subject === 'MATH' ? 'route' : subject === 'CHINESE' ? 'book-open' : 'navigation',
  }
}

export function getKnowledgeVisual(
  subject: LearningMapTextbook['subject'],
  lessonIndex: number,
  nodeIndex: number,
): LearningMapVisual {
  const variants =
    subject === 'MATH'
      ? ['number-beacon', 'pattern-tile', 'measure-stone', 'logic-lamp']
      : ['knowledge-beacon', 'story-stone', 'word-lamp', 'idea-leaf']
  return {
    variant: variants[(lessonIndex + nodeIndex) % variants.length],
    iconKey:
      subject === 'MATH' ? 'lightbulb' : subject === 'CHINESE' ? 'book-marked' : 'navigation',
  }
}

export function applyUnitTheme<T extends Pick<UnitIsland, 'theme'>>(
  island: T,
  subject: LearningMapTextbook['subject'],
  unitIndex: number,
): T {
  island.theme = { ...getUnitTheme(subject, unitIndex) }
  return island
}
