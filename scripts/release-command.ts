import { spawnSync } from 'node:child_process'

export interface NpmCommandOptions {
  nodePath?: string
  npmExecPath?: string
  platform?: NodeJS.Platform
}

export interface NpmCommand {
  command: string
  args: string[]
}

export type CommandRunner = (
  command: string,
  args: string[],
  options: { stdio: 'inherit'; env: NodeJS.ProcessEnv },
) => { status: number | null; error?: Error }

export function buildNpmCommand(args: string[], options: NpmCommandOptions = {}): NpmCommand {
  const npmExecPath = (options.npmExecPath ?? process.env.npm_execpath)?.trim()
  if (npmExecPath) {
    return {
      command: options.nodePath ?? process.execPath,
      args: [npmExecPath, ...args],
    }
  }
  if ((options.platform ?? process.platform) === 'win32') {
    throw new Error('Windows release checks require npm_execpath from an npm script.')
  }
  return { command: 'npm', args: [...args] }
}

export function runNpmCommand(
  args: string[],
  runner: CommandRunner = spawnSync,
  options: NpmCommandOptions = {},
): boolean {
  try {
    const command = buildNpmCommand(args, options)
    const result = runner(command.command, command.args, { stdio: 'inherit', env: process.env })
    return !result.error && result.status === 0
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Unable to start npm release check.')
    return false
  }
}
