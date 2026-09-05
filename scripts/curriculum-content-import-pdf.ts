import { execFileSync } from 'node:child_process'
import { statSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

import {
  G1_PEP_CHINESE_S1_TEXTBOOK_ID,
  gradeOneChineseUpperKnowledgePoints,
  gradeOneChineseUpperLessons,
  gradeOneChineseUpperLessonKnowledgePointRelations,
  gradeOneChineseUpperOriginalCourseContents,
} from '../src/data/curriculum'
import type { ContentBlock, ContentSource, CourseContent, Lesson } from '../src/types'

const DEFAULT_OUTPUT_PATH = 'src/data/curriculum/imported/g1-chinese-content-import.ts'
const DEFAULT_PDFTOOLS_PATH = 'pdftotext'
const PDF_PAGE_OFFSET = 5
const PERSONAL_SOURCE_ID = 'G1_PEP_CHINESE_S1_PERSONAL_PDF_SOURCE'
const PERSONAL_SOURCE_REF = 'user-provided://g1-chinese-upper-pdf'
const PDF_FILE_NAME = '语文_1年级_上_统编.pdf'

/** Printed page numbers transcribed from the table of contents in the supplied PDF. */
const PRINTED_PAGE_BY_LESSON_TITLE: Readonly<Record<string, number>> = {
  我是中国人: 2,
  我爱我们的祖国: 4,
  我是小学生: 6,
  我爱学语文: 7,
  '1 天地人': 8,
  '2 金木水火土': 9,
  '3 口耳目手足': 11,
  '4 日月山川': 13,
  语文园地一: 15,
  '快乐读书吧：读书真快乐': 19,
  '1 a o e': 20,
  '2 i u ü': 22,
  '3 b p m f': 24,
  '4 d t n l': 26,
  语文园地二: 28,
  '5 g k h': 32,
  '6 j q x': 34,
  '7 z c s': 36,
  '8 zh ch sh r': 38,
  '9 y w': 40,
  语文园地三: 42,
  '10 ai ei ui': 45,
  '11 ao ou iu': 47,
  '12 ie üe er': 49,
  '13 an en in un ün': 51,
  '14 ang eng ing ong': 54,
  语文园地四: 56,
  '1 秋天': 60,
  '2 江南': 62,
  '3 雪地里的小画家': 64,
  '4 四季': 66,
  语文园地五: 68,
  '5 对韵歌': 73,
  '6 日月明': 74,
  '7 小书包': 76,
  '8 升国旗': 78,
  语文园地六: 80,
  '5 小小的船': 84,
  '6 影子': 86,
  '7 两件宝': 88,
  语文园地七: 90,
  '8 比尾巴': 95,
  '9 乌鸦喝水': 97,
  '10 雨点儿': 99,
  语文园地八: 101,
}

const HAN_PATTERN = /\p{Script=Han}/u
const HAN_OR_PUNCTUATION_PATTERN = /[\p{Script=Han}，。！？：；、（）“”‘’《》〈〉【】「」…—·]/u
const UNIT_HEADING_PATTERN = /^第[一二三四五六七八]单元[·。]/u
const FOOTNOTE_PATTERN = /^(?:①)?本文(?:由|作者|选自|根据)/u
const PHONICS_TITLE_PATTERN = /[a-zA-Zü]/u

interface CliOptions {
  pdfPath: string
  outputPath: string
  pdftotextBin: string
  apply: boolean
}

interface ImportedLesson extends Lesson {
  printedPage: number
}

function optionValue(args: readonly string[], name: string): string | undefined {
  const index = args.indexOf(name)
  const value = index >= 0 ? args[index + 1] : undefined
  return value && !value.startsWith('--') ? value : undefined
}

function printUsage(): void {
  console.log(`
Usage:
  npm run curriculum:content:import-pdf -- --pdf <path> [options]

Import a user-provided local Grade 1 Chinese PDF into the development content
dataset. The generated source remains PERSONAL_LOCAL / PENDING and every
content record remains DRAFT / UNVERIFIED. This command never changes the
production allow-list.

Options:
  --pdf <path>                    Local PDF path
  --output <path>                 Generated module path
  --pdftotext-bin <path>          pdftotext executable (default: pdftotext)
  --apply                         Write the generated import module
  --help
`)
}

function parseOptions(
  args: readonly string[],
): { options: CliOptions } | { help: true } | { error: string } {
  if (args.includes('--help') || args.length === 0) return { help: true }
  const pdfPath = optionValue(args, '--pdf')
  if (!pdfPath) return { error: '缺少 --pdf。' }
  return {
    options: {
      pdfPath: resolve(pdfPath),
      outputPath: optionValue(args, '--output') ?? DEFAULT_OUTPUT_PATH,
      pdftotextBin: optionValue(args, '--pdftotext-bin') ?? DEFAULT_PDFTOOLS_PATH,
      apply: args.includes('--apply'),
    },
  }
}

function extractPdfText(pdfPath: string, pdftotextBin: string): string {
  return execFileSync(pdftotextBin, ['-layout', pdfPath, '-'], {
    encoding: 'utf8',
    maxBuffer: 30 * 1024 * 1024,
    stdio: ['ignore', 'pipe', 'ignore'],
  })
}

function normalizePageText(rawPage: string): string {
  const lines: string[] = []
  let previous = ''

  for (const rawLine of rawPage.split(/\r?\n/u)) {
    const compact = rawLine.replace(/\s+/gu, '').replaceAll('①', '')
    if (!compact || /^\d+$/u.test(compact) || UNIT_HEADING_PATTERN.test(compact)) continue
    if (FOOTNOTE_PATTERN.test(compact)) continue

    const characters = [...compact].filter((character) =>
      HAN_OR_PUNCTUATION_PATTERN.test(character),
    )
    const line = characters.join('').trim()
    if (!line || !HAN_PATTERN.test(line) || line === previous) continue
    lines.push(line)
    previous = line
  }

  return lines.join('\n').trim()
}

function isPhonicsLesson(title: string): boolean {
  return PHONICS_TITLE_PATTERN.test(title)
}

function phonicsTarget(title: string): string {
  return title
    .replace(/^\d+\s*/u, '')
    .trim()
    .split(/\s+/u)
    .join('、')
}

function displayLessonTitle(title: string): string {
  return title.replace(/^\d+\s*/u, '').trim()
}

function removeLeadingLessonTitle(sourceText: string, title: string): string {
  const lines = sourceText.split('\n')
  const titleIndex = lines.findIndex(
    (line, index) => index < 4 && line.trim() === displayLessonTitle(title),
  )
  if (titleIndex >= 0) lines.splice(titleIndex, 1)
  return lines.join('\n').trim()
}

function pageRangeForLessons(
  lessons: readonly Lesson[],
): Map<string, { start: number; end: number }> {
  const importedLessons: ImportedLesson[] = lessons.map((lesson) => {
    const printedPage = PRINTED_PAGE_BY_LESSON_TITLE[lesson.title]
    if (!printedPage) throw new Error(`PDF_LESSON_PAGE_MISSING:${lesson.title}`)
    return { ...lesson, printedPage }
  })
  const ranges = new Map<string, { start: number; end: number }>()
  importedLessons.forEach((lesson, index) => {
    const next = importedLessons[index + 1]
    const end = next ? next.printedPage - 1 : 104
    if (end < lesson.printedPage) {
      throw new Error(`PDF_LESSON_PAGE_ORDER_INVALID:${lesson.title}`)
    }
    ranges.set(lesson.id, { start: lesson.printedPage, end })
  })
  return ranges
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string')
    ? value.map((item) => item.trim()).filter(Boolean)
    : []
}

function buildSource(pdfPath: string, pageCount: number, fileSize: number): ContentSource {
  return {
    id: PERSONAL_SOURCE_ID,
    sourceType: 'TEXTBOOK',
    title: '用户提供的人教版语文一年级上册本地 PDF',
    publisher: '人民教育出版社',
    edition: '统编版 / 一年级上册（用户提供文件）',
    sourceRef: PERSONAL_SOURCE_REF,
    sourceVersion: `LOCAL_PDF_${pageCount}_PAGES_${fileSize}_BYTES`,
    copyrightStatus: 'PENDING',
    license: '用户声明仅限个人本地学习使用；未提供公开再分发授权。',
    attribution: `用户提供的本地文件：${PDF_FILE_NAME}`,
    notes: `从本地 PDF 批量解析，文件路径不写入运行时数据。内容仅作为 PERSONAL_LOCAL 开发数据，保持 DRAFT / UNVERIFIED，不进入 productionCurriculumIndex。PDF 页码偏移校验值：+${PDF_PAGE_OFFSET}。`,
    verificationStatus: 'UNVERIFIED',
  }
}

function buildRecords(
  pdfPages: readonly string[],
  source: ContentSource,
  occurredAt: string,
): { records: CourseContent[]; phonicsFallbackCount: number; emptyCount: number } {
  const ranges = pageRangeForLessons(gradeOneChineseUpperLessons)
  const knowledgePointByLessonId = new Map(
    gradeOneChineseUpperLessonKnowledgePointRelations.map((relation) => [
      relation.lessonId,
      gradeOneChineseUpperKnowledgePoints.find(
        (knowledgePoint) => knowledgePoint.id === relation.knowledgePointId,
      ),
    ]),
  )
  const records: CourseContent[] = []
  let phonicsFallbackCount = 0
  let emptyCount = 0

  for (const lesson of gradeOneChineseUpperLessons) {
    const range = ranges.get(lesson.id)
    const knowledgePoint = knowledgePointByLessonId.get(lesson.id)
    if (!range || !knowledgePoint) throw new Error(`PDF_LESSON_MAPPING_MISSING:${lesson.title}`)

    const pages = pdfPages.slice(range.start + PDF_PAGE_OFFSET - 1, range.end + PDF_PAGE_OFFSET)
    const extractedText = pages.map(normalizePageText).filter(Boolean).join('\n\n').trim()
    const phonics = isPhonicsLesson(lesson.title)
    let sourceText = extractedText
    if (phonics) {
      sourceText = [
        `本课拼音目标：${phonicsTarget(lesson.title)}`,
        extractedText || '课本页面已导入；拼音图形和声调请结合本地 PDF 页面查看。',
      ].join('\n\n')
      if (!extractedText) phonicsFallbackCount += 1
    }
    if (!sourceText) {
      sourceText = '本课页面未能从 PDF 文字层提取出可读文本，请结合本地 PDF 查看。'
      emptyCount += 1
    }

    const lessonTitle = displayLessonTitle(lesson.title)
    const readingText = removeLeadingLessonTitle(sourceText, lesson.title)

    const originalContent = gradeOneChineseUpperOriginalCourseContents.find(
      (content) => content.knowledgePointId === knowledgePoint.id,
    )
    const focus = stringArray(originalContent?.body['focus'])
    const activity =
      typeof originalContent?.body['activity'] === 'string'
        ? originalContent.body['activity']
        : undefined
    const blocks: ContentBlock[] = [
      {
        type: 'TEXT',
        text: `《${lessonTitle}》\n\n${readingText}`,
      },
      ...(activity ? [{ type: 'TEXT' as const, text: `小练习：${activity}` }] : []),
    ]

    records.push({
      id: `G1_PEP_CHINESE_S1_PERSONAL_PDF_CONTENT_${String(records.length + 1).padStart(2, '0')}`,
      knowledgePointId: knowledgePoint.id,
      title: `《${lessonTitle}》`,
      contentType: 'TEXTBOOK',
      contentFormat: 'TEXT',
      body: {
        lessonId: lesson.id,
        sourceScope: 'PERSONAL_LOCAL',
        sourceFileName: PDF_FILE_NAME,
        sourceUrl: PERSONAL_SOURCE_REF,
        directoryPage: range.start,
        directoryNumber: lesson.title.match(/^\d+/u)?.[0] ?? null,
        printedPageStart: range.start,
        printedPageEnd: range.end,
        pdfPageStart: range.start + PDF_PAGE_OFFSET,
        pdfPageEnd: range.end + PDF_PAGE_OFFSET,
        summary: knowledgePoint.description,
        learningGoals: [...knowledgePoint.learningObjective],
        ...(focus.length ? { focus } : {}),
        ...(activity ? { activity } : {}),
        blocks,
      },
      difficulty: knowledgePoint.difficultyLevel,
      sourceId: source.id,
      needsVerification: true,
      status: 'DRAFT',
      currentVersion: 2,
      isSample: false,
      verificationStatus: 'UNVERIFIED',
      createdAt: occurredAt,
      updatedAt: occurredAt,
    })
  }

  return { records, phonicsFallbackCount, emptyCount }
}

function renderModule(source: ContentSource, records: readonly CourseContent[]): string {
  return `import type { ContentSource, CourseContent } from '@/types'

/**
 * Generated from a user-provided local PDF for personal development use.
 * The source intentionally remains PENDING and the records remain DRAFT /
 * UNVERIFIED. This module is never a production release allow-list.
 */
export const importedGradeOneChineseUpperContentSources: ContentSource[] = ${JSON.stringify([source], null, 2)}

export const importedGradeOneChineseUpperCourseContents: CourseContent[] = ${JSON.stringify(records, null, 2)}
`
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

  const { options } = parsed
  try {
    const pdfStat = statSync(options.pdfPath)
    const rawText = extractPdfText(options.pdfPath, options.pdftotextBin)
    const pdfPages = rawText.split('\f')
    if (pdfPages.at(-1)?.trim() === '') pdfPages.pop()
    if (pdfPages.length < 110) throw new Error(`PDF_PAGE_COUNT_TOO_SMALL:${pdfPages.length}`)

    const source = buildSource(options.pdfPath, pdfPages.length, pdfStat.size)
    const occurredAt = new Date().toISOString()
    const { records, phonicsFallbackCount, emptyCount } = buildRecords(pdfPages, source, occurredAt)
    const contentCount = records.filter((record) => {
      const blocks = record.body['blocks']
      return Array.isArray(blocks) && blocks.some((block) => typeof block?.text === 'string')
    }).length
    console.log(`pdf=${options.pdfPath}`)
    console.log(`pages=${pdfPages.length} textbook=${G1_PEP_CHINESE_S1_TEXTBOOK_ID}`)
    console.log(
      `lessons=${records.length} content=${contentCount} phonicsFallback=${phonicsFallbackCount} empty=${emptyCount}`,
    )
    console.log('sourceScope=PERSONAL_LOCAL copyright=PENDING verification=UNVERIFIED status=DRAFT')

    if (!options.apply) {
      console.log('write=SKIPPED (dry-run；增加 --apply 才会写入 generated import 文件)')
      return 0
    }

    const outputPath = resolve(process.cwd(), options.outputPath)
    writeFileSync(outputPath, renderModule(source, records), 'utf8')
    console.log(`write=APPLIED ${outputPath}`)
    console.log('production=BLOCKED (productionCurriculumIndex remains unchanged)')
    return 0
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    console.error(`import=FAIL ${message}`)
    return 1
  }
}

process.exitCode = await main()
