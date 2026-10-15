import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { describe, expect, it } from 'vitest'
import { readingStories } from '@/data/reading-islands'
import { loadedCurriculumCatalog } from '@/services/curriculum/loadedCatalog'

describe('standalone reading bundle boundary', () => {
  it('opens an actual story and its practice without initializing textbook contents', async () => {
    expect(loadedCurriculumCatalog.value).toBeNull()
    const { default: ReadingStoryExperience } =
      await import('@/components/reading-islands/ReadingStoryExperience.vue')
    const pinia = createPinia()
    setActivePinia(pinia)
    const story = readingStories.find((story) => story.id === 'en-red-bag')!
    const wrapper = mount(ReadingStoryExperience, {
      props: { story, profileId: 'standalone-reader', muted: true },
      global: { plugins: [pinia], stubs: { RouterLink: true } },
    })
    await flushPromises()
    expect(wrapper.text()).toContain('Mia')
    expect(wrapper.find('.reading-quest').exists()).toBe(true)
    expect(wrapper.find('.reading-quest__counter').text()).toContain('0')
    expect(loadedCurriculumCatalog.value).toBeNull()
    wrapper.unmount()
  })
})
