<script setup lang="ts">
defineProps<{ kind: 'ball' | 'book' | 'bear' | 'rock' | 'flag' | 'supply' | 'start' }>()
</script>
<template>
  <svg viewBox="0 0 80 80" class="workshop-object" aria-hidden="true" focusable="false">
    <g v-if="kind === 'ball'" stroke="#a65044" stroke-width="3">
      <circle cx="40" cy="40" r="28" fill="#ef927b" />
      <path d="M15 28q27 5 45 31M29 14q-3 35 24 50M15 53q22-25 50-22" fill="none" />
      <ellipse cx="31" cy="25" rx="7" ry="4" fill="#fff0d0" stroke="none" />
    </g>
    <g v-else-if="kind === 'book'" stroke="#477a93" stroke-width="3" stroke-linejoin="round">
      <path d="M15 18l38-5 13 9v45l-38-1-13-9z" fill="#b7d9e9" />
      <path d="M15 18l13 9 38-5M28 27v39" fill="none" />
      <path d="M36 39l21-2M36 46l15-1" stroke="#fffaf0" stroke-width="4" />
      <path d="M17 56l12 8 34-1" fill="none" />
    </g>
    <g v-else-if="kind === 'bear'" stroke="#926b42" stroke-width="2.5">
      <circle cx="22" cy="22" r="11" fill="#dcb875" />
      <circle cx="58" cy="22" r="11" fill="#dcb875" />
      <ellipse cx="40" cy="55" rx="22" ry="21" fill="#e8c78a" />
      <circle cx="40" cy="32" r="24" fill="#e8c78a" />
      <ellipse cx="40" cy="41" rx="13" ry="9" fill="#fff0d0" />
      <circle cx="30" cy="30" r="2" fill="#634c39" />
      <circle cx="50" cy="30" r="2" fill="#634c39" />
      <path d="M37 39q3-3 6 0l-3 3z" fill="#634c39" />
      <path d="M35 46q5 5 10 0" fill="none" />
    </g>
    <g v-else-if="kind === 'rock'" stroke="#74877c" stroke-width="3" stroke-linejoin="round">
      <path d="M9 58l11-31 24-12 23 20 7 27-36 6z" fill="#b6c4b8" />
      <path d="M20 27l17 10 7-22M37 37l-3 28M37 37l30-2" fill="none" />
      <path d="M12 58l20 7 10-15" fill="#91a89a" stroke="none" />
    </g>
    <g v-else-if="kind === 'flag'" stroke="#956e42" stroke-width="3" stroke-linejoin="round">
      <ellipse cx="33" cy="68" rx="18" ry="5" fill="#dbc9a4" />
      <path d="M29 67V12" />
      <path d="M30 14h37L54 28l13 14H30" fill="#efbd64" />
      <path d="M36 28l6 6 12-13" fill="none" stroke="#fffaf0" stroke-width="4" />
    </g>
    <g v-else-if="kind === 'supply'" stroke="#7b885a" stroke-width="3" stroke-linejoin="round">
      <path d="M23 26q0-22 17-22t17 22" fill="none" />
      <rect x="17" y="23" width="46" height="48" rx="12" fill="#cedaa1" />
      <rect x="26" y="43" width="28" height="19" rx="6" fill="#f6efd1" />
      <path d="M40 33v-8M36 29h8" stroke="#fff" />
    </g>
    <g v-else stroke="#649882" stroke-width="3">
      <circle cx="40" cy="40" r="26" fill="#e0edcb" />
      <path d="M32 24l22 16-22 16z" fill="#81b299" />
    </g>
  </svg>
</template>
<style scoped>
.workshop-object {
  display: block;
  width: 100%;
  height: auto;
}
</style>
