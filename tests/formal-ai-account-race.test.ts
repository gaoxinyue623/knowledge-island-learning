import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { selectAccount, pointerKey } from '@/services/account/storage'
import { aiRequest } from '@/services/formal-ai/client'
beforeEach(() => {
  localStorage.clear()
  selectAccount('parent_a')
})
afterEach(() => {
  selectAccount(null)
  vi.unstubAllGlobals()
})
it.each(['account', 'generation', 'logout'])(
  'rejects a late AI response after a %s change',
  async (kind) => {
    let resolve!: (r: Response) => void
    vi.stubGlobal(
      'fetch',
      vi.fn(
        () =>
          new Promise<Response>((r) => {
            resolve = r
          }),
      ),
    )
    const request = aiRequest('ai/learning?profileId=student', { username: 'parent_a' })
    const rejected = expect(request).rejects.toMatchObject({ code: 'SESSION_CHANGED' })
    if (kind === 'generation') {
      localStorage.setItem(pointerKey('parent_a'), 'v2')
      selectAccount('parent_a')
    } else selectAccount(kind === 'logout' ? null : 'parent_b')
    resolve(new Response(JSON.stringify({ signals: [] }), { status: 200 }))
    await rejected
  },
)
