import { onBeforeUnmount, ref, type Ref } from 'vue'

// Pointer dragging and click/keyboard placement share the same checked move operation.
export function usePieceTransfer(
  root: Ref<HTMLElement | null>,
  place: (piece: string, zone: string) => void,
) {
  const selected = ref<string | null>(null)
  const dragging = ref(false)
  const point = ref({ x: 0, y: 0 })
  let pointer: { id: number; piece: string; x: number; y: number } | null = null
  let suppressClick = false
  let clickTimer: ReturnType<typeof setTimeout> | undefined
  function clean() {
    window.removeEventListener('pointermove', move)
    window.removeEventListener('pointerup', end)
    window.removeEventListener('pointercancel', cancel)
    pointer = null
    dragging.value = false
  }
  function cancel() {
    clean()
    clearTimeout(clickTimer)
    suppressClick = false
    selected.value = null
  }
  function move(event: PointerEvent) {
    if (!pointer || event.pointerId !== pointer.id) return
    point.value = { x: event.clientX, y: event.clientY }
    if (Math.hypot(event.clientX - pointer.x, event.clientY - pointer.y) > 7) dragging.value = true
    if (dragging.value) event.preventDefault()
  }
  function end(event: PointerEvent) {
    if (!pointer || event.pointerId !== pointer.id) return
    if (dragging.value) {
      const target = document
        .elementFromPoint(event.clientX, event.clientY)
        ?.closest<HTMLElement>('[data-drop-zone]')
      if (target && root.value?.contains(target))
        place(pointer.piece, target.dataset.dropZone ?? '')
      suppressClick = true
      clearTimeout(clickTimer)
      clickTimer = setTimeout(() => {
        suppressClick = false
      }, 0)
      selected.value = null
    }
    clean()
  }
  function start(event: PointerEvent, piece: string) {
    if (event.button !== 0 || event.isPrimary === false) return
    clean()
    suppressClick = false
    selected.value = piece
    pointer = { id: event.pointerId, piece, x: event.clientX, y: event.clientY }
    point.value = { x: event.clientX, y: event.clientY }
    window.addEventListener('pointermove', move, { passive: false })
    window.addEventListener('pointerup', end)
    window.addEventListener('pointercancel', cancel)
  }
  function choose(piece: string) {
    if (suppressClick) {
      suppressClick = false
      return
    }
    selected.value = piece
  }
  function drop(zone: string) {
    if (suppressClick) {
      suppressClick = false
      return
    }
    if (!selected.value) return
    place(selected.value, zone)
    selected.value = null
  }
  onBeforeUnmount(cancel)
  return { selected, dragging, point, start, choose, drop, cancel }
}
