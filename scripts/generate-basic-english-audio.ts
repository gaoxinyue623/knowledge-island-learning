/** Optional asset rebuild on macOS; runtime playback needs no speech service or API key. */
import { spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync, unlinkSync } from 'node:fs'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'
import { readingStories } from '../src/data/reading-islands'
import { readingStorySpeechBlocks } from '../src/services/reading-islands/readingStoryAdapter'
import { buildEnglishReadingSegments } from '../src/services/lesson-player/englishReading'

if (process.platform !== 'darwin')
  throw new Error('Rebuilding these optional audio assets requires macOS say and afconvert.')
const texts = new Set(
  readingStories
    .filter((story) => story.language === 'english')
    .flatMap((story) =>
      buildEnglishReadingSegments(readingStorySpeechBlocks(story)).map((segment) => segment.text),
    ),
)
for (const text of [
  'Put the ball under the desk.',
  'The ball is under the desk.',
  'Put the book on the desk.',
  'The book is on the desk.',
  'Put the teddy bear in the box.',
  'The teddy bear is in the box.',
])
  texts.add(text)
const output = resolve('public/audio/basic-english')
mkdirSync(output, { recursive: true })
const manifest: Record<string, string> = {}
let count = 0
for (const text of texts) {
  const id = createHash('sha256').update(text).digest('hex').slice(0, 20)
  const aiff = resolve(output, id + '.aiff'),
    m4a = resolve(output, id + '.m4a')
  const spoken = spawnSync('say', ['-v', 'Samantha', '-r', '145', '-o', aiff, text], {
    encoding: 'utf8',
  })
  if (spoken.status !== 0) throw new Error(spoken.stderr || 'Speech asset generation failed')
  const converted = spawnSync('afconvert', ['-f', 'm4af', '-d', 'aac', '-b', '64000', aiff, m4a], {
    encoding: 'utf8',
  })
  if (converted.status !== 0) throw new Error(converted.stderr || 'Audio conversion failed')
  unlinkSync(aiff)
  manifest[text] = '/audio/basic-english/' + id + '.m4a'
  if (++count % 20 === 0) console.info(`Prepared ${count}/${texts.size} basic English audio clips`)
}
writeFileSync(
  resolve('src/data/basic-english-audio.json'),
  JSON.stringify(manifest, null, 2) + '\n',
)
console.info(`Prepared ${count} local audio clips`)
