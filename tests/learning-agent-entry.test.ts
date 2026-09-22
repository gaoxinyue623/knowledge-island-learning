import { describe, expect, it } from 'vitest'
import router from '@/router'

describe('learning agent entry', () => {
  it('exposes a short direct development route that resolves to the agent page', () => {
    const resolved = router.resolve('/agent')
    expect(resolved.matched.some((record) => record.meta.devOnly)).toBe(true)
    expect(resolved.matched.some((record) => record.redirect === '/dev/learning-agent')).toBe(true)
    expect(router.resolve('/dev/learning-agent').matched.at(-1)?.meta.title).toBe(
      'Learning Agent Simulation',
    )
  })
})
