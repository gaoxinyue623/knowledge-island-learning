import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  gradeFiveChineseLiteracySource as source,
  gradeFiveChineseDefinitions as definitions,
  gradeFiveChineseCurriculum as curriculum,
  G5_PEP_CHINESE_LITERACY_SOURCE_ID as sourceId,
} from '@/data/curriculum/grade-5/chinese-pep-upper'

const digest = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex')

describe('grade five upper image literacy transcription', () => {
  it('retains all eight source images and all 209 / 220 / 213 entries in printed order', () => {
    expect(digest('src/data/curriculum/grade-5/chinese-pep-upper/literacy-source-text.md')).toBe(
      source.sourceSha256,
    )
    expect(source.sourceImages.map((page) => page.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8])
    for (const page of source.sourceImages) expect(digest(`public${page.url}`)).toBe(page.sha256)
    expect(
      source.tables.map((table) => [table.declaredCount, table.entryCount, table.groups.length]),
    ).toEqual([
      [200, 209, 27],
      [220, 220, 22],
      [213, 213, 18],
    ])
    const groupSizes = [
      [2, 4, 9, 7, 14, 5, 15, 3, 14, 7, 6, 6, 7, 8, 3, 4, 12, 14, 12, 8, 4, 8, 6, 10, 5, 13, 3],
      [9, 9, 15, 14, 6, 14, 12, 14, 6, 9, 13, 13, 7, 14, 13, 8, 5, 6, 5, 10, 5, 13],
      [8, 8, 18, 17, 10, 22, 18, 6, 21, 10, 4, 12, 13, 8, 7, 8, 8, 15],
    ]
    source.tables.forEach((table, index) => {
      expect(table.groups.map((group) => group.entries.length)).toEqual(groupSizes[index])
      expect(table.groups.flatMap((group) => group.entries)).toHaveLength(table.entryCount)
      expect(
        table.groups
          .filter((group) => group.lessonNumber === null)
          .map((group) => [group.heading, group.gardenNumber]),
      ).toEqual([
        ['语文园地', 6],
        ['语文园地', 7],
      ])
      const definition = definitions.find((d) => d.key === table.key)!
      expect(definition.text).toBe(table.text)
      const content = curriculum.courseContents.find(
        (c) => c.knowledgePointId === definition.knowledgePointId,
      )!
      expect(content).toMatchObject({ currentVersion: 2, sourceId })
      expect(content.body.literacyGroups).toEqual(table.groups)
      expect(content.body.sourcePages).toEqual(table.sourcePages)
    })
    expect(
      source.tables[0]!.groups.filter((g) => g.lessonNumber).map((g) => g.lessonNumber),
    ).toEqual(Array.from({ length: 25 }, (_, i) => i + 1))
    expect(
      source.tables[1]!.groups.filter((g) => g.lessonNumber).map((g) => g.lessonNumber),
    ).toEqual([1, 2, 4, 5, 6, 7, 8, 9, 11, 12, 13, 15, 16, 17, 18, 20, 21, 22, 23, 24])
    expect(
      source.tables[2]!.groups.filter((g) => g.lessonNumber).map((g) => g.lessonNumber),
    ).toEqual([1, 2, 4, 5, 6, 7, 8, 9, 13, 15, 16, 17, 18, 21, 22, 24])
  })

  it('keeps the nine blue readings, both pronunciations of 冠, and image-specific pinyin', () => {
    const entries = source.tables[0]!.groups.flatMap((group) => group.entries).filter(
      (entry) => typeof entry !== 'string',
    )
    expect(entries.filter((entry) => !entry.polyphonic)).toHaveLength(200)
    expect(
      entries.filter((entry) => entry.polyphonic).map((entry) => [entry.character, entry.pinyin]),
    ).toEqual([
      ['任', 'rén'],
      ['强', 'qiǎng'],
      ['削', 'xuē'],
      ['冠', 'guàn'],
      ['落', 'là'],
      ['要', 'yāo'],
      ['识', 'zhì'],
      ['论', 'lún'],
      ['传', 'zhuàn'],
    ])
    expect(
      entries
        .filter((entry) => entry.character === '冠')
        .map((entry) => [entry.pinyin, entry.polyphonic]),
    ).toEqual([
      ['guān', false],
      ['guàn', true],
    ])
    for (const [character, pinyin] of [
      ['嚓', 'cā'],
      ['呛', 'qiàng'],
      ['拗', 'niù'],
      ['撩', 'liāo'],
      ['肋', 'lèi'],
      ['谅', 'liàng'],
      ['辰', 'chén'],
      ['咯', 'gē'],
      ['煞', 'shà'],
      ['贾', 'jiǎ'],
    ]) {
      expect(entries.find((entry) => entry.character === character)?.pinyin).toBe(pinyin)
    }
    for (const entry of entries) {
      expect(entry.character).toHaveLength(1)
      expect(entry.pinyin).toMatch(/^[a-zāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜü]+$/u)
    }
    for (const table of source.tables.slice(1))
      expect(
        table.groups.flatMap((group) => group.entries).every((entry) => typeof entry === 'string'),
      ).toBe(true)
  })

  it('preserves wrapped rows and the third-page continuation of the word table', () => {
    const recognition = source.tables[0]!
    expect(recognition.groups.find((g) => g.lessonNumber === 18)?.entries.at(-1)).toMatchObject({
      character: '篷',
      pinyin: 'péng',
    })
    const writing = source.tables[1]!
    expect(writing.groups.find((g) => g.lessonNumber === 13)?.entries).toEqual(
      Array.from('估损组殿征览境宏唐侵销罪略'),
    )
    expect(writing.groups.find((g) => g.lessonNumber === 16)?.entries).toEqual(
      Array.from('塔埃墓堆基砌狭'),
    )
    const words = source.tables[2]!
    expect(words.groups.find((g) => g.lessonNumber === 7)?.entries.slice(-4)).toEqual([
      '纹丝不动',
      '相提并论',
      '忠于职守',
      '壮举',
    ])
    expect(words.groups.find((g) => g.lessonNumber === 8)?.entries[0]).toBe('流传')
    expect(words.groups.find((g) => g.lessonNumber === 24)?.entries).toEqual(
      '津津有味 公事 一知半解 兴趣 述说 厌烦 朝代 兴亡盛衰 处世 书刊 精彩 质朴 浅显 国际 刊物'.split(
        ' ',
      ),
    )
  })
})
