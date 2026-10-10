import { validatePetAccount, type PetAccount } from '../pet/petPolicy'
export async function accountPets(
  databaseName: string,
  replacement?: PetAccount[],
): Promise<PetAccount[]> {
  const database = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(databaseName, 2)
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains('accounts'))
        request.result.createObjectStore('accounts', { keyPath: 'profileId' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(new Error('宠物记录无法读取，请重试。'))
    request.onblocked = () => reject(new Error('请关闭旧版页面后重试。'))
  })
  try {
    return await new Promise<PetAccount[]>((resolve, reject) => {
      const tx = database.transaction('accounts', replacement ? 'readwrite' : 'readonly')
      const store = tx.objectStore('accounts')
      if (replacement) {
        store.clear()
        for (const pet of replacement) store.put(validatePetAccount(pet, pet.profileId))
      }
      const request = store.getAll()
      tx.oncomplete = () => {
        try {
          resolve((request.result as PetAccount[]).map((p) => validatePetAccount(p, p.profileId)))
        } catch (error) {
          reject(error)
        }
      }
      tx.onabort = () => reject(new Error('宠物记录未能保存。'))
      tx.onerror = () => {
        /* onabort reports failures */
      }
    })
  } finally {
    database.close()
  }
}
