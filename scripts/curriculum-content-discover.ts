import { createCipheriv } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

import { gradeOneChineseUpperLessons, G1_PEP_CHINESE_S1_TEXTBOOK_ID } from '../src/data/curriculum'

const PEP_ORIGIN = 'https://www.pep.com.cn'
const PEP_SEARCH_ENDPOINT = `${PEP_ORIGIN}/was5/web/search`
const PEP_SEARCH_KEY = 'aaaabbbbccccdddd'
const DEFAULT_OUTPUT_PATH = 'src/data/curriculum/imported/g1-chinese-content-source-discovery.json'

interface DiscoveryCandidate {
  title: string
  url: string
}

interface DiscoveryRecord {
  lessonId: string
  lessonTitle: string
  query: string
  candidates: DiscoveryCandidate[]
  retrievedAt: string
  copyrightStatus: 'PENDING'
  verificationStatus: 'UNVERIFIED'
  note: string
}

interface DiscoveryArtifact {
  schemaVersion: 1
  textbookId: string
  generatedAt: string
  source: {
    id: string
    title: string
    url: string
    copyrightStatus: 'PENDING'
    verificationStatus: 'UNVERIFIED'
  }
  records: DiscoveryRecord[]
}

function encryptPepSearchWord(value: string): string {
  const cipher = createCipheriv('aes-128-ecb', Buffer.from(PEP_SEARCH_KEY), null)
  cipher.setAutoPadding(true)
  return Buffer.concat([cipher.update(Buffer.from(value, 'utf8')), cipher.final()]).toString(
    'base64',
  )
}

function decodeHtmlEntities(value: string): string {
  const namedEntities: Record<string, string> = {
    '&amp;': '&',
    '&apos;': "'",
    '&gt;': '>',
    '&lt;': '<',
    '&nbsp;': ' ',
    '&quot;': '"',
  }
  return value
    .replace(/&(?:amp|apos|gt|lt|nbsp|quot);/g, (entity) => namedEntities[entity] ?? entity)
    .replace(/&#(\d+);/g, (_match, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_match, code: string) =>
      String.fromCodePoint(Number.parseInt(code, 16)),
    )
}

function htmlText(value: string): string {
  return decodeHtmlEntities(value.replace(/<[^>]+>/g, ' '))
    .replace(/[\t\r\n ]+/g, ' ')
    .trim()
}

function normalizedTitle(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^第?[0-9一二三四五六七八九十百]+[课篇]?/, '')
    .replace(/[^a-z0-9\u4e00-\u9fff]/gi, '')
}

const nonTextResultMarkers = ['教学设计', '课堂实录', '教案', '评价表', '测试题', '教材解析']

function pepUrl(value: string): string | null {
  try {
    const url = new URL(decodeHtmlEntities(value), PEP_ORIGIN)
    const hostname = url.hostname.toLowerCase()
    if (url.protocol !== 'https:') return null
    if (hostname !== 'pep.com.cn' && !hostname.endsWith('.pep.com.cn')) return null
    if (url.pathname.startsWith('/was5/')) return null
    return url.toString()
  } catch {
    return null
  }
}

export function extractPepSearchCandidates(
  html: string,
  lessonTitle: string,
  maxResults = 10,
): DiscoveryCandidate[] {
  const candidates: DiscoveryCandidate[] = []
  const seenUrls = new Set<string>()
  const normalizedLessonTitle = normalizedTitle(lessonTitle)
  const linkPattern = /<a\b[^>]*href\s*=\s*(['"])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi
  for (const match of html.matchAll(linkPattern)) {
    const url = pepUrl(match[2] ?? '')
    if (!url || seenUrls.has(url)) continue
    const title = htmlText(match[3] ?? '')
    if (!title || title.length > 160) continue
    if (!normalizedTitle(title).includes(normalizedLessonTitle)) continue
    if (nonTextResultMarkers.some((marker) => title.includes(marker))) continue
    seenUrls.add(url)
    candidates.push({ title, url })
    if (candidates.length >= maxResults) break
  }
  return candidates
}

async function discoverTitle(
  title: string,
  maxResults: number,
  timeoutMs: number,
): Promise<DiscoveryCandidate[]> {
  const searchUrl = new URL(PEP_SEARCH_ENDPOINT)
  searchUrl.searchParams.set('channelid', '296171')
  searchUrl.searchParams.set('orderby', '-crtime')
  searchUrl.searchParams.set('page', '1')
  searchUrl.searchParams.set('perpage', String(maxResults))
  searchUrl.searchParams.set('encode', 'true')
  searchUrl.searchParams.set('searchword', encryptPepSearchWord(`'${title}' `))
  const response = await fetch(searchUrl, {
    headers: {
      accept: 'text/html',
      'user-agent': 'knowledge-island-content-discovery/1.0',
    },
    signal: AbortSignal.timeout(timeoutMs),
  })
  if (!response.ok) throw new Error(`PEP_SEARCH_HTTP_${response.status}`)
  const html = await response.text()
  return extractPepSearchCandidates(html, title, maxResults)
}

async function mapWithConcurrency<T, R>(
  values: readonly T[],
  concurrency: number,
  mapper: (value: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = []
  let nextIndex = 0
  async function worker(): Promise<void> {
    while (nextIndex < values.length) {
      const currentIndex = nextIndex
      nextIndex += 1
      const value = values[currentIndex]
      if (value !== undefined) results[currentIndex] = await mapper(value)
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, values.length) }, worker))
  return results
}

function optionValue(args: readonly string[], name: string): string | undefined {
  const index = args.indexOf(name)
  const value = index >= 0 ? args[index + 1] : undefined
  return value && !value.startsWith('--') ? value : undefined
}

function positiveInteger(value: string | undefined, fallback: number): number | undefined {
  if (value === undefined) return fallback
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
}

function printUsage(): void {
  console.log(`
Usage:
  npm run curriculum:content:discover -- [options]

Searches lesson titles on the official pep.com.cn search service and writes
source URLs only. It never copies page正文 and never changes CourseContent.

Options:
  --max-results <number>  Candidates per lesson (default: 5)
  --timeout-ms <number>  Request timeout (default: 15000)
  --output <path>        Candidate index path
  --apply                Write the candidate source index
  --help
`)
}

async function main(): Promise<number> {
  const args = process.argv.slice(2)
  if (args.includes('--help')) {
    printUsage()
    return 0
  }
  const maxResults = positiveInteger(optionValue(args, '--max-results'), 5)
  const timeoutMs = positiveInteger(optionValue(args, '--timeout-ms'), 15_000)
  if (maxResults === undefined || timeoutMs === undefined) {
    console.error('参数错误：--max-results 和 --timeout-ms 必须是正整数。')
    return 1
  }

  const uniqueTitles = [...new Set(gradeOneChineseUpperLessons.map((lesson) => lesson.title))]
  const retrievedAt = new Date().toISOString()
  const discovered = await mapWithConcurrency(uniqueTitles, 2, async (lessonTitle) => {
    try {
      const candidates = await discoverTitle(lessonTitle, maxResults, timeoutMs)
      return { lessonTitle, candidates, error: undefined }
    } catch (error) {
      return {
        lessonTitle,
        candidates: [],
        error: error instanceof Error ? error.message : String(error),
      }
    }
  })
  const candidatesByTitle = new Map(discovered.map((item) => [item.lessonTitle, item]))
  const records: DiscoveryRecord[] = gradeOneChineseUpperLessons.map((lesson) => {
    const result = candidatesByTitle.get(lesson.title)
    return {
      lessonId: lesson.id,
      lessonTitle: lesson.title,
      query: `'${lesson.title}'`,
      candidates: result?.candidates ?? [],
      retrievedAt,
      copyrightStatus: 'PENDING',
      verificationStatus: 'UNVERIFIED',
      note: result?.error
        ? `官方搜索请求失败：${result.error}`
        : '仅为课名来源候选；不能证明页面正文可复制或可发布。',
    }
  })
  const artifact: DiscoveryArtifact = {
    schemaVersion: 1,
    textbookId: G1_PEP_CHINESE_S1_TEXTBOOK_ID,
    generatedAt: retrievedAt,
    source: {
      id: 'G1_PEP_CHINESE_S1_OFFICIAL_SEARCH_DISCOVERY',
      title: '人民教育出版社官方站课名搜索候选索引',
      url: PEP_SEARCH_ENDPOINT,
      copyrightStatus: 'PENDING',
      verificationStatus: 'UNVERIFIED',
    },
    records,
  }
  const matchedCount = records.filter((record) => record.candidates.length > 0).length
  const failedCount = records.filter((record) => record.note.startsWith('官方搜索请求失败')).length
  console.log(
    `lessons=${records.length} matched=${matchedCount} noMatch=${records.length - matchedCount - failedCount} failed=${failedCount}`,
  )

  if (!args.includes('--apply')) {
    console.log('write=SKIPPED (dry-run；需要 --apply 才会写入来源索引)')
    return 0
  }
  const outputPath = resolve(process.cwd(), optionValue(args, '--output') ?? DEFAULT_OUTPUT_PATH)
  mkdirSync(dirname(outputPath), { recursive: true })
  writeFileSync(outputPath, `${JSON.stringify(artifact, null, 2)}\n`, 'utf8')
  console.log(`write=APPLIED ${outputPath}`)
  console.log('content=NOT_COPIED copyrightStatus=PENDING verificationStatus=UNVERIFIED')
  return 0
}

process.exitCode = await main()
