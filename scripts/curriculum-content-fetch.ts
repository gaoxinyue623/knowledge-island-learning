import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

import {
  createStableContentSourceId,
  buildCourseContentCandidates,
  fetchContentDocument,
  parseFetchedContentDocument,
  renderGeneratedContentModule,
  validateContentPersistencePolicy,
  validateContentSourceUrl,
  type ContentFetchSourceType,
} from '../src/services/curriculum'
import {
  curriculumData,
  gradeOneChineseUpperKnowledgePoints,
  gradeOneChineseUpperLessons,
  gradeOneChineseUpperLessonKnowledgePointRelations,
  G1_PEP_CHINESE_S1_TEXTBOOK_ID,
} from '../src/data/curriculum'
import type { ContentSource, SourceCopyrightStatus } from '../src/types'

const defaultAllowedHosts = ['pep.com.cn']
const defaultOutputPath = 'src/data/curriculum/imported/g1-chinese-content-import.ts'

interface CliOptions {
  url?: string
  sourceId?: string
  sourceTitle: string
  sourceType: ContentFetchSourceType
  copyrightStatus: SourceCopyrightStatus
  publisher?: string
  edition?: string
  license?: string
  attribution?: string
  authorizationReference?: string
  allowHosts: string[]
  outputPath: string
  apply: boolean
  timeoutMs: number
  maxBytes: number
}

const sourceTypes: readonly ContentFetchSourceType[] = [
  'TEXTBOOK',
  'PUBLIC_RESOURCE',
  'LICENSED_RESOURCE',
]
const copyrightStatuses: readonly SourceCopyrightStatus[] = [
  'UNKNOWN',
  'PENDING',
  'CLEARED',
  'RESTRICTED',
]

function optionValue(args: readonly string[], name: string): string | undefined {
  const index = args.indexOf(name)
  const value = index >= 0 ? args[index + 1] : undefined
  return value && !value.startsWith('--') ? value : undefined
}

function optionValues(args: readonly string[], name: string): string[] {
  const values: string[] = []
  args.forEach((argument, index) => {
    if (argument === name) {
      const value = args[index + 1]
      if (value && !value.startsWith('--')) values.push(value)
    }
  })
  return values
}

function positiveIntegerOption(
  args: readonly string[],
  name: string,
  fallback: number,
): number | undefined {
  const value = optionValue(args, name)
  if (value === undefined) return fallback
  const parsed = Number(value)
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined
}

function printUsage(): void {
  console.log(`
Usage:
  npm run curriculum:content:fetch -- --url <url> [options]

Fetch a batch content manifest from an allowlisted source and match it to the
Grade 1 Chinese upper-volume knowledge island.

The remote JSON format is:
  { "entries": [
      { "lessonTitle": "秋天", "text": "..." },
      { "knowledgePointId": "G1_PEP_CHINESE_S1_KP_01", "text": "..." }
    ] }

HTML is accepted only when each section/article is marked with
data-lesson-title or data-knowledge-point-id.

Options:
  --source-id <id>                 Stable ContentSource ID (derived if omitted)
  --source-title <title>          Source title
  --source-type <type>             TEXTBOOK | PUBLIC_RESOURCE | LICENSED_RESOURCE
  --copyright-status <status>      UNKNOWN | PENDING | CLEARED | RESTRICTED
  --license <text>                 Required for --apply
  --authorization-ref <ref>        Batch authorization reference required for --apply
  --publisher <name>
  --edition <name>
  --attribution <text>
  --allow-host <host>              Repeatable; pep.com.cn is allowed by default
  --output <path>                  Generated module path
  --timeout-ms <number>
  --max-bytes <number>
  --apply                          Write the generated candidate module
  --help

--apply never promotes records to REVIEWED/PUBLISHED. It writes DRAFT +
UNVERIFIED content to the development dataset only; the production allowlist
and content release gate remain separate.
`)
}

function parseOptions(
  args: readonly string[],
): { options: CliOptions } | { error: string } | { help: true } {
  if (args.includes('--help') || args.length === 0) return { help: true }
  const url = optionValue(args, '--url')
  if (!url) return { error: '缺少 --url。' }

  const sourceTypeValue = optionValue(args, '--source-type') ?? 'PUBLIC_RESOURCE'
  if (!sourceTypes.includes(sourceTypeValue as ContentFetchSourceType)) {
    return { error: `不支持的 --source-type：${sourceTypeValue}。` }
  }
  const copyrightStatusValue = optionValue(args, '--copyright-status') ?? 'PENDING'
  if (!copyrightStatuses.includes(copyrightStatusValue as SourceCopyrightStatus)) {
    return { error: `不支持的 --copyright-status：${copyrightStatusValue}。` }
  }
  const timeoutMs = positiveIntegerOption(args, '--timeout-ms', 15_000)
  const maxBytes = positiveIntegerOption(args, '--max-bytes', 2_000_000)
  if (timeoutMs === undefined || maxBytes === undefined) {
    return { error: '--timeout-ms 和 --max-bytes 必须是正整数。' }
  }

  return {
    options: {
      url,
      sourceId: optionValue(args, '--source-id'),
      sourceTitle: optionValue(args, '--source-title') ?? '一年级语文课文网络导入来源',
      sourceType: sourceTypeValue as ContentFetchSourceType,
      copyrightStatus: copyrightStatusValue as SourceCopyrightStatus,
      publisher: optionValue(args, '--publisher'),
      edition: optionValue(args, '--edition'),
      license: optionValue(args, '--license'),
      attribution: optionValue(args, '--attribution'),
      authorizationReference: optionValue(args, '--authorization-ref'),
      allowHosts: [...new Set([...defaultAllowedHosts, ...optionValues(args, '--allow-host')])],
      outputPath: optionValue(args, '--output') ?? defaultOutputPath,
      apply: args.includes('--apply'),
      timeoutMs,
      maxBytes,
    },
  }
}

function buildContentSource(options: CliOptions): ContentSource {
  const sourceId = options.sourceId ?? createStableContentSourceId(options.url ?? '')
  const notes = [
    '由 curriculum-content-fetch.ts 批量获取；内容候选仍需通过项目内容发布门槛。',
    options.authorizationReference
      ? `批次授权引用：${options.authorizationReference}`
      : '未提供批次授权引用，仅可生成 dry-run 诊断。',
  ]
  return {
    id: sourceId,
    sourceType: options.sourceType,
    title: options.sourceTitle,
    publisher: options.publisher,
    edition: options.edition,
    sourceRef: options.url,
    sourceVersion: 'NETWORK_FETCH_V1',
    copyrightStatus: options.copyrightStatus,
    license: options.license,
    attribution: options.attribution,
    notes: notes.join(' '),
    verificationStatus: 'UNVERIFIED',
  }
}

function printIssues(
  issues: readonly { code: string; severity: string; message: string; entryIndex?: number }[],
): void {
  for (const issue of issues) {
    const entry = issue.entryIndex === undefined ? '' : ` entry=${issue.entryIndex + 1}`
    console.log(`  ${issue.severity} ${issue.code}${entry}: ${issue.message}`)
  }
}

async function main(): Promise<number> {
  const parsed = parseOptions(process.argv.slice(2))
  if ('help' in parsed) {
    printUsage()
    return 0
  }
  if ('error' in parsed) {
    console.error(`参数错误：${parsed.error}`)
    printUsage()
    return 1
  }

  const options = parsed.options
  const url = options.url
  if (!url) return 1
  const sourceUrlIssues = validateContentSourceUrl(url, options.allowHosts)
  if (sourceUrlIssues.length > 0) {
    console.error('source=BLOCKED')
    sourceUrlIssues.forEach((issue) => console.error(`  ${issue}`))
    return 1
  }

  const source = buildContentSource(options)
  if (options.apply) {
    const persistenceIssues = validateContentPersistencePolicy(
      source,
      options.authorizationReference,
    )
    if (persistenceIssues.length > 0) {
      console.error('apply=BLOCKED')
      persistenceIssues.forEach((issue) => console.error(`  ${issue}`))
      return 1
    }
  }

  try {
    const fetched = await fetchContentDocument(url, {
      timeoutMs: options.timeoutMs,
      maxBytes: options.maxBytes,
    })
    const finalUrlIssues = validateContentSourceUrl(fetched.url, options.allowHosts)
    if (finalUrlIssues.length > 0) {
      console.error('fetch=BLOCKED (redirected source host is not allowlisted)')
      finalUrlIssues.forEach((issue) => console.error(`  ${issue}`))
      return 1
    }
    const parsedDocument = parseFetchedContentDocument(fetched)
    const result = buildCourseContentCandidates({
      catalog: {
        textbookId: G1_PEP_CHINESE_S1_TEXTBOOK_ID,
        lessons: gradeOneChineseUpperLessons,
        knowledgePoints: gradeOneChineseUpperKnowledgePoints,
        lessonKnowledgePointRelations: gradeOneChineseUpperLessonKnowledgePointRelations,
      },
      source,
      sourceUrl: fetched.url,
      fetchedAt: fetched.retrievedAt ?? new Date().toISOString(),
      entries: parsedDocument.document.entries,
      existingContents: curriculumData.courseContents.filter(
        (content) => content.sourceId !== source.id,
      ),
      parseIssues: parsedDocument.issues,
    })
    const errorCount = result.issues.filter((issue) => issue.severity === 'error').length
    const warningCount = result.issues.filter((issue) => issue.severity === 'warning').length
    console.log(`source=${source.id}`)
    console.log(`format=${parsedDocument.document.format} fetchedAt=${result.fetchedAt}`)
    console.log(
      `entries=${parsedDocument.document.entries.length} matched=${result.matchedCount} skipped=${result.skippedCount} duplicates=${result.duplicateCount} errors=${errorCount} warnings=${warningCount}`,
    )
    printIssues(result.issues)

    if (errorCount > 0) {
      console.error('result=FAIL (没有写入任何候选数据)')
      return 1
    }
    if (!options.apply) {
      console.log('write=SKIPPED (dry-run；需要 --apply 才会写入 generated import 文件)')
      return 0
    }
    if (result.records.length === 0) {
      console.error('apply=BLOCKED (没有匹配到任何课程)')
      return 1
    }

    const outputPath = resolve(process.cwd(), options.outputPath)
    mkdirSync(dirname(outputPath), { recursive: true })
    writeFileSync(outputPath, renderGeneratedContentModule(result), 'utf8')
    console.log(`write=APPLIED ${outputPath}`)
    console.log('verification=UNVERIFIED status=DRAFT production=BLOCKED')
    return 0
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`fetch=FAIL ${message}`)
    return 1
  }
}

process.exitCode = await main()
