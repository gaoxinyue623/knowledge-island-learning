import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import LessonSourceNotes from '@/components/lesson-player/LessonSourceNotes.vue'
import { productionCurriculumIndex } from '@/data/curriculum/production'
import { buildLearningContentFromCourseContent } from '@/services/lesson-player/lessonContentRepository'
import { lessonPlayerRepository } from '@/services/lesson-player/lessonPlayerRepository'
import {
  buildLessonPlayerViewModel,
  createLessonSession,
} from '@/services/lesson-player/lessonPlayerAdapter'
import { lessonReadingText } from '@/services/lesson-player/lessonReadingText'

const context = {
  textbookId: 'G2_SHENZHEN_SHANGHAI_ENGLISH_S2_2024',
  unitId: 'G2_SHENZHEN_ENGLISH_S2_UNIT_02',
  lessonId: 'G2_SHENZHEN_ENGLISH_S2_LESSON_02',
  knowledgePointId: 'G2_SHENZHEN_ENGLISH_S2_KP_02',
}

describe('separate source and correction notes', () => {
  it('retains explicit correction notes while keeping them outside lesson steps', () => {
    const record = productionCurriculumIndex.contents.find(
      (content) => content.knowledgePointId === context.knowledgePointId,
    )!
    const before = JSON.stringify(record)
    const projection = buildLearningContentFromCourseContent(record)!
    expect(projection.sourceNotes).toEqual(
      expect.arrayContaining(record.body.importNotes as string[]),
    )
    expect(projection.sourceNotes?.join('\n')).toContain('hot、pot')
    const changedNote = '用户提供的材料已核对，MARKER 是来源说明。'
    const revised = buildLearningContentFromCourseContent({
      ...record,
      body: { ...record.body, sourceNote: changedNote },
    })!
    expect(revised.sourceNotes).toContain(changedNote)
    expect(revised.steps.map((step) => step.id)).toEqual(projection.steps.map((step) => step.id))
    expect(JSON.stringify(revised.blocks)).not.toContain('MARKER')
    expect(JSON.stringify(record)).toBe(before)
  })

  it('passes actual source notes through the player without adding completion steps or read-aloud copy', async () => {
    const book = productionCurriculumIndex.textbooks.find((book) =>
      productionCurriculumIndex.units.some(
        (unit) => unit.id === context.unitId && unit.textbookVersionId === book.id,
      ),
    )!
    const actualContext = { ...context, textbookId: book.id }
    const result = await lessonPlayerRepository.getLessonPlayerSource(actualContext, 'profile')
    expect(result.source).not.toBeNull()
    const source = result.source!
    const view = buildLessonPlayerViewModel(
      source,
      createLessonSession(actualContext, 'notes-child'),
    )
    expect(view.sourceNotes).toEqual(source.sourceNotes)
    expect(view.sourceNotes?.join('\n')).toContain('hot、pot')
    const spoken = lessonReadingText(view.steps.flatMap((step) => step.contentBlocks))
    expect(spoken).not.toContain('来稿把 hot、pot')
    expect(view.session.completedCount).toBe(0)
  })

  it('keeps notes collapsed by default, deduplicates them and hides an empty panel', () => {
    const wrapper = mount(LessonSourceNotes, {
      props: { notes: ['  版次来自来稿。 ', '版次来自来稿。', '补充稿核对说明\n版次来自来稿。'] },
    })
    expect(wrapper.get('details').attributes('open')).toBeUndefined()
    expect(wrapper.get('summary').text()).toBe('教材来源与校对说明')
    expect(wrapper.findAll('li')).toHaveLength(1)
    wrapper.unmount()
    const empty = mount(LessonSourceNotes, { props: { notes: [] } })
    expect(empty.find('details').exists()).toBe(false)
    empty.unmount()
  })
})
