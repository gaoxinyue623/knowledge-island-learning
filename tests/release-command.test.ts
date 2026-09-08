import { describe, expect, it, vi } from 'vitest'
import { buildNpmCommand, runNpmCommand } from '../scripts/release-command'

describe('release command runner', () => {
  it('uses the current Node runtime to execute npm when npm_execpath is available', () => {
    expect(
      buildNpmCommand(['run', 'lint'], {
        nodePath: '/node/bin/node',
        npmExecPath: '/node/lib/node_modules/npm/bin/npm-cli.js',
        platform: 'win32',
      }),
    ).toEqual({
      command: '/node/bin/node',
      args: ['/node/lib/node_modules/npm/bin/npm-cli.js', 'run', 'lint'],
    })
  })

  it('fails explicitly on Windows when npm_execpath is unavailable', () => {
    expect(() =>
      buildNpmCommand(['test'], {
        nodePath: '/node/bin/node',
        npmExecPath: '',
        platform: 'win32',
      }),
    ).toThrow('require npm_execpath')
    expect(
      buildNpmCommand(['test'], {
        nodePath: '/node/bin/node',
        npmExecPath: '',
        platform: 'linux',
      }),
    ).toEqual({
      command: 'npm',
      args: ['test'],
    })
  })

  it('returns false when a child command exits nonzero or cannot start', () => {
    const failed = vi.fn(() => ({ status: 1 }))
    expect(
      runNpmCommand(['run', 'lint'], failed, { nodePath: '/node', npmExecPath: '/npm.js' }),
    ).toBe(false)

    const unavailable = vi.fn(() => ({ status: null, error: new Error('ENOENT') }))
    expect(
      runNpmCommand(['run', 'lint'], unavailable, { nodePath: '/node', npmExecPath: '/npm.js' }),
    ).toBe(false)
  })
})
