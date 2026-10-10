import { z } from 'zod'
import { accountState } from './accountService'
import { petCloudRequest } from '../pet/petCloud'

export function accountRequest(path: string, method = 'GET', body?: unknown) {
  if (!accountState.username) throw new Error('请先登录账号。')
  return petCloudRequest(path, method, body, accountState.username)
}
export const securityStatusSchema = z.object({
  recoveryEnabled: z.boolean(),
  sessions: z.array(
    z.object({
      id: z.string(),
      device: z.string(),
      createdAt: z.string(),
      expires: z.number(),
      current: z.boolean(),
    }),
  ),
})
export async function securityStatus() {
  return securityStatusSchema.parse(await accountRequest('security'))
}
export async function parentAccess() {
  return z
    .object({ unlocked: z.boolean(), until: z.number() })
    .parse(await accountRequest('parent-access'))
}
