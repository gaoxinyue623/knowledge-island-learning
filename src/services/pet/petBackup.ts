import { PetDataError, validatePetAccount, type PetAccount } from './petPolicy'
export function extendsPetHistory(earlier: PetAccount, later: PetAccount): boolean {
  return (
    earlier.policyVersion === later.policyVersion &&
    earlier.events.length <= later.events.length &&
    earlier.events.every((e, i) => JSON.stringify(e) === JSON.stringify(later.events[i]))
  )
}
export function restorePetBackup(current: PetAccount, value: unknown): PetAccount {
  const incoming = validatePetAccount(value, current.profileId)
  if (extendsPetHistory(incoming, current)) return current
  if (extendsPetHistory(current, incoming)) return incoming
  throw new PetDataError(
    '本机与备份已有不同记录，未覆盖任何数据。请在原设备继续使用，或将另一份记录保存为独立备份。',
  )
}
