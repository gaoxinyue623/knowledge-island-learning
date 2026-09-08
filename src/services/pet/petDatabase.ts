import { freshPetAccount, PetDataError, validatePetAccount, type PetAccount } from './petPolicy'

export const PET_DATABASE_NAME = 'knowledge-island.pet.v1'
export interface PetRepository {
  update(profileId: string, change: (account: PetAccount) => PetAccount): Promise<PetAccount>
  read(profileId: string): Promise<PetAccount | null>
  putNewProfile(profileId: string, account: PetAccount): Promise<void>
  deleteProfile(profileId: string): Promise<void>
}
export function createPetRepository(
  factory: () => IDBFactory | undefined = () => globalThis.indexedDB,
  databaseName = PET_DATABASE_NAME,
): PetRepository {
  function open(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const api = factory()
      if (!api)
        return reject(
          new PetDataError('浏览器暂不支持宠物存储。学习仍可继续，请使用支持本地数据库的浏览器。'),
        )
      const request = api.open(databaseName, 2)
      let cancelled = false
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains('accounts'))
          request.result.createObjectStore('accounts', { keyPath: 'profileId' })
      }
      request.onsuccess = () => {
        if (cancelled) {
          request.result.close()
          return
        }
        request.result.onversionchange = () => request.result.close()
        resolve(request.result)
      }
      request.onerror = () => reject(new PetDataError('宠物记录暂时无法打开，请重试。'))
      request.onblocked = () => {
        cancelled = true
        reject(new PetDataError('另一个页面正在使用旧版宠物记录。请关闭旧页面后重试。'))
      }
    })
  }
  return {
    async read(profileId) {
      const database = await open()
      return new Promise<PetAccount | null>((resolve, reject) => {
        const transaction = database.transaction('accounts', 'readonly')
        const request = transaction.objectStore('accounts').get(profileId)
        request.onsuccess = () => {
          try {
            resolve(request.result === undefined ? null : validatePetAccount(request.result, profileId))
          } catch (error) {
            reject(error)
          } finally {
            database.close()
          }
        }
        request.onerror = () => { database.close(); reject(new PetDataError('宠物记录暂时无法读取，请重试。')) }
      })
    },
    async putNewProfile(profileId, account) {
      const database = await open()
      return new Promise<void>((resolve, reject) => {
        let failure: unknown
        const transaction = database.transaction('accounts', 'readwrite')
        const store = transaction.objectStore('accounts')
        const request = store.get(profileId)
        request.onsuccess = () => {
          try {
            if (request.result !== undefined) throw new PetDataError('目标档案已存在，未覆盖原宠物记录。')
            store.put(validatePetAccount(account, profileId))
          } catch (error) { failure = error; transaction.abort() }
        }
        transaction.oncomplete = () => { database.close(); resolve() }
        transaction.onabort = () => { database.close(); reject(failure ?? new PetDataError('宠物记录没有保存。')) }
      })
    },
    async deleteProfile(profileId) {
      const database = await open()
      return new Promise<void>((resolve, reject) => {
        const transaction = database.transaction('accounts', 'readwrite')
        transaction.objectStore('accounts').delete(profileId)
        transaction.oncomplete = () => { database.close(); resolve() }
        transaction.onabort = () => { database.close(); reject(new PetDataError('宠物记录没有清理。')) }
      })
    },
    async update(profileId, change) {
      const database = await open()
      return new Promise<PetAccount>((resolve, reject) => {
        let next: PetAccount | undefined, failure: unknown
        const transaction = database.transaction('accounts', 'readwrite')
        const store = transaction.objectStore('accounts')
        const request = store.get(profileId)
        request.onsuccess = () => {
          try {
            const current =
              request.result === undefined
                ? freshPetAccount(profileId)
                : validatePetAccount(request.result, profileId)
            next = validatePetAccount(change(current), profileId)
            if (
              request.result === undefined ||
              JSON.stringify(request.result) !== JSON.stringify(next)
            )
              store.put(next)
          } catch (error) {
            failure = error
            transaction.abort()
          }
        }
        transaction.oncomplete = () => {
          database.close()
          resolve(next!)
        }
        transaction.onabort = () => {
          database.close()
          reject(
            failure instanceof PetDataError
              ? failure
              : new PetDataError('这次操作没有保存，积分、食物和经验均未改变。请重试。'),
          )
        }
        transaction.onerror = () => {
          /* onabort reports transaction failures. */
        }
      })
    },
  }
}
export const petRepository = createPetRepository()
