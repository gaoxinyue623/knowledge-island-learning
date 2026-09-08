export const PET_LEARNING_CHANGED = 'knowledge-island:learning-reward-changed'
export const PET_ACCOUNT_CHANGED = 'knowledge-island:pet-account-changed'
export function notifyPetLearningChanged() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(PET_LEARNING_CHANGED))
}
