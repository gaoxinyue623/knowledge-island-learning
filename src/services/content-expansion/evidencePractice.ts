import { readingQuestionSeeds } from '@/data/content-expansion/reading-quest-seeds'
import { chineseTrainingSeeds } from '@/data/content-expansion/chinese-training-seeds'
import {
  buildEvidencePractice,
  type EvidencePractice,
} from '@/services/reading-islands/storyEvidencePractice'
export { storyEvidencePractice } from '@/services/reading-islands/storyEvidencePractice'
export type { EvidencePractice } from '@/services/reading-islands/storyEvidencePractice'

const normalize = (text: string) => text.replace(/[\s\p{P}]/gu, '')

export function textbookEvidencePractice(
  title: string,
  text: string,
  textbookId: string,
): EvidencePractice | null {
  const titleKey = normalize(title.replace(/^\d+\s*/, ''))
  const sourceLines: string[] = []
  for (const line of text.replace(/\*\*/g, '').split(/\r?\n/)) {
    const value = line.trim()
    // Teaching notes and appended exercises are not evidence from the passage.
    if (
      /^(?:课后练习|小练习|学习重点|学习目标|附录|识字表|写字表|词语表)[：:（(\s]|^(?:附录|识字表|写字表|词语表)$/.test(
        value,
      )
    )
      break
    if (
      normalize(value.replace(/^\d+\s*/, '')) === titleKey ||
      /^(?:课本原文[（(:：]|教材页码|来源[：:])/.test(value)
    )
      continue
    sourceLines.push(line)
  }
  text = sourceLines.join('\n').trim()
  const seed = readingQuestionSeeds.find(
    (s) =>
      title.includes(s.title) &&
      (!s.textbookId || s.textbookId === textbookId) &&
      normalize(text).includes(normalize(s.evidence)),
  )
  if (seed) return buildEvidencePractice({ ...seed, title, text })
  const reasoning = chineseTrainingSeeds.find(
    (s) => title.includes(s.title) && normalize(text).includes(normalize(s.evidence)),
  )
  return reasoning
    ? buildEvidencePractice({ title, text, evidence: reasoning.evidence, ...reasoning.reasoning })
    : null
}
