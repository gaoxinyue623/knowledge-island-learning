import { z } from 'zod'
import { validatePetAccount, type PetAccount } from './petPolicy'
export const cloudBackupInfoSchema = z.object({
  profileId: z.string(),
  label: z.string(),
  revision: z.number().int().positive(),
  updatedAt: z.string().datetime(),
})
export type CloudBackupInfo = z.infer<typeof cloudBackupInfoSchema>
export type CloudBackup = CloudBackupInfo & { account: PetAccount }
export class PetCloudError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string,
    public details?: unknown,
  ) {
    super(message)
  }
}
export async function petCloudRequest(
  path: string,
  method = 'GET',
  body?: unknown,
  expectedUsername?: string,
): Promise<unknown> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)
  try {
    const response = await fetch(`/api/pet/${path}`, {
      method,
      credentials: 'same-origin',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        'X-Knowledge-Island': 'pet-v2',
        ...(expectedUsername ? { 'X-Pet-Account': expectedUsername } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    })
    const data: unknown = await response.json().catch(() => null)
    if (!response.ok) {
      const error = z.object({ error: z.string(), code: z.string().optional(), details: z.unknown().optional() }).safeParse(data)
      throw new PetCloudError(
        response.status,
        error.success ? error.data.error : '云端服务暂时无法连接，本机记录不受影响。',
        error.success ? error.data.code : undefined,
        error.success ? error.data.details : undefined,
      )
    }
    if (data === null) throw new Error('云端服务返回了无法识别的内容。')
    return data
  } catch (error) {
    if (
      error instanceof TypeError ||
      (error instanceof DOMException && error.name === 'AbortError')
    )
      throw new Error('云端服务暂时无法连接，本机记录不受影响。请稍后再试。')
    throw error
  } finally {
    clearTimeout(timeout)
  }
}
export async function listCloudBackups(username: string): Promise<CloudBackupInfo[]> {
  return z
    .object({ backups: z.array(cloudBackupInfoSchema) })
    .parse(await petCloudRequest('backups', 'GET', undefined, username)).backups
}
export async function readCloudBackup(profileId: string, username: string): Promise<CloudBackup> {
  const result = cloudBackupInfoSchema
    .extend({ account: z.unknown() })
    .parse(
      await petCloudRequest(
        `backup?profileId=${encodeURIComponent(profileId)}`,
        'GET',
        undefined,
        username,
      ),
    )
  if (result.profileId !== profileId) throw new Error('云端备份档案不匹配，未恢复。')
  return { ...result, account: validatePetAccount(result.account, profileId) }
}
