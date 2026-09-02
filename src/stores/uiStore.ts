import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ResponsiveUiState = 'mobile' | 'tablet' | 'desktop'
export type UiToastType = 'success' | 'info' | 'warning' | 'error'

export interface UiToastState {
  open: boolean
  type: UiToastType
  title: string
  message?: string
}

export const useUiStore = defineStore('ui', () => {
  const loading = ref(false)
  const responsiveState = ref<ResponsiveUiState>('desktop')
  const modal = ref<{ open: boolean; title?: string }>({ open: false })
  const toast = ref<UiToastState>({ open: false, type: 'info', title: '' })

  function setLoading(nextLoading: boolean) {
    loading.value = nextLoading
  }

  function setResponsiveState(nextState: ResponsiveUiState) {
    responsiveState.value = nextState
  }

  function openModal(title?: string) {
    modal.value = { open: true, title }
  }

  function closeModal() {
    modal.value = { open: false }
  }

  function showToast(nextToast: Omit<UiToastState, 'open'>) {
    toast.value = { ...nextToast, open: true }
  }

  function hideToast() {
    toast.value = { ...toast.value, open: false }
  }

  return {
    loading,
    responsiveState,
    modal,
    toast,
    setLoading,
    setResponsiveState,
    openModal,
    closeModal,
    showToast,
    hideToast,
  }
})
