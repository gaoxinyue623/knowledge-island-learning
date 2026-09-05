<script setup lang="ts">
withDefaults(defineProps<{ subject?: 'CHINESE' | 'MATH' | 'ENGLISH' }>(), { subject: 'CHINESE' })
</script>

<template>
  <svg
    class="subject-habitat"
    viewBox="0 0 320 180"
    fill="none"
    aria-hidden="true"
    focusable="false"
  >
    <ellipse cx="164" cy="158" rx="118" ry="13" fill="#315F59" opacity=".09" />
    <path
      d="M43 128Q43 101 104 95L213 95Q277 99 279 125L266 143Q240 169 115 157Q52 155 43 128Z"
      fill="#BDA883"
    />
    <ellipse
      cx="161"
      cy="121"
      rx="119"
      ry="34"
      fill="#A8CEA0"
      stroke="#648C6E"
      stroke-width="2.5"
    />
    <path
      d="M61 129Q103 99 153 122T261 116"
      stroke="#F8E6B3"
      stroke-width="14"
      stroke-linecap="round"
    />
    <path
      d="M64 131Q104 107 151 128T257 119"
      stroke="#DDBF85"
      stroke-width="2"
      stroke-dasharray="3 8"
      stroke-linecap="round"
    />
    <g stroke="#477867" stroke-width="2.5" stroke-linejoin="round">
      <path d="M73 110V73" stroke="#907856" stroke-width="6" />
      <path
        d="M45 74Q35 55 53 49Q49 27 70 25Q92 24 95 46Q113 49 105 69Q100 86 74 82Q53 89 45 74Z"
        fill="#79B48E"
      />
      <path d="M77 46V78M77 63L88 52M77 70L62 60" stroke="#568F74" />
      <path d="M251 116V92" stroke="#907856" stroke-width="5" />
      <path
        d="M231 90Q222 77 234 71Q235 55 250 57Q267 55 271 71Q284 84 269 94Q248 102 231 90Z"
        fill="#BAD483"
      />
    </g>
    <g v-if="subject === 'CHINESE'" stroke="#655B47" stroke-width="2.5" stroke-linejoin="round">
      <path d="M113 56L163 29L216 55V118Q188 132 163 129Q135 130 113 118Z" fill="#F7D096" />
      <path d="M100 61L162 22L226 60L216 69L162 40L110 70Z" fill="#D98669" />
      <path d="M148 126V91Q162 75 177 91V127" fill="#548D7D" />
      <circle cx="165" cy="108" r="2" fill="#F9D579" stroke="none" />
      <rect x="123" y="71" width="16" height="18" rx="5" fill="#FFF5D8" />
      <rect x="185" y="71" width="16" height="18" rx="5" fill="#FFF5D8" />
      <path d="M113 138Q131 129 149 137V157Q132 149 113 154Z" fill="#FFF9E8" />
      <path d="M149 137Q168 128 183 134V153Q166 150 149 157Z" fill="#FFF9E8" />
      <path
        d="M120 140L141 141M158 140L176 137M121 147L137 148"
        stroke="#C6B993"
        stroke-width="2"
      />
    </g>
    <g v-else-if="subject === 'MATH'" stroke="#526A72" stroke-width="2.5" stroke-linejoin="round">
      <path d="M119 70L162 49L204 70L163 92Z" fill="#A5CED5" />
      <path d="M119 70V119L163 139V92Z" fill="#79AFC5" />
      <path d="M204 70V119L163 139V92Z" fill="#D5E9DF" />
      <path d="M168 50L199 28L228 53L194 67Z" fill="#F6CB75" />
      <path d="M194 67L199 28L208 62Z" fill="#E5AC66" />
      <circle cx="118" cy="111" r="24" fill="#ECA58C" />
      <path d="M107 112H129M118 101V123" stroke="#FFF8E7" stroke-width="5" stroke-linecap="round" />
      <path d="M205 126L227 113L246 128L225 142Z" fill="#F8DB8C" />
      <path d="M205 126V145L225 158V142M246 128V145L225 158" fill="#E8BF7C" />
    </g>
    <g v-else stroke="#546F69" stroke-width="2.5" stroke-linejoin="round">
      <path d="M138 67H191L207 124Q175 139 124 124Z" fill="#F3D39B" />
      <path d="M133 70L144 46H187L199 70Z" fill="#DB8E78" />
      <path d="M144 46V29H187V46" fill="#FFF5DE" />
      <path d="M135 28L165 9L196 28Z" fill="#6FABB0" />
      <path d="M151 123V99Q165 89 178 99V128" fill="#73A499" />
      <path d="M149 79H185M152 86H182" stroke="#D6AF72" />
      <path d="M99 58Q128 36 171 27" stroke="#8BB8B0" stroke-dasharray="3 6" />
      <path d="M182 37L245 20L219 66L211 46Z" fill="#FFFDF0" />
      <path d="M211 46L245 20L216 53" fill="#CBE3D8" />
      <path d="M75 140V103M71 104H101L91 113L101 122H75" fill="#F2BF77" />
    </g>
    <g fill="#FFFAE9">
      <path d="M20 40Q20 32 29 31Q31 16 45 21Q53 16 58 28Q68 28 68 40Z" />
      <path d="M249 36Q249 27 260 27Q265 14 276 20Q289 19 290 32Q300 34 298 41H249Z" />
    </g>
    <g fill="#FFF0BC" stroke="#D9B96E" stroke-width="1.5">
      <path d="M106 13L108 19L114 21L108 23L106 29L104 23L98 21L104 19Z" />
      <path d="M282 101L284 107L290 109L284 111L282 117L280 111L274 109L280 107Z" />
    </g>
    <g fill="#FFF3CE">
      <circle cx="59" cy="116" r="3" />
      <circle cx="65" cy="120" r="2" />
      <circle cx="231" cy="144" r="3" />
      <circle cx="237" cy="147" r="2" />
    </g>
  </svg>
</template>
