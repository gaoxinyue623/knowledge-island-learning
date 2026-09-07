<script setup lang="ts">
defineProps<{ islandId: string }>()
</script>
<template>
  <svg
    class="thinking-island-art"
    viewBox="0 0 320 180"
    fill="none"
    aria-hidden="true"
    focusable="false"
  >
    <ellipse cx="161" cy="160" rx="112" ry="10" fill="#254a45" opacity=".09" />
    <path
      d="M44 117Q160 96 277 117L260 141Q165 176 65 142Z"
      fill="#c1aa85"
      stroke="#a18d6e"
      stroke-width="2"
    />
    <ellipse
      cx="160"
      cy="113"
      rx="116"
      ry="34"
      fill="var(--thinking-soft, #e8f2df)"
      stroke="var(--thinking-color, #486f56)"
      stroke-width="2"
    />
    <path
      d="M76 125Q118 86 157 122T249 118"
      stroke="#f8deb0"
      stroke-width="13"
      stroke-linecap="round"
    />
    <path
      d="M76 125Q118 86 157 122T249 118"
      stroke="#caa96f"
      stroke-width="2"
      stroke-dasharray="3 7"
    />
    <g stroke="#56705b" stroke-width="2.5" stroke-linejoin="round">
      <path d="M66 107V76" stroke="#a18159" stroke-width="5" />
      <path
        d="M46 76Q32 59 46 48Q40 26 64 27Q83 20 89 43Q104 50 92 72Q72 91 46 76Z"
        fill="#9cbe8c"
      />
      <path d="M66 44V74M66 61L80 52" />
    </g>
    <g v-if="islandId === 'patterns'" stroke="#587665" stroke-width="2.5">
      <path d="M105 97V57H235V100" stroke="#aa916d" stroke-width="7" />
      <path d="M108 57L230 57" />
      <circle cx="127" cy="82" r="16" fill="#83baa0" />
      <path d="M171 66L188 96H154Z" fill="#f4cf70" />
      <rect x="201" y="66" width="30" height="30" rx="5" fill="#89adcf" />
      <path d="M112 129L112 113H234V129" stroke="#a88e61" stroke-width="5" />
      <circle cx="129" cy="122" r="10" fill="#83baa0" />
      <path d="M169 111L180 132H158Z" fill="#f4cf70" />
      <rect x="205" y="112" width="20" height="20" rx="3" fill="#89adcf" />
    </g>
    <g v-else-if="islandId === 'logic'" stroke="#725b86" stroke-width="2.5" stroke-linejoin="round">
      <rect x="110" y="42" width="91" height="87" rx="12" fill="#fff9e9" />
      <path d="M135 37H175V48H135Z" fill="#c1a7cd" />
      <path d="M126 67H173M126 82H160M126 97H166" stroke="#bfabbe" stroke-width="4" />
      <circle cx="205" cy="82" r="29" fill="#d1e9df" fill-opacity=".85" />
      <path d="M224 104L245 132" stroke="#a77a70" stroke-width="12" stroke-linecap="round" />
      <path d="M194 83L202 91L218 71" stroke="#6b9e8d" stroke-width="5" />
    </g>
    <g v-else-if="islandId === 'space'" stroke="#527d90" stroke-width="2.5" stroke-linejoin="round">
      <path d="M118 62L167 40L217 62L168 89Z" fill="#f0d59c" />
      <path d="M118 62V116L168 143V89Z" fill="#81b7c9" />
      <path d="M217 62V116L168 143V89Z" fill="#c3dce1" />
      <path d="M135 85L154 96M135 103L154 114M186 104L202 95" />
      <path
        d="M228 38Q274 51 246 84M243 66L246 84L263 77"
        stroke="#d7996d"
        stroke-width="5"
        stroke-linecap="round"
      />
    </g>
    <g v-else stroke="#896647" stroke-width="2.5" stroke-linejoin="round">
      <path d="M102 100H240V115H102Z" fill="#dbb081" />
      <path d="M117 115V139M226 115V139" stroke-width="8" />
      <rect x="112" y="68" width="38" height="31" rx="6" fill="#a8c9a1" />
      <rect x="160" y="51" width="30" height="48" rx="5" fill="#f3ce7c" />
      <rect x="199" y="77" width="32" height="22" rx="4" fill="#cf9fb4" />
      <path d="M130 25V44M119 35H141" stroke="#bd9b4d" stroke-width="4" />
      <path d="M244 46L247 54L255 57L247 60L244 68L241 60L233 57L241 54Z" fill="#f3d687" />
    </g>
    <path
      d="M245 109V80M246 80H266L259 89L266 98H246"
      stroke="#887c59"
      stroke-width="2"
      fill="#f0cc76"
    />
    <g fill="#fff9e9">
      <path d="M11 34Q10 24 22 22Q26 9 37 17Q47 13 52 26Q62 27 60 35Z" />
      <path d="M256 25Q260 9 273 17Q280 11 287 25Q299 23 301 37H256Z" />
    </g>
  </svg>
</template>
