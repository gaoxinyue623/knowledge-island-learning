import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import {
  G3_PEP_CHINESE_S2_TEXTBOOK_ID as book,
  G3_PEP_CHINESE_LOWER_LITERACY_SOURCE_ID as sourceId,
  gradeThreeChineseLowerLiteracySource as supplied,
  gradeThreeChineseLowerDefinitions,
  gradeThreeChineseLowerReadingOnlyIds as readingOnly,
  gradeThreeChineseLowerQuestions,
  gradeThreeChineseLowerCurriculum,
  gradeThreeChineseLowerBundles,
} from '@/data/curriculum/grade-3/chinese-pep-lower'
import { G3_CHINESE_LOWER_LITERACY_REVISED_AT } from '@/data/curriculum/production/gradeThreeChineseLowerApproval'
import {
  productionCurriculumIndex,
  mvpCurriculumScope,
  productionCurriculumData,
} from '@/data/curriculum/production'
import { validateProductionReadiness } from '@/services/production-readiness/productionReadinessValidator'
import { selectAccount } from '@/services/account/storage'
import { curriculumService } from '@/services/runtime'
import { MockLearningContentRepository } from '@/services/lesson-player/lessonContentRepository'
import { createReadingQuest } from '@/services/content-expansion/readingQuest'
import { createTrainingQuest } from '@/services/content-expansion/trainingQuest'
import { reviewedAiSources, supportsAiPractice } from '@/services/formal-ai/reviewedSources'
import KnowledgePointDetailPage from '@/pages/KnowledgePointDetailPage.vue'
import LessonContentRenderer from '@/components/lesson-player/LessonContentRenderer.vue'
import { useStudentStore } from '@/stores/studentStore'

const appendices = gradeThreeChineseLowerDefinitions.filter((d) => d.kind === 'appendix')
beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  selectAccount('literacy-parent')
  setActivePinia(createPinia())
})
afterEach(() => {
  selectAccount(null)
  vi.restoreAllMocks()
})

describe('grade 3 lower Chinese supplied literacy appendices', () => {
  it('preserves the eight-page transcription and every numbered or garden group with its printed count', () => {
    const raw = readFileSync(
      'src/data/curriculum/grade-3/chinese-pep-lower/literacy-source-text.md',
    )
    const hash = createHash('sha256').update(raw).digest('hex')
    expect(supplied.sourceSha256).toBe(hash)
    expect(supplied.tables.map((t) => [t.entryCount, t.groups.length])).toEqual([
      [275, 31],
      [250, 25],
      [271, 22],
    ])
    expect(supplied.tables.map((t) => t.declaredCount)).toEqual([250, 250, 271])
    for (const table of supplied.tables) {
      expect(raw.toString()).toContain(table.text)
      expect(table.questions).toEqual([])
      expect(table.groups.flatMap((g) => g.entries)).toHaveLength(table.entryCount)
      expect(table.sourceNote).toContain('图片')
      const gardens = table.groups.filter((g) => g.lessonNumber === null)
      expect(gardens.map((g) => g.gardenNumber)).toEqual([1, 3, 6, 8])
      expect(gardens.map((g) => g.heading)).toEqual(Array(4).fill('语文园地'))
      expect(gardens.map((g) => g.entries.length)).toEqual(
        table.tableKind === 'words' ? [6, 6, 8, 8] : [9, 7, 6, 8],
      )
    }
    const recognition = supplied.tables[0]!
    expect(
      recognition.groups.filter((g) => g.lessonNumber !== null).map((g) => g.lessonNumber),
    ).toEqual(Array.from({ length: 27 }, (_, i) => i + 1))
    expect(
      supplied.tables[1]!.groups.filter((g) => g.lessonNumber !== null).map((g) => g.lessonNumber),
    ).toEqual([1, 2, 3, 5, 6, 7, 9, 10, 12, 13, 14, 16, 17, 18, 19, 20, 22, 23, 24, 25, 26])
    expect(
      supplied.tables[2]!.groups.filter((g) => g.lessonNumber !== null).map((g) => g.lessonNumber),
    ).toEqual([2, 3, 6, 7, 9, 10, 13, 14, 16, 17, 18, 19, 20, 22, 23, 24, 25, 26])
    expect(appendices.map((d) => d.title)).toEqual([
      '识字表（会认·含拼音）',
      '写字表（会写）',
      '词语表（按教材图片顺序）',
    ])
  })

  it('keeps all 250 ordinary recognition entries and the 25 differently coloured readings without adding pinyin to the other tables', () => {
    const recognition = supplied.tables[0]!
    const entries = recognition.groups
      .flatMap((g) => g.entries)
      .filter((e) => typeof e !== 'string')
    expect(entries).toHaveLength(275)
    expect(entries.filter((e) => !e.polyphonic)).toHaveLength(250)
    expect(entries.filter((e) => e.polyphonic).map((e) => [e.character, e.pinyin])).toEqual([
      ['曾', 'zēng'],
      ['散', 'sǎn'],
      ['杆', 'gān'],
      ['挨', 'āi'],
      ['蚂', 'mǎ'],
      ['模', 'mú'],
      ['相', 'xiàng'],
      ['称', 'chèn'],
      ['撒', 'sā'],
      ['差', 'chā'],
      ['累', 'lěi'],
      ['切', 'qiē'],
      ['便', 'pián'],
      ['鲜', 'xiān'],
      ['爪', 'zhǎo'],
      ['乘', 'shèng'],
      ['笼', 'lǒng'],
      ['和', 'huò'],
      ['闷', 'mèn'],
      ['劲', 'jìng'],
      ['缝', 'féng'],
      ['夹', 'jiá'],
      ['旋', 'xuàn'],
      ['折', 'zhē'],
      ['涨', 'zhàng'],
    ])
    for (const entry of entries) {
      expect(entry.character).toHaveLength(1)
      expect(entry.pinyin).not.toBe('')
    }
    for (const table of supplied.tables.slice(1)) {
      expect(
        table.groups.flatMap((g) => g.entries).every((entry) => typeof entry === 'string'),
      ).toBe(true)
    }
    const writing = supplied.tables[1]!
    expect(writing.groups.find((g) => g.lessonNumber === 2)?.entries).toEqual(
      Array.from('凑泼集偶尔沾闲纤杆'),
    )
    expect(writing.groups.find((g) => g.lessonNumber === 26)?.entries).toEqual(
      Array.from('漏胖驴爪莫厉害闯模歪胶纵'),
    )
    expect(writing.groups.find((g) => g.gardenNumber === 8)?.entries).toEqual(
      Array.from('咳嗽唠叨吆讽诫辩'),
    )
    const words = supplied.tables[2]!
    expect(words.groups.find((g) => g.lessonNumber === 17)?.entries).toContain('丁零')
    expect(words.groups.find((g) => g.lessonNumber === 19)?.entries).toContain('溶化')
    expect(words.groups.find((g) => g.gardenNumber === 6)?.entries).toContain('瞭望')
    expect(words.groups.find((g) => g.gardenNumber === 8)?.entries).toContain('吆喝')
  })

  it('releases all three readable appendices with their own source while preserving original lessons and scored questions', () => {
    expect(
      validateProductionReadiness(productionCurriculumData, mvpCurriculumScope).issues,
    ).toEqual([])
    expect(gradeThreeChineseLowerCurriculum.units).toHaveLength(8)
    expect(gradeThreeChineseLowerCurriculum.lessons).toHaveLength(32)
    expect(gradeThreeChineseLowerQuestions).toHaveLength(87)
    expect(readingOnly).toEqual(appendices.map((d) => d.knowledgePointId))
    expect(mvpCurriculumScope.readingOnlyKnowledgePointIds).toEqual(
      expect.arrayContaining(readingOnly),
    )
    expect(productionCurriculumIndex.contentSources.find((s) => s.id === sourceId)).toMatchObject({
      sourceVersion: `SHA256:${supplied.sourceSha256}`,
      verifiedAt: G3_CHINESE_LOWER_LITERACY_REVISED_AT,
      verificationStatus: 'REVIEWED',
    })
    for (const d of appendices) {
      const content = gradeThreeChineseLowerCurriculum.courseContents.find(
        (c) => c.knowledgePointId === d.knowledgePointId,
      )!
      expect(content.sourceId).toBe(sourceId)
      expect(content.currentVersion).toBe(2)
      expect(content.body.suppliedText).toBe(d.text)
      expect(content.body.literacyGroups).toEqual('groups' in d ? d.groups : undefined)
      const bundle = gradeThreeChineseLowerBundles.find(
        (b) => b.knowledgePointId === d.knowledgePointId,
      )!
      expect(createReadingQuest({ bundle, title: d.title, text: d.text })).toBeNull()
      expect(createTrainingQuest({ bundle, title: d.title, text: d.text })).toBeNull()
      expect(reviewedAiSources(book, d.knowledgePointId)).toEqual([])
      expect(supportsAiPractice(book, d.knowledgePointId)).toBe(false)
    }
    expect(
      gradeThreeChineseLowerCurriculum.courseContents
        .filter((c) => !readingOnly.includes(c.knowledgePointId))
        .every((c) => c.currentVersion === 1),
    ).toBe(true)
  })

  it('makes all appendix text available to either account, without changing the selected book or lesson numbering', async () => {
    const repository = new MockLearningContentRepository({
      records: [...productionCurriculumIndex.contents],
    })
    for (const account of ['literacy-a', 'literacy-b']) {
      selectAccount(account)
      const availability = await curriculumService.resolveAvailableTextbooks({
        gradeId: 'GRADE_3',
        semesterId: 'SEMESTER_LOWER',
      })
      expect(availability.chinese.availableTextbooks.map((b) => b.id)).toEqual([book])
      for (const d of appendices) {
        const content = await repository.getByKnowledgePoint(d.knowledgePointId)
        expect(content?.blocks.map((b) => b.block.text).join('\n\n')).toContain(
          d.text.replace(/^### /gm, ''),
        )
        expect(content?.currentVersion).toBe(2)
        expect(
          content?.blocks.filter((b) => b.literacyTable).map((b) => b.literacyTable?.groups),
        ).toEqual(['groups' in d ? d.groups : undefined])
      }
    }
    expect(
      gradeThreeChineseLowerDefinitions.filter((d) => d.kind === 'reading').map((d) => d.number),
    ).toEqual(Array.from({ length: 27 }, (_, i) => i + 1))
  })

  it.each(appendices)(
    'renders $title with original words and no promised or invented quiz',
    async (d) => {
      const pinia = createPinia()
      setActivePinia(pinia)
      useStudentStore().profile = { id: 'literacy-child', displayName: '小岛同学' }
      const router = createRouter({
        history: createMemoryHistory(),
        routes: [
          { path: '/knowledge-point/:knowledgePointId', component: KnowledgePointDetailPage },
          { path: '/learning-map', component: { template: '<p>地图</p>' } },
          { path: '/lesson', component: { template: '<p>阅读</p>' } },
        ],
      })
      await router.push({
        path: `/knowledge-point/${d.knowledgePointId}`,
        query: {
          textbookId: book,
          unitId: d.unitId,
          lessonId: d.lessonId,
          knowledgePointId: d.knowledgePointId,
        },
      })
      const wrapper = mount(KnowledgePointDetailPage, {
        global: {
          plugins: [pinia, router],
          stubs: {
            AppShell: { template: '<main><slot /></main>' },
            FormalAiPractice: true,
            ReadingEntry: true,
            QuestTraining: true,
          },
        },
      })
      try {
        await vi.waitFor(() => expect(wrapper.text()).toContain(d.sourceNote))
        await vi.waitFor(() => expect(wrapper.text()).toContain('这是全册字词附录'))
        expect(wrapper.text()).toContain(d.title)
        expect(wrapper.get('#knowledge-reading-title').text()).toBe('字词附录')
        const table = supplied.tables.find((t) => t.key === d.key)!
        const expectedEntries = table.groups.flatMap((g) => g.entries)
        const player = wrapper.getComponent(LessonContentRenderer)
        for (const presentation of ['reading', 'steps'] as const) {
          const renderer = mount(LessonContentRenderer, {
            props: { ...player.props(), presentation },
          })
          try {
            const displayed = renderer.findAll('.literacy-table__entry')
            expect(displayed).toHaveLength(table.entryCount)
            expect(
              displayed.map((entry) => {
                const clone = entry.element.cloneNode(true) as Element
                clone.querySelectorAll('rt, rp').forEach((pinyin) => pinyin.remove())
                return clone.textContent?.trim()
              }),
            ).toEqual(
              expectedEntries.map((entry) => (typeof entry === 'string' ? entry : entry.character)),
            )
            if (table.tableKind === 'recognition') {
              expect(renderer.findAll('ruby')).toHaveLength(275)
              expect(renderer.findAll('rt').map((rt) => rt.text())).toEqual(
                expectedEntries
                  .filter((entry) => typeof entry !== 'string')
                  .map((entry) => entry.pinyin),
              )
              expect(renderer.findAll('.literacy-table__entry--polyphonic')).toHaveLength(25)
            } else {
              expect(renderer.findAll('ruby, rt, .literacy-table__entry--polyphonic')).toHaveLength(
                0,
              )
              expect(displayed.every((entry) => entry.element.tagName === 'SPAN')).toBe(true)
            }
          } finally {
            renderer.unmount()
          }
        }
        expect(wrapper.text()).not.toContain('表中课号、部分篇目与本册已导入目录不同')
        expect(wrapper.text()).not.toContain('正式练习题正在准备中')
        expect(wrapper.findAll('button').some((b) => b.text().includes('开始正式练习'))).toBe(false)
        expect(wrapper.find('[href="#knowledge-challenges"]').exists()).toBe(false)
      } finally {
        wrapper.unmount()
      }
    },
  )
})
