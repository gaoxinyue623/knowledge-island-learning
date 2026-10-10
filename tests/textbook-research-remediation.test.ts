import { describe, expect, it } from 'vitest'
import { productionCurriculumIndex } from '@/data/curriculum/production'
import { localCurriculumData } from '@/data/curriculum/localCatalog'
import { buildEnglishReadingSegments } from '@/services/lesson-player/englishReading'

function contentFor(pointId: string) {
  return productionCurriculumIndex.contents.find((item) => item.knowledgePointId === pointId)!
}
function displayed(pointId: string) {
  return (contentFor(pointId).body.blocks as { text: string }[]).map((b) => b.text).join('\n')
}

describe('researched corrections in the published textbook projection', () => {
  it('corrects pronunciation display and keeps the imported evidence intact', () => {
    const pointId = 'G4_PEP_CHINESE_S1_KP_LITERACY_RECOGNITION'
    expect(displayed(pointId)).toContain('biàn 辫')
    expect(displayed(pointId)).toContain('jué 崛')
    expect(displayed(pointId)).not.toContain('bàn 辫')
    expect(contentFor(pointId).body.suppliedText).toContain('bàn 辫')
    expect(
      localCurriculumData.courseContents.find((item) => item.knowledgePointId === pointId)!.body
        .suppliedText,
    ).toContain('qǐ 崛')
  })

  it('keeps the wrong speaker line out of speech and reads the project reference', () => {
    const pointId = 'G5_SHANGHAI_ENGLISH_S2_KP_02'
    const content = contentFor(pointId)
    const blocks = (content.body.blocks as { text: string }[]).map((block, index) => ({
      id: String(index),
      type: 'concept' as const,
      content: block.text,
      sort: index,
    }))
    const readings = buildEnglishReadingSegments(blocks)
    expect(readings.some((segment) => segment.text === 'Why, Sally?')).toBe(false)
    expect(readings.some((segment) => segment.speaker === 'Sally' && segment.text === 'Why?')).toBe(
      true,
    )
    expect(displayed(pointId)).toContain('项目校正参考表达')
  })

  it('separates ar examples and does not certify missing original textbook text', () => {
    expect(displayed('G2_SHENZHEN_ENGLISH_S2_KP_02')).toContain('其他例词（不含ar）：hot, pot')
    const dog = contentFor('G3_PEP_CHINESE_S1_KP_READING_10')
    expect(dog.body.researchReview).toMatchObject({ status: 'NEEDS_MATCHING_EDITION' })
    expect(displayed('G3_PEP_CHINESE_S1_KP_READING_10')).toContain('从前，有一条不会叫的狗。')
    expect(displayed('G3_PEP_CHINESE_S1_KP_READING_10')).not.toContain('此前提供的故事概要')
    expect(displayed('G5_PEP_CHINESE_S2_KP_READING_11')).toContain('不能用于补造缺失的对话')
  })
})
