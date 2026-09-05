import { describe, expect, it } from 'vitest'

import {
  buildCourseContentCandidates,
  parseFetchedContentDocument,
  renderGeneratedContentModule,
  validateContentPersistencePolicy,
  validateContentSourceUrl,
} from '@/services/curriculum'
import type { ContentCatalog } from '@/services/curriculum'
import type { ContentSource, KnowledgePoint, Lesson, LessonKnowledgePointRelation } from '@/types'

const lesson: Lesson = {
  id: 'LESSON_AUTUMN',
  unitId: 'UNIT_ONE',
  code: 'LESSON_01',
  title: '秋天',
  sortOrder: 1,
  status: 'ACTIVE',
  needsVerification: true,
  sourceId: 'SOURCE_DIRECTORY',
  verificationStatus: 'UNVERIFIED',
}

const knowledgePoint: KnowledgePoint = {
  id: 'KP_AUTUMN',
  code: 'CN-G1-S1-AUTUMN',
  name: '秋天 · 学习要点',
  subjectId: 'SUBJECT_CHINESE',
  gradeScope: { minGrade: 1, maxGrade: 1 },
  description: '认识秋天的景物和表达。',
  learningObjective: ['能读准课文中的常用字。'],
  abilityTags: ['reading'],
  difficultyLevel: 'FOUNDATION',
  status: 'ACTIVE',
  needsVerification: true,
  sourceId: 'SOURCE_ORIGINAL',
  verificationStatus: 'UNVERIFIED',
}

const relation: LessonKnowledgePointRelation = {
  id: 'RELATION_AUTUMN',
  lessonId: lesson.id,
  knowledgePointId: knowledgePoint.id,
  relationType: 'CORE',
  order: 1,
  isPrimary: true,
  sourceId: 'SOURCE_ORIGINAL',
  needsVerification: true,
  status: 'ACTIVE',
  verificationStatus: 'UNVERIFIED',
}

const catalog: ContentCatalog = {
  textbookId: 'TEXTBOOK_G1_CHINESE_UPPER',
  lessons: [lesson],
  knowledgePoints: [knowledgePoint],
  lessonKnowledgePointRelations: [relation],
}

const source: ContentSource = {
  id: 'AUTHORIZED_SOURCE_G1_CHINESE',
  sourceType: 'LICENSED_RESOURCE',
  title: '授权课文内容源',
  sourceRef: 'https://content.example.test/g1-chinese.json',
  copyrightStatus: 'CLEARED',
  license: '项目内容使用授权（批次授权）',
  attribution: '授权内容提供方',
  verificationStatus: 'UNVERIFIED',
}

describe('curriculum content ingestion', () => {
  it('parses segmented JSON and HTML without accepting an unsegmented page', () => {
    const json = parseFetchedContentDocument({
      url: source.sourceRef ?? '',
      contentType: 'application/json',
      text: JSON.stringify({ entries: [{ lessonTitle: '秋天', text: '秋天到了。' }] }),
    })
    expect(json.document.format).toBe('json')
    expect(json.document.entries[0]?.lessonTitle).toBe('秋天')
    expect(json.issues).toEqual([])

    const html = parseFetchedContentDocument({
      url: source.sourceRef ?? '',
      contentType: 'text/html',
      text: '<section data-lesson-title="秋天"><p>秋天到了。</p><p>天气凉了。</p></section>',
    })
    expect(html.document.entries[0]?.text).toBe('秋天到了。\n天气凉了。')
    expect(html.issues).toEqual([])

    const catalogPage = parseFetchedContentDocument({
      url: source.sourceRef ?? '',
      contentType: 'text/html',
      text: '<main><h1>语文一年级上册</h1><p>秋天</p></main>',
    })
    expect(catalogPage.document.entries).toEqual([])
    expect(catalogPage.issues[0]?.code).toBe('HTML_SOURCE_NOT_SEGMENTED')
  })

  it('matches by lesson title, creates a stable candidate, and deduplicates repeats', () => {
    const input = {
      catalog,
      source,
      sourceUrl: source.sourceRef ?? '',
      fetchedAt: '2026-09-04T00:00:00.000Z',
      entries: [
        { lessonTitle: '第1课 秋天', text: '秋天到了。天气凉了。' },
        { lessonTitle: '秋天', text: '秋天到了。天气凉了。' },
      ],
      existingContents: [],
    }
    const first = buildCourseContentCandidates(input)
    const second = buildCourseContentCandidates(input)

    expect(first.records).toHaveLength(1)
    expect(first.records[0]?.id).toBe(second.records[0]?.id)
    expect(first.records[0]?.currentVersion).toBe(2)
    expect(first.duplicateCount).toBe(1)
    expect(first.issues.some((issue) => issue.code === 'CONTENT_DUPLICATE_ENTRY')).toBe(true)
    expect(first.records[0]?.status).toBe('DRAFT')
    expect(first.records[0]?.verificationStatus).toBe('UNVERIFIED')
    expect(first.records[0]?.contentType).toBe('TEXTBOOK')
  })

  it('rejects conflicting duplicate text and unknown mappings', () => {
    const result = buildCourseContentCandidates({
      catalog,
      source,
      sourceUrl: source.sourceRef ?? '',
      fetchedAt: '2026-09-04T00:00:00.000Z',
      entries: [
        { lessonTitle: '秋天', text: '第一份正文。' },
        { lessonTitle: '秋天', text: '第二份正文。' },
        { lessonTitle: '不存在的课', text: '无匹配正文。' },
      ],
    })

    expect(result.records).toHaveLength(1)
    expect(result.skippedCount).toBe(2)
    expect(result.issues.map((issue) => issue.code)).toEqual([
      'CONTENT_CONFLICTING_DUPLICATE',
      'CONTENT_LESSON_NOT_FOUND',
    ])
  })

  it('requires source clearance and a batch authorization reference before apply', () => {
    expect(
      validateContentPersistencePolicy(
        { copyrightStatus: 'PENDING', license: undefined },
        undefined,
      ),
    ).toHaveLength(3)
    expect(
      validateContentPersistencePolicy(
        { copyrightStatus: 'CLEARED', license: '批次授权' },
        'AUTH-BATCH-01',
      ),
    ).toEqual([])
  })

  it('limits network sources and keeps generated records out of publish states', () => {
    expect(validateContentSourceUrl('https://www.pep.com.cn/catalog', ['pep.com.cn'])).toEqual([])
    expect(validateContentSourceUrl('https://unknown.example/catalog', ['pep.com.cn'])).not.toEqual(
      [],
    )

    const result = buildCourseContentCandidates({
      catalog,
      source,
      sourceUrl: source.sourceRef ?? '',
      fetchedAt: '2026-09-04T00:00:00.000Z',
      entries: [{ knowledgePointId: knowledgePoint.id, text: '秋天到了。' }],
    })
    const generated = renderGeneratedContentModule(result)
    expect(generated).toContain('DRAFT')
    expect(generated).toContain('UNVERIFIED')
    expect(generated).not.toContain('PUBLISHED')
    expect(generated).not.toContain('REVIEWED')
  })
})
