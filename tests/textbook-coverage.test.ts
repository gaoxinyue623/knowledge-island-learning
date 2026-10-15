import { afterEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import TextbookCoverage from '@/components/curriculum/TextbookCoverage.vue'
import { curriculumService } from '@/services/runtime'

afterEach(() => vi.restoreAllMocks())
describe('textbook availability overview', () => {
  it('shows all six grades, distinguishes missing subjects from multiple versions, and emits a complete selection', async () => {
    const wrapper = mount(TextbookCoverage, {
      props: { gradeId: 'GRADE_1', semesterId: 'SEMESTER_UPPER' },
    })
    await flushPromises()
    await vi.waitFor(() => expect(wrapper.findAll('.textbook-coverage__row')).toHaveLength(6), {
      timeout: 5000,
    })
    const grade2lower = wrapper
      .findAll('button')
      .find((button) => button.attributes('aria-label')?.startsWith('二年级下册'))!
    expect(grade2lower.attributes('aria-label')).toBe(
      '二年级下册：语文2个版本，数学2个版本，英语1个版本',
    )
    expect(grade2lower.attributes('disabled')).toBeUndefined()
    await grade2lower.trigger('click')
    expect(wrapper.emitted('select')).toEqual([
      [{ gradeId: 'GRADE_2', semesterId: 'SEMESTER_LOWER' }],
    ])
    await wrapper.setProps({ gradeId: 'GRADE_2', semesterId: 'SEMESTER_LOWER' })
    expect(grade2lower.attributes('aria-pressed')).toBe('true')
    const grade3 = wrapper
      .findAll('button')
      .filter((button) => button.attributes('aria-label')?.startsWith('三年级'))
    expect(grade3).toHaveLength(2)
    const upper = grade3.find((button) =>
      button.attributes('aria-label')?.startsWith('三年级上册'),
    )!
    const lower = grade3.find((button) =>
      button.attributes('aria-label')?.startsWith('三年级下册'),
    )!
    expect(upper.attributes('disabled')).toBeUndefined()
    expect(upper.text()).toContain('语文')
    expect(lower.attributes('disabled')).toBeUndefined()
    expect(lower.attributes('aria-label')).toBe('三年级下册：语文1个版本，数学1个版本，英语1个版本')
    wrapper.unmount()
  })

  it('derives newly imported grade options from the catalog instead of a two-grade allow-list', async () => {
    const grades = await curriculumService.getGrades()
    const books = await curriculumService.getTextbookVersions()
    const book = books.find(
      (item) => item.gradeId === 'GRADE_1' && item.semesterId === 'SEMESTER_UPPER',
    )!
    vi.spyOn(curriculumService, 'getGrades').mockResolvedValue([
      ...grades.filter((g) => g.sortOrder !== 3),
      { id: 'new_grade_3', code: 'G3', name: '三年级', sortOrder: 3, status: 'ACTIVE' },
    ])
    vi.spyOn(curriculumService, 'getTextbookVersions').mockResolvedValue([
      ...books.filter((b) => b.gradeId !== 'GRADE_3'),
      { ...book, id: 'imported_g3', gradeId: 'new_grade_3' },
    ])
    const wrapper = mount(TextbookCoverage, { props: { gradeId: null, semesterId: null } })
    await flushPromises()
    const upper = wrapper
      .findAll('button')
      .find((button) => button.attributes('aria-label')?.startsWith('三年级上册'))!
    expect(upper.attributes('disabled')).toBeUndefined()
    await upper.trigger('click')
    expect(wrapper.emitted('select')).toEqual([
      [{ gradeId: 'new_grade_3', semesterId: 'SEMESTER_UPPER' }],
    ])
    wrapper.unmount()
  })

  it('shows a retryable error rather than reporting every textbook as missing on load failure', async () => {
    const spy = vi
      .spyOn(curriculumService, 'getTextbookVersions')
      .mockRejectedValueOnce(new Error('network'))
    const wrapper = mount(TextbookCoverage, {
      props: { gradeId: 'GRADE_1', semesterId: 'SEMESTER_UPPER' },
    })
    await flushPromises()
    expect(wrapper.text()).toContain('接入总览暂时无法加载')
    expect(wrapper.findAll('.textbook-coverage__row')).toHaveLength(0)
    await wrapper.get('button').trigger('click')
    await flushPromises()
    expect(spy).toHaveBeenCalledTimes(2)
    expect(wrapper.findAll('.textbook-coverage__row')).toHaveLength(6)
    expect(wrapper.emitted('availability')?.at(-1)).toEqual([true])
    wrapper.unmount()
  })
})
