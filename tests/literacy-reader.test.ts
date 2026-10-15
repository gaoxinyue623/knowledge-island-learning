import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import LiteracyTableBlock from '@/components/lesson-player/LiteracyTableBlock.vue'
import LearningPath from '@/components/student-growth/LearningPath.vue'
import { gradeThreeChineseLowerCurriculum } from '@/data/curriculum/grade-3/chinese-pep-lower'
import { buildLearningContentFromCourseContent } from '@/services/lesson-player/lessonContentRepository'
import type { LiteracyTablePresentation } from '@/types'

const table: LiteracyTablePresentation = {
  title: '识字表',
  tableKind: 'recognition',
  declaredCount: 3,
  entryCount: 3,
  polyphonicCount: 1,
  groups: [
    {
      heading: '第1课',
      lessonNumber: 1,
      gardenNumber: null,
      sourceImage: 1,
      entries: [
        { character: '涨', pinyin: 'zhàng', polyphonic: true },
        { character: '春', pinyin: 'chūn', polyphonic: false },
      ],
    },
    {
      heading: '语文园地',
      lessonNumber: null,
      gardenNumber: 1,
      sourceImage: 1,
      entries: [{ character: '张', pinyin: 'zhāng', polyphonic: false }],
    },
  ],
  sourcePages: [],
}

describe('literacy reading and lookup', () => {
  it('describes reading-only activities without promising unavailable quizzes or quests', () => {
    const wrapper = mount(LearningPath, {
      props: { practiceAvailable: false, hasChallenge: false },
    })
    expect(wrapper.text()).toContain('回想与表达')
    expect(wrapper.text()).toContain('回看与复习')
    expect(wrapper.text()).not.toContain('教材练习')
    expect(wrapper.text()).not.toContain('闯关')
    wrapper.unmount()
  })
  it('keeps the actual appendix table after editorial notes have been removed', () => {
    const appendices = gradeThreeChineseLowerCurriculum.courseContents.filter(
      (content) => content.body.tableKind,
    )
    expect(appendices).toHaveLength(3)
    for (const content of appendices) {
      const before = JSON.stringify(content)
      const projected = buildLearningContentFromCourseContent(content)!
      const tables = projected.blocks.flatMap((block) =>
        block.literacyTable ? [block.literacyTable] : [],
      )
      expect(tables).toHaveLength(1)
      expect(tables[0]!.groups).toEqual(content.body.literacyGroups)
      expect(tables[0]!.entryCount).toBe(content.body.entryCount)
      expect(projected.steps.flatMap((step) => step.contentBlockIds)).toContain(
        projected.blocks.find((block) => block.literacyTable)!.id,
      )
      expect(JSON.stringify(content)).toBe(before)
    }
  })

  it('finds tone-marked pinyin without accents and combines it with a lesson filter', async () => {
    const original = JSON.stringify(table)
    const wrapper = mount(LiteracyTableBlock, { props: { table } })
    expect(wrapper.findAll('option').map((option) => option.text())).toContain('语文园地1')
    await wrapper.get('input[type="search"]').setValue('ZHANG')
    expect(wrapper.findAll('ruby').map((ruby) => ruby.text())).toEqual([
      '涨（zhàng）',
      '张（zhāng）',
    ])
    expect(wrapper.get('[role="status"]').text()).toContain('找到 2 条')
    await wrapper.get('select').setValue('0')
    expect(wrapper.findAll('ruby')).toHaveLength(1)
    expect(wrapper.get('ruby').text()).toContain('涨')
    await wrapper.get('button').trigger('click')
    expect(wrapper.findAll('ruby')).toHaveLength(3)
    expect(JSON.stringify(table)).toBe(original)
    wrapper.unmount()
  })

  it('shows a recoverable empty state and clears filters when changing appendices', async () => {
    const wrapper = mount(LiteracyTableBlock, { props: { table } })
    await wrapper.get('input').setValue('不存在')
    expect(wrapper.findAll('.literacy-table__entry')).toHaveLength(0)
    expect(wrapper.text()).toContain('没有找到对应内容')
    await wrapper.setProps({
      table: {
        ...table,
        title: '词语表',
        tableKind: 'words',
        entryCount: 2,
        groups: [
          {
            heading: '第2课',
            lessonNumber: 2,
            gardenNumber: null,
            sourceImage: 1,
            entries: ['春天', '公园'],
          },
        ],
      },
    })
    expect((wrapper.get('input').element as HTMLInputElement).value).toBe('')
    await wrapper.get('input').setValue('公园')
    expect(wrapper.findAll('.literacy-table__entry').map((entry) => entry.text())).toEqual(['公园'])
    wrapper.unmount()
  })
})
