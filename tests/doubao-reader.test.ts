import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, ref } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useEnglishReadAloud } from '@/composables/useEnglishReadAloud'
import EnglishReadAloud from '@/components/lesson-player/EnglishReadAloud.vue'
import ListenPlaceWorkshop from '@/components/hands-on/ListenPlaceWorkshop.vue'

class FakeAudio {
  static instances: FakeAudio[] = []
  onended: (() => void) | null = null
  onerror: (() => void) | null = null
  playbackRate = 1
  preservesPitch = true
  pause = vi.fn()
  removeAttribute = vi.fn()
  play = vi.fn(async () => {})
  constructor(readonly src: string) {
    FakeAudio.instances.push(this)
  }
}
const wrappers: ReturnType<typeof mount>[] = []
let fetcher: ReturnType<typeof vi.fn>
beforeEach(() => {
  FakeAudio.instances = []
  vi.stubGlobal('Audio', FakeAudio)
  vi.stubGlobal('speechSynthesis', undefined)
  fetcher = vi.fn(
    async () => new Response(new Blob(['ID3fake']), { headers: { 'Content-Type': 'audio/mpeg' } }),
  )
  vi.stubGlobal('fetch', fetcher)
  vi.stubGlobal(
    'URL',
    Object.assign(class extends URL {}, {
      createObjectURL: vi.fn(() => 'blob:test'),
      revokeObjectURL: vi.fn(),
    }),
  )
})
afterEach(() => {
  wrappers.splice(0).forEach((w) => w.unmount())
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})
function harness() {
  const segments = ref([
      { id: '1', text: 'Hello.', section: 'dialogue' as const },
      { id: '2', text: 'Goodbye.', section: 'dialogue' as const },
    ]),
    muted = ref(false)
  let reader!: ReturnType<typeof useEnglishReadAloud>
  wrappers.push(
    mount(
      defineComponent({
        setup() {
          reader = useEnglishReadAloud(segments, muted)
          return () => null
        },
      }),
    ),
  )
  return { reader, segments, muted }
}
describe('opt-in Doubao reader', () => {
  it('defaults to browser and sends nothing on provider selection; works without a system voice', async () => {
    const { reader } = harness()
    expect(reader.provider.value).toBe('browser')
    reader.provider.value = 'doubao'
    expect(fetcher).not.toHaveBeenCalled()
    expect(reader.unavailable.value).toBe('')
    reader.replay()
    await flushPromises()
    expect(fetcher).toHaveBeenCalledTimes(1)
    const [, init] = fetcher.mock.calls[0]!
    expect(JSON.parse(init.body)).toEqual({ text: 'Hello.' })
    expect(init.headers).not.toHaveProperty('X-Api-Key')
    expect(reader.state.value).toBe('speaking')
    expect(FakeAudio.instances[0]?.playbackRate).toBe(0.85)
    FakeAudio.instances[0]?.onended?.()
    expect(reader.state.value).toBe('waiting')
  })
  it('aborts and ignores stale responses after provider switch', async () => {
    let resolve!: (r: Response) => void
    fetcher.mockImplementationOnce(
      () =>
        new Promise<Response>((r) => {
          resolve = r
        }),
    )
    const { reader } = harness()
    reader.provider.value = 'doubao'
    reader.play()
    const signal = fetcher.mock.calls[0]![1].signal as AbortSignal
    reader.provider.value = 'browser'
    expect(signal.aborted).toBe(true)
    resolve(new Response('ID3late', { headers: { 'Content-Type': 'audio/mpeg' } }))
    await flushPromises()
    expect(FakeAudio.instances).toHaveLength(0)
    expect(reader.state.value).toBe('idle')
  })
  it('stops on mute, rate, context and unmount and revokes audio URLs', async () => {
    const { reader, muted, segments } = harness()
    reader.provider.value = 'doubao'
    reader.play()
    await flushPromises()
    muted.value = true
    expect(FakeAudio.instances[0]?.pause).toHaveBeenCalled()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test')
    muted.value = false
    reader.play()
    await flushPromises()
    reader.rate.value = 1
    expect(reader.state.value).toBe('idle')
    reader.play()
    await flushPromises()
    segments.value = [{ id: 'new', text: 'New.', section: 'dialogue' }]
    expect(reader.index.value).toBe(0)
    expect(reader.state.value).toBe('idle')
    reader.play()
    await flushPromises()
    wrappers[0]!.unmount()
    expect(FakeAudio.instances.at(-1)?.pause).toHaveBeenCalled()
  })
  it('continues only in explicit continuous mode and handles server failure without retry', async () => {
    const { reader } = harness()
    reader.provider.value = 'doubao'
    reader.mode.value = 'continuous'
    reader.play()
    await flushPromises()
    FakeAudio.instances[0]?.onended?.()
    await flushPromises()
    expect(fetcher).toHaveBeenCalledTimes(2)
    FakeAudio.instances[1]?.onended?.()
    expect(reader.state.value).toBe('finished')
    fetcher.mockResolvedValueOnce(
      new Response(JSON.stringify({ message: '请检查音色权限。' }), { status: 502 }),
    )
    reader.replay()
    await flushPromises()
    expect(reader.error.value).toContain('音色权限')
    expect(fetcher).toHaveBeenCalledTimes(3)
  })
  it('has selectable providers in both reading and listening practice, with visible cost notice', async () => {
    for (const component of [EnglishReadAloud, ListenPlaceWorkshop]) {
      const props =
        component === EnglishReadAloud
          ? { blocks: [{ id: '1', sort: 1, type: 'intro', content: 'Hello!' }] }
          : { profileId: 'test', contextId: 'test', muted: false }
      const wrapper = mount(component as typeof EnglishReadAloud, { props: props as never })
      wrappers.push(wrapper)
      expect(wrapper.get('.speech-provider select').element).toHaveProperty('value', 'browser')
      await wrapper.get('.speech-provider select').setValue('doubao')
      expect(wrapper.get('.speech-provider').text()).toContain('可能计费')
      expect(fetcher).not.toHaveBeenCalled()
    }
  })
})
