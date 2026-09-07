import type { LessonContentBlockViewModel } from '@/types'

export type EnglishReadingSection = 'dialogue' | 'chant' | 'story' | 'words'
export interface EnglishReadingSegment {
  id: string
  text: string
  section: EnglishReadingSection
  speaker?: string
}

const readingTypes = new Set(['intro', 'concept', 'explanation', 'example', 'summary'])
const han = /\p{Script=Han}/u

function splitSentences(text: string): string[] {
  return (text.match(/[^.!?]+(?:[.!?]+[”"']?|$)/g) ?? [])
    .flatMap((sentence) => {
      const chunks: string[] = []
      let chunk = ''
      for (const word of sentence.trim().split(/\s+/)) {
        if (chunk.length + 1 + word.length > 160 && chunk) {
          chunks.push(chunk)
          chunk = ''
        }
        chunk += `${chunk ? ' ' : ''}${word}`
      }
      if (chunk) chunks.push(chunk)
      return chunks
    })
    .filter((text) => /[a-z]/i.test(text))
}

// This is a read-only projection of the displayed blocks, not a second textbook dataset.
export function buildEnglishReadingSegments(
  blocks: readonly LessonContentBlockViewModel[],
): EnglishReadingSegment[] {
  const segments: EnglishReadingSegment[] = []
  for (const block of [...blocks].sort((a, b) => a.sort - b.sort || a.id.localeCompare(b.id))) {
    if (!readingTypes.has(block.type)) continue
    let section: EnglishReadingSection = 'dialogue'
    const blockStart = segments.length
    const lines = [block.content ?? '', ...(block.paragraphs ?? []), ...(block.bullets ?? [])]
      .join('\n')
      .split(/\r?\n/)
    for (const [lineIndex, raw] of lines.entries()) {
      const line = raw.trim()
      if (!line || line === block.title) continue
      if (/^核心句型|^课后练习|^附录/.test(line)) break
      if (/^核心单词/.test(line) && segments.length > blockStart) break
      if (/^(?:Unit\s*\d+|Module\s*\d+|Page\s*\d+|Revision\s*\d+)/i.test(line)) {
        if (/单词/.test(line)) section = 'words'
        continue
      }
      if (/^(?:Ready[?？\s-]*Go!?|Listen,?\s*then point and say|Listen and learn)$/i.test(line)) {
        section = 'dialogue'
        continue
      }
      if (/^(?:Listen and chant|Chant)(?:\s|$|[:：])/i.test(line)) {
        section = 'chant'
        continue
      }
      if (/^Story\s*[:：]/i.test(line)) {
        section = 'story'
        continue
      }
      if (/^(?:本单元|核心)?单词|^Word list/i.test(line)) {
        section = 'words'
        if (/^Word list/i.test(line)) continue
      }
      if (/^(核心问答|拓展句型)/.test(line)) section = 'dialogue'
      // Vocabulary may be bilingual pairs on one line. Other Chinese-led lines are notes/translations.
      const vocabulary = /^(?:本单元|核心)?单词\s*[:：]/.test(line)
        ? line.replace(/^(?:本单元|核心)?单词\s*[:：]/, '')
        : line
      if (han.test(vocabulary[0] ?? '')) continue
      const parts = vocabulary.split(section === 'words' ? /[,，、；]/ : /[，、；]/)
      for (const [partIndex, part] of parts.entries()) {
        let text = part.replace(/^\s*(?:\d+[.)]\s*|[—–-]\s*)/, '').trim()
        if (han.test(text[0] ?? '') || !/^[A-Za-z“"‘]/.test(text)) continue
        let speaker: string | undefined
        const role = text.match(/^([A-Za-z][A-Za-z ’'-]{0,30})\s*[:：]\s*/)
        if (role) {
          speaker = role[1]
          text = text.slice(role[0].length)
        }
        const chineseStart = text.search(han)
        if (chineseStart >= 0) {
          const chinese = text.slice(chineseStart)
          text = text.slice(0, chineseStart).replace(/\s*\d+\s*$/, '')
          if (chinese.startsWith('恤')) text = text.replace(/\s*T$/, '')
        }
        text = text.replace(/[（(\s]+$/, '').trim()
        // Blank sentence frames are prompts, not finished sentences to model aloud.
        if (/_{2,}|\.{3}|…/.test(text)) continue
        for (const [sentenceIndex, sentence] of splitSentences(text).entries()) {
          segments.push({
            id: `${block.id}:${lineIndex}:${partIndex}:${sentenceIndex}`,
            text: sentence,
            section,
            ...(speaker ? { speaker } : {}),
          })
        }
      }
    }
  }
  return segments
}
