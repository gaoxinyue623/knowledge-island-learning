import { describe, expect, it } from 'vitest'

import {
  importedGradeOneChineseUpperContentSources,
  importedGradeOneChineseUpperCourseContents,
} from '@/data/curriculum/imported/g1-chinese-content-import'

function textBlocks(
  content: (typeof importedGradeOneChineseUpperCourseContents)[number],
): string[] {
  const blocks = content.body['blocks']
  if (!Array.isArray(blocks)) return []
  return blocks.flatMap((block) =>
    typeof block === 'object' && block !== null && 'text' in block && typeof block.text === 'string'
      ? [block.text]
      : [],
  )
}

describe('Grade 1 Chinese personal PDF import', () => {
  it('imports one local content record for every mapped lesson', () => {
    expect(importedGradeOneChineseUpperContentSources).toHaveLength(1)
    expect(importedGradeOneChineseUpperContentSources[0]).toMatchObject({
      id: 'G1_PEP_CHINESE_S1_PERSONAL_PDF_SOURCE',
      sourceRef: 'user-provided://g1-chinese-upper-pdf',
      copyrightStatus: 'PENDING',
      verificationStatus: 'UNVERIFIED',
    })
    expect(importedGradeOneChineseUpperCourseContents).toHaveLength(45)
    expect(
      new Set(
        importedGradeOneChineseUpperCourseContents.map((content) => content.knowledgePointId),
      ),
    ).toHaveProperty('size', 45)
  })

  it('keeps imported records local, draft, and unverified', () => {
    expect(
      importedGradeOneChineseUpperCourseContents.every(
        (content) =>
          content.sourceId === 'G1_PEP_CHINESE_S1_PERSONAL_PDF_SOURCE' &&
          content.status === 'DRAFT' &&
          content.verificationStatus === 'UNVERIFIED' &&
          content.isSample === false &&
          content.body['sourceScope'] === 'PERSONAL_LOCAL',
      ),
    ).toBe(true)
  })

  it('preserves representative textbook text and formats the lesson title', () => {
    const autumn = importedGradeOneChineseUpperCourseContents.find(
      (content) => content.title === '《秋天》',
    )
    expect(autumn).toBeDefined()
    const blocks = textBlocks(autumn!)
    const readingText = blocks.join('\n')
    expect(readingText).toContain('《秋天》')
    expect(readingText).toContain('天气凉了，树叶黄了')
    expect(readingText).toContain('小练习：')
    expect(readingText).not.toContain('课本原文（本地 PDF')

    const phonics = importedGradeOneChineseUpperCourseContents.find(
      (content) => content.title === '《a o e》',
    )
    expect(textBlocks(phonics!).join('\n')).toContain('本课拼音目标：a、o、e')
  })
})
