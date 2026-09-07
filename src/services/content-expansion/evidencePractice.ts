import { readingQuestionSeeds } from '@/data/content-expansion/reading-quest-seeds'
import { chineseTrainingSeeds } from '@/data/content-expansion/chinese-training-seeds'
import type { ReadingStory } from '@/types/reading-islands'

export interface EvidencePractice {
  title: string
  prompt: string
  answer: string
  explanation: string
  paragraphs: { sentences: { id: string; text: string }[] }[]
  evidenceIds: string[]
  sequence: { id: string; text: string }[]
  sequenceHint: string
}
const normalize = (text: string) => text.replace(/[\s\p{P}]/gu, '')

function build(input: {
  title: string
  text: string
  prompt: string
  answer: string
  evidence: string
  explanation: string
  sequence?: string[]
  sequenceHint?: string
}): EvidencePractice | null {
  const paragraphs = input.text
    .split(/\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p, pi) => ({
      sentences: (p.match(/[^。！？]+(?:[。！？]+[”’」』]?|$)/gu) ?? []).map((text, si) => ({
        id: `p${pi}s${si}`,
        text,
      })),
    }))
  const sentences = paragraphs.flatMap((p) => p.sentences)
  const source = sentences.map((s) => normalize(s.text)).join('')
  const evidence = normalize(input.evidence)
  const start = source.indexOf(evidence)
  if (!evidence || start < 0) return null
  let offset = 0
  const evidenceIds = sentences
    .filter((s) => {
      const from = offset
      offset += normalize(s.text).length
      return from < start + evidence.length && offset > start
    })
    .map((s) => s.id)
  // A source-ordered passage task is not presented as a unique causal interpretation.
  const sequence =
    input.sequence ??
    sentences
      .filter((s) => normalize(s.text).length > 5)
      .slice(0, 3)
      .map((s) => s.text)
  if (sequence.length < 3 || new Set(sequence).size !== sequence.length) return null
  return {
    title: input.title,
    prompt: input.prompt,
    answer: input.answer,
    explanation: input.explanation,
    paragraphs,
    evidenceIds,
    sequence: sequence.map((text, i) => ({ id: `order-${i}`, text })),
    sequenceHint: input.sequenceHint ?? '按这些句子在原文中的顺序排列，再说说先写什么、后写什么。',
  }
}

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
  if (seed) return build({ ...seed, title, text })
  const reasoning = chineseTrainingSeeds.find(
    (s) => title.includes(s.title) && normalize(text).includes(normalize(s.evidence)),
  )
  return reasoning
    ? build({ title, text, evidence: reasoning.evidence, ...reasoning.reasoning })
    : null
}

const storyEvidence: Record<string, string> = {
  'zh-leaf-letter': '小禾想把黄叶送给生病在家的小安',
  'zh-rainy-bench': '小熊拿来一块干布',
  'zh-shadow-train': '小米看见了，想来当第三节车厢',
  'zh-library-sign': '她只告诉大家不要做什么，却没有告诉大家应该怎样做',
  'zh-small-bridge': '圆圆把两本书移近',
  'zh-night-post': '妈妈这几天忙，我想和她一起看一本书',
}

export function storyEvidencePractice(story: ReadingStory): EvidencePractice | null {
  if (story.language !== 'chinese' || !storyEvidence[story.id]) return null
  return build({
    title: story.title,
    text: story.paragraphs.join('\n'),
    evidence: storyEvidence[story.id]!,
    prompt: story.detail.prompt,
    answer: story.detail.answers[0]!,
    explanation: story.detail.explanation,
    sequence: story.sequence.events,
    sequenceHint: story.sequence.hint,
  })
}
