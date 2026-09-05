import { z } from 'zod'

import type {
  ContentSource,
  CourseContent,
  KnowledgePoint,
  Lesson,
  LessonKnowledgePointRelation,
} from '@/types'

export const CONTENT_INGESTION_SCHEMA_VERSION = 1 as const
export const DEFAULT_CONTENT_FETCH_MAX_BYTES = 2_000_000
export const DEFAULT_CONTENT_FETCH_TIMEOUT_MS = 15_000

export type ContentFetchSourceType = Extract<
  ContentSource['sourceType'],
  'TEXTBOOK' | 'PUBLIC_RESOURCE' | 'LICENSED_RESOURCE'
>

export interface ContentCatalog {
  textbookId: string
  lessons: readonly Lesson[]
  knowledgePoints: readonly KnowledgePoint[]
  lessonKnowledgePointRelations: readonly Pick<
    LessonKnowledgePointRelation,
    'lessonId' | 'knowledgePointId'
  >[]
}

export interface FetchedContentEntry {
  lessonTitle?: string
  knowledgePointId?: string
  title?: string
  text: string
}

export interface ParsedContentDocument {
  entries: FetchedContentEntry[]
  format: 'json' | 'html'
}

export interface ContentIngestionIssue {
  code: string
  severity: 'error' | 'warning'
  message: string
  entryIndex?: number
}

export interface ContentIngestionResult {
  schemaVersion: typeof CONTENT_INGESTION_SCHEMA_VERSION
  textbookId: string
  source: ContentSource
  fetchedAt: string
  records: CourseContent[]
  issues: ContentIngestionIssue[]
  matchedCount: number
  skippedCount: number
  duplicateCount: number
}

export interface FetchedContentDocumentInput {
  url: string
  contentType: string
  text: string
  retrievedAt?: string
}

export interface FetchContentOptions {
  fetcher?: typeof fetch
  timeoutMs?: number
  maxBytes?: number
}

const contentEntrySchema = z
  .object({
    lessonTitle: z.string().optional(),
    knowledgePointId: z.string().optional(),
    title: z.string().optional(),
    text: z.string().optional(),
    content: z.string().optional(),
    body: z.string().optional(),
  })
  .passthrough()

const jsonDocumentSchema = z.union([
  z.array(z.unknown()),
  z.object({ entries: z.array(z.unknown()) }),
  z.object({ items: z.array(z.unknown()) }),
  z.object({ lessons: z.array(z.unknown()) }),
])

function normalizeText(value: string): string {
  return value
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map((line) => line.replace(/[\t ]+/g, ' ').trim())
    .filter(Boolean)
    .join('\n')
    .trim()
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

function htmlToText(value: string): string {
  return normalizeText(
    decodeHtmlEntities(
      value
        .replace(
          /<\s*(script|style|noscript|template|svg|nav|footer|header|aside)\b[^>]*>[\s\S]*?<\/\s*\1\s*>/gi,
          '',
        )
        .replace(/<\s*br\s*\/?>/gi, '\n')
        .replace(/<\s*\/\s*(p|div|section|article|li|h[1-6])\s*>/gi, '\n')
        .replace(/<[^>]+>/g, ' '),
    ),
  )
}

function htmlAttributes(value: string): Record<string, string> {
  const attributes: Record<string, string> = {}
  const attributePattern = /([\w:-]+)\s*=\s*(["'])(.*?)\2/g
  for (const match of value.matchAll(attributePattern)) {
    const name = match[1]
    const attributeValue = match[3]
    if (name && attributeValue) attributes[name.toLowerCase()] = decodeHtmlEntities(attributeValue)
  }
  return attributes
}

function parseJsonEntry(
  value: unknown,
  index: number,
): {
  entry?: FetchedContentEntry
  issue?: ContentIngestionIssue
} {
  const parsed = contentEntrySchema.safeParse(value)
  if (!parsed.success) {
    return {
      issue: {
        code: 'CONTENT_ENTRY_SCHEMA_INVALID',
        severity: 'error',
        message: `第 ${index + 1} 条内容不符合导入格式。`,
        entryIndex: index,
      },
    }
  }

  const valueText = parsed.data.text ?? parsed.data.content ?? parsed.data.body
  const text = typeof valueText === 'string' ? normalizeText(valueText) : ''
  const lessonTitle = parsed.data.lessonTitle ?? parsed.data.title
  if (!text || (!lessonTitle && !parsed.data.knowledgePointId)) {
    return {
      issue: {
        code: 'CONTENT_ENTRY_REQUIRED_FIELDS_MISSING',
        severity: 'error',
        message: `第 ${index + 1} 条内容缺少课名/知识点 ID 或正文。`,
        entryIndex: index,
      },
    }
  }

  return {
    entry: {
      lessonTitle: lessonTitle?.trim() || undefined,
      knowledgePointId: parsed.data.knowledgePointId?.trim() || undefined,
      title: parsed.data.title?.trim() || undefined,
      text,
    },
  }
}

export function parseJsonContentDocument(value: unknown): {
  entries: FetchedContentEntry[]
  issues: ContentIngestionIssue[]
} {
  const parsed = jsonDocumentSchema.safeParse(value)
  if (!parsed.success) {
    return {
      entries: [],
      issues: [
        {
          code: 'CONTENT_DOCUMENT_SCHEMA_INVALID',
          severity: 'error',
          message: 'JSON 文档必须是数组，或包含 entries/items/lessons 数组。',
        },
      ],
    }
  }

  const values = Array.isArray(parsed.data)
    ? parsed.data
    : 'entries' in parsed.data
      ? parsed.data.entries
      : 'items' in parsed.data
        ? parsed.data.items
        : parsed.data.lessons
  const entries: FetchedContentEntry[] = []
  const issues: ContentIngestionIssue[] = []
  values.forEach((value, index) => {
    const result = parseJsonEntry(value, index)
    if (result.entry) entries.push(result.entry)
    if (result.issue) issues.push(result.issue)
  })
  return { entries, issues }
}

function parseHtmlContentDocument(text: string): {
  entries: FetchedContentEntry[]
  issues: ContentIngestionIssue[]
} {
  const entries: FetchedContentEntry[] = []
  const issues: ContentIngestionIssue[] = []
  const sectionPattern = /<\s*(section|article)\b([^>]*)>([\s\S]*?)<\/\s*\1\s*>/gi

  for (const match of text.matchAll(sectionPattern)) {
    const attributes = htmlAttributes(match[2] ?? '')
    const lessonTitle =
      attributes['data-lesson-title'] ?? attributes['data-title'] ?? attributes['aria-label']
    const knowledgePointId = attributes['data-knowledge-point-id']
    if (!lessonTitle && !knowledgePointId) continue
    const content = htmlToText(match[3] ?? '')
    if (!content) {
      issues.push({
        code: 'HTML_CONTENT_EMPTY',
        severity: 'error',
        message: `HTML 标记的内容为空：${lessonTitle ?? knowledgePointId}。`,
      })
      continue
    }
    entries.push({ lessonTitle, knowledgePointId, text: content })
  }

  if (entries.length === 0) {
    issues.push({
      code: 'HTML_SOURCE_NOT_SEGMENTED',
      severity: 'error',
      message:
        'HTML 没有找到带 data-lesson-title 或 data-knowledge-point-id 的 section/article；为避免把目录页、导航或整页噪声当成课文，已停止导入。',
    })
  }
  return { entries, issues }
}

export function parseFetchedContentDocument(input: FetchedContentDocumentInput): {
  document: ParsedContentDocument
  issues: ContentIngestionIssue[]
} {
  const contentType = input.contentType.toLowerCase()
  const looksLikeJson = contentType.includes('json') || /^\s*[{[]/.test(input.text)
  if (looksLikeJson) {
    try {
      const parsed = parseJsonContentDocument(JSON.parse(input.text))
      return {
        document: { entries: parsed.entries, format: 'json' },
        issues: parsed.issues,
      }
    } catch {
      return {
        document: { entries: [], format: 'json' },
        issues: [
          {
            code: 'CONTENT_DOCUMENT_JSON_INVALID',
            severity: 'error',
            message: '远程内容不是有效 JSON。',
          },
        ],
      }
    }
  }

  const parsed = parseHtmlContentDocument(input.text)
  return {
    document: { entries: parsed.entries, format: 'html' },
    issues: parsed.issues,
  }
}

export async function fetchContentDocument(
  url: string,
  options: FetchContentOptions = {},
): Promise<FetchedContentDocumentInput> {
  const fetcher = options.fetcher ?? fetch
  const timeoutMs = options.timeoutMs ?? DEFAULT_CONTENT_FETCH_TIMEOUT_MS
  const maxBytes = options.maxBytes ?? DEFAULT_CONTENT_FETCH_MAX_BYTES
  const response = await fetcher(url, {
    headers: {
      accept: 'application/json, text/html;q=0.9',
      'user-agent': 'knowledge-island-content-ingestion/1.0',
    },
    signal: AbortSignal.timeout(timeoutMs),
  })
  if (!response.ok) throw new Error(`CONTENT_FETCH_HTTP_${response.status}`)
  const contentLength = response.headers.get('content-length')
  if (contentLength && Number(contentLength) > maxBytes) {
    throw new Error('CONTENT_FETCH_TOO_LARGE')
  }
  const text = await response.text()
  if (new TextEncoder().encode(text).byteLength > maxBytes) {
    throw new Error('CONTENT_FETCH_TOO_LARGE')
  }
  return {
    url: response.url || url,
    contentType: response.headers.get('content-type') ?? '',
    text,
    retrievedAt: new Date().toISOString(),
  }
}

export function validateContentSourceUrl(url: string, allowedHosts: readonly string[]): string[] {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return ['source URL 不是有效的 URL。']
  }
  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return ['source URL 只允许使用 HTTP 或 HTTPS。']
  }
  const hostname = parsed.hostname.toLowerCase()
  const allowed = allowedHosts.some((host) => {
    const normalizedHost = host
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/\/$/, '')
    return hostname === normalizedHost || hostname.endsWith(`.${normalizedHost}`)
  })
  return allowed ? [] : [`source host 不在允许名单中：${hostname}。`]
}

export function validateContentPersistencePolicy(
  source: Pick<ContentSource, 'copyrightStatus' | 'license'>,
  authorizationReference?: string,
): string[] {
  const issues: string[] = []
  if (source.copyrightStatus !== 'CLEARED') {
    issues.push('只有 copyrightStatus=CLEARED 的来源可以使用 --apply 写入课文正文。')
  }
  if (!source.license?.trim()) issues.push('--apply 必须提供来源许可说明 --license。')
  if (!authorizationReference?.trim()) {
    issues.push('--apply 必须提供批次授权凭据引用 --authorization-ref。')
  }
  return issues
}

function normalizeLessonTitle(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^第?[0-9一二三四五六七八九十百]+[课篇]?/, '')
    .replace(/[^a-z0-9\u4e00-\u9fff]/gi, '')
}

function stableHash(value: string): string {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

export function createStableContentSourceId(url: string): string {
  return `FETCHED_CONTENT_SOURCE_${stableHash(url)}`
}

function resolveLesson(
  entry: FetchedContentEntry,
  catalog: ContentCatalog,
): { lesson?: Lesson; knowledgePoint?: KnowledgePoint; issue?: ContentIngestionIssue } {
  const lessonById = new Map(catalog.lessons.map((lesson) => [lesson.id, lesson]))
  const knowledgePointById = new Map(
    catalog.knowledgePoints.map((knowledgePoint) => [knowledgePoint.id, knowledgePoint]),
  )
  const lessonIdByKnowledgePointId = new Map(
    catalog.lessonKnowledgePointRelations.map((relation) => [
      relation.knowledgePointId,
      relation.lessonId,
    ]),
  )

  if (entry.knowledgePointId) {
    const knowledgePoint = knowledgePointById.get(entry.knowledgePointId)
    const lessonId = lessonIdByKnowledgePointId.get(entry.knowledgePointId)
    const lesson = lessonId ? lessonById.get(lessonId) : undefined
    if (!knowledgePoint || !lesson) {
      return {
        issue: {
          code: 'CONTENT_KNOWLEDGE_POINT_NOT_FOUND',
          severity: 'error',
          message: `找不到知识点 ID：${entry.knowledgePointId}。`,
        },
      }
    }
    if (
      entry.lessonTitle &&
      normalizeLessonTitle(entry.lessonTitle) !== normalizeLessonTitle(lesson.title)
    ) {
      return {
        issue: {
          code: 'CONTENT_LESSON_KNOWLEDGE_POINT_MISMATCH',
          severity: 'error',
          message: `课名与知识点 ID 不匹配：${entry.lessonTitle} / ${entry.knowledgePointId}。`,
        },
      }
    }
    return { lesson, knowledgePoint }
  }

  const normalizedTitle = normalizeLessonTitle(entry.lessonTitle ?? '')
  const matches = catalog.lessons.filter(
    (lesson) => normalizeLessonTitle(lesson.title) === normalizedTitle,
  )
  if (matches.length !== 1) {
    return {
      issue: {
        code: matches.length === 0 ? 'CONTENT_LESSON_NOT_FOUND' : 'CONTENT_LESSON_AMBIGUOUS',
        severity: 'error',
        message:
          matches.length === 0
            ? `找不到课名：${entry.lessonTitle ?? '未提供'}。`
            : `课名匹配到多个课程：${entry.lessonTitle ?? '未提供'}。`,
      },
    }
  }
  const lesson = matches[0]
  const relation = catalog.lessonKnowledgePointRelations.find(
    (candidate) => candidate.lessonId === lesson.id,
  )
  const knowledgePoint = relation ? knowledgePointById.get(relation.knowledgePointId) : undefined
  if (!knowledgePoint) {
    return {
      issue: {
        code: 'CONTENT_LESSON_MAPPING_NOT_FOUND',
        severity: 'error',
        message: `课程没有可用的知识点映射：${lesson.title}。`,
      },
    }
  }
  return { lesson, knowledgePoint }
}

export function buildCourseContentCandidates(options: {
  catalog: ContentCatalog
  source: ContentSource
  sourceUrl: string
  fetchedAt: string
  entries: readonly FetchedContentEntry[]
  existingContents?: readonly CourseContent[]
  parseIssues?: readonly ContentIngestionIssue[]
}): ContentIngestionResult {
  const issues = [...(options.parseIssues ?? [])]
  const candidatesByKnowledgePoint = new Map<
    string,
    {
      lesson: Lesson
      knowledgePoint: KnowledgePoint
      text: string
      hash: string
      entryIndex: number
    }
  >()
  let duplicateCount = 0
  let skippedCount = 0

  for (const [entryIndex, entry] of options.entries.entries()) {
    const text = normalizeText(entry.text)
    if (!text) {
      skippedCount += 1
      issues.push({
        code: 'CONTENT_TEXT_EMPTY',
        severity: 'error',
        message: `第 ${entryIndex + 1} 条内容正文为空。`,
        entryIndex,
      })
      continue
    }
    const resolved = resolveLesson(entry, options.catalog)
    if (!resolved.lesson || !resolved.knowledgePoint) {
      skippedCount += 1
      if (resolved.issue) issues.push({ ...resolved.issue, entryIndex })
      continue
    }

    const textHash = stableHash(text)
    const existing = candidatesByKnowledgePoint.get(resolved.knowledgePoint.id)
    if (existing) {
      if (existing.hash === textHash) {
        duplicateCount += 1
        issues.push({
          code: 'CONTENT_DUPLICATE_ENTRY',
          severity: 'warning',
          message: `重复内容已合并：${resolved.lesson.title}。`,
          entryIndex,
        })
      } else {
        skippedCount += 1
        issues.push({
          code: 'CONTENT_CONFLICTING_DUPLICATE',
          severity: 'error',
          message: `同一课程出现两份不同正文，已拒绝自动选择：${resolved.lesson.title}。`,
          entryIndex,
        })
      }
      continue
    }
    candidatesByKnowledgePoint.set(resolved.knowledgePoint.id, {
      lesson: resolved.lesson,
      knowledgePoint: resolved.knowledgePoint,
      text,
      hash: textHash,
      entryIndex,
    })
  }

  const existingVersionByKnowledgePoint = new Map<string, number>()
  for (const content of options.existingContents ?? []) {
    const version = existingVersionByKnowledgePoint.get(content.knowledgePointId) ?? 0
    existingVersionByKnowledgePoint.set(
      content.knowledgePointId,
      Math.max(version, content.currentVersion),
    )
  }

  const records = [...candidatesByKnowledgePoint.values()]
    .sort(
      (left, right) =>
        left.lesson.sortOrder - right.lesson.sortOrder ||
        left.lesson.id.localeCompare(right.lesson.id),
    )
    .map(({ lesson, knowledgePoint, text, hash }) => ({
      id: `IMPORTED_CONTENT_${stableHash(`${options.source.id}|${knowledgePoint.id}|${hash}`)}`,
      knowledgePointId: knowledgePoint.id,
      title: `${lesson.title} · 课文原文（候选）`,
      contentType: 'TEXTBOOK' as const,
      contentFormat: 'TEXT' as const,
      body: {
        lessonId: lesson.id,
        sourceUrl: options.sourceUrl,
        fetchedAt: options.fetchedAt,
        sourceContentHash: hash,
        summary: '由授权来源批量导入的课文正文候选。',
        learningGoals: [...knowledgePoint.learningObjective],
        blocks: [{ type: 'TEXT' as const, text }],
      },
      difficulty: knowledgePoint.difficultyLevel,
      sourceId: options.source.id,
      needsVerification: true,
      status: 'DRAFT' as const,
      currentVersion: (existingVersionByKnowledgePoint.get(knowledgePoint.id) ?? 1) + 1,
      isSample: false,
      verificationStatus: 'UNVERIFIED' as const,
      createdAt: options.fetchedAt,
      updatedAt: options.fetchedAt,
    }))

  return {
    schemaVersion: CONTENT_INGESTION_SCHEMA_VERSION,
    textbookId: options.catalog.textbookId,
    source: options.source,
    fetchedAt: options.fetchedAt,
    records,
    issues,
    matchedCount: records.length,
    skippedCount,
    duplicateCount,
  }
}

export function renderGeneratedContentModule(result: ContentIngestionResult): string {
  const sourceJson = JSON.stringify([result.source], null, 2)
  const recordsJson = JSON.stringify(result.records, null, 2)
  return `import type { ContentSource, CourseContent } from '@/types'

/**
 * Generated by scripts/curriculum-content-fetch.ts.
 * Records intentionally remain DRAFT + UNVERIFIED until the batch content
 * release gate is satisfied; this file is not a production allowlist.
 */
export const importedGradeOneChineseUpperContentSources: ContentSource[] = ${sourceJson}

export const importedGradeOneChineseUpperCourseContents: CourseContent[] = ${recordsJson}
`
}
