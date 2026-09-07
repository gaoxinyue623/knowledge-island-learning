<script setup lang="ts">
import { computed, ref } from 'vue'
import type {
  EarlyMathQuestVisual,
  LowerMathQuestVisual,
  MathQuestVisual,
} from '@/types/reading-quest'
import EarlyMathVisual from './EarlyMathVisual.vue'
import LowerMathVisual from './LowerMathVisual.vue'
const props = defineProps<{ visual: MathQuestVisual }>()
const earlyVisual = computed((): EarlyMathQuestVisual | null => {
  const visual = props.visual
  return visual.type === 'counters' ||
    visual.type === 'part-whole' ||
    visual.type === 'queue' ||
    visual.type === 'classification' ||
    visual.type === 'classroom' ||
    visual.type === 'solids'
    ? visual
    : null
})
const grouping = ref<'rows' | 'columns'>('rows')
const lowerVisual = computed((): LowerMathQuestVisual | null => {
  const v = props.visual
  return v.type === 'ten-bridge' ||
    v.type === 'abacus' ||
    v.type === 'number-grid' ||
    v.type === 'column-calculation' ||
    v.type === 'plane-cards' ||
    v.type === 'paper-change' ||
    v.type === 'tangram'
    ? v
    : null
})
</script>

<template>
  <figure class="math-visual">
    <EarlyMathVisual v-if="earlyVisual" :visual="earlyVisual" />
    <LowerMathVisual v-else-if="lowerVisual" :visual="lowerVisual" />
    <template v-else-if="visual.type === 'array'">
      <div class="math-visual__tools" aria-label="切换方阵观察方向">
        <button type="button" :aria-pressed="grouping === 'rows'" @click="grouping = 'rows'">
          横着分组
        </button>
        <button type="button" :aria-pressed="grouping === 'columns'" @click="grouping = 'columns'">
          竖着分组
        </button>
      </div>
      <div
        class="math-array"
        :style="{ gridTemplateColumns: `repeat(${visual.columns}, 1fr)` }"
        role="img"
        :aria-label="`${visual.rows}行，每行${visual.columns}个圆点`"
      >
        <template v-for="row in visual.rows" :key="row">
          <span
            v-for="col in visual.columns"
            :key="col"
            :class="{ 'math-array__alternate': (grouping === 'rows' ? row : col) % 2 === 0 }"
          />
        </template>
      </div>
      <figcaption>
        {{ visual.rows }} 行 · 每行 {{ visual.columns }} 个。试着换个方向看，用换色区分相邻的组。
      </figcaption>
    </template>
    <template v-else-if="visual.type === 'place-value'">
      <div
        class="math-place"
        role="img"
        :aria-label="`${Math.floor(visual.value / 10)}根十位长条，${visual.value % 10}个个位方块`"
      >
        <div>
          <strong>十</strong>
          <div class="math-place__tens">
            <span v-for="n in Math.floor(visual.value / 10)" :key="n"
              ><i v-for="j in 10" :key="j"
            /></span>
          </div>
        </div>
        <div>
          <strong>一</strong>
          <div class="math-place__ones"><i v-for="n in visual.value % 10" :key="n" /></div>
        </div>
      </div>
      <figcaption>一根长条是 10 个一，可以换成 1 个十。</figcaption>
    </template>
    <template v-else-if="visual.type === 'ruler'">
      <svg
        viewBox="0 0 420 165"
        role="img"
        :aria-label="`厘米尺上，蓝色线段起点${visual.start}，终点${visual.end}`"
      >
        <rect x="15" y="60" width="390" height="82" rx="10" fill="#ffedbd" stroke="#b48f39" />
        <template v-for="n in visual.max + 1" :key="n">
          <line
            :x1="28 + ((n - 1) * 364) / visual.max"
            :x2="28 + ((n - 1) * 364) / visual.max"
            y1="60"
            y2="83"
            stroke="#725b26"
            stroke-width="2"
          />
          <text :x="28 + ((n - 1) * 364) / visual.max" y="109" text-anchor="middle">
            {{ n - 1 }}
          </text>
        </template>
        <text x="357" y="134" font-size="13">厘米 cm</text>
        <line
          :x1="28 + (visual.start * 364) / visual.max"
          :x2="28 + (visual.end * 364) / visual.max"
          y1="40"
          y2="40"
          stroke="#377dac"
          stroke-width="10"
          stroke-linecap="round"
        />
        <line
          v-for="point in [visual.start, visual.end]"
          :key="point"
          :x1="28 + (point * 364) / visual.max"
          :x2="28 + (point * 364) / visual.max"
          y1="35"
          y2="62"
          stroke="#377dac"
          stroke-width="2"
          stroke-dasharray="3 3"
        />
      </svg>
      <figcaption>读蓝线两端的刻度。这里是示意图，不用尺子量屏幕。</figcaption>
    </template>
    <template v-else-if="visual.type === 'motion'">
      <svg
        viewBox="0 0 420 190"
        role="img"
        :aria-label="
          visual.mode === 'reflection'
            ? '绿色图形两边沿中间虚线互为镜像'
            : visual.mode === 'translation'
              ? '两个大小相同的箭头，从左边移到右边，仍然朝右'
              : '箭头绕中心转半圈，由朝右变成朝左'
        "
      >
        <template v-if="visual.mode === 'reflection'">
          <path d="M210 30 L315 145 L105 145 Z" fill="#9bd9bd" stroke="#358267" stroke-width="3" />
          <line
            x1="210"
            x2="210"
            y1="15"
            y2="169"
            stroke="#a87730"
            stroke-width="3"
            stroke-dasharray="7 5"
          />
          <text x="210" y="185" text-anchor="middle">试着沿虚线对折</text>
        </template>
        <template v-else>
          <path
            d="M35 65 H100 V42 L145 85 L100 128 V105 H35 Z"
            fill="#d3e5df"
            stroke="#6a9485"
            stroke-width="2"
          />
          <path
            d="M265 65 H330 V42 L375 85 L330 128 V105 H265 Z"
            :transform="visual.mode === 'rotation' ? 'rotate(180 320 85)' : undefined"
            fill="#8bcda9"
            stroke="#358267"
            stroke-width="3"
          />
          <text x="90" y="165" text-anchor="middle">开始</text>
          <text x="320" y="165" text-anchor="middle">后来</text>
          <path
            v-if="visual.mode === 'translation'"
            d="M165 85 H245 M236 78 L245 85 L236 92"
            fill="none"
            stroke="#a87730"
            stroke-width="3"
            stroke-linecap="round"
          />
          <g v-else>
            <path
              d="M180 78 A30 30 0 0 1 240 78 L233 69 M240 78 L247 68"
              fill="none"
              stroke="#a87730"
              stroke-width="3"
            />
            <circle cx="210" cy="78" r="4" fill="#a87730" />
            <text x="210" y="118" text-anchor="middle" font-size="14">转半圈</text>
          </g>
        </template>
      </svg>
      <figcaption>观察形状、位置与朝向的变化。</figcaption>
    </template>
    <template v-else-if="visual.type === 'route'">
      <svg
        viewBox="0 0 420 240"
        role="img"
        :aria-label="`上北下南；大门向北到教学楼${visual.first}米，教学楼向东到操场${visual.second}米，另一条弯路${visual.direct}米`"
      >
        <path
          d="M90 175 V60 H330"
          fill="none"
          stroke="#78bfa0"
          stroke-width="12"
          stroke-linecap="round"
        />
        <path
          d="M90 175 Q330 235 330 60"
          fill="none"
          stroke="#e8bc65"
          stroke-width="8"
          stroke-dasharray="10 7"
        />
        <g fill="#fff" stroke="#438364" stroke-width="3">
          <circle cx="90" cy="175" r="10" />
          <circle cx="90" cy="60" r="10" />
          <circle cx="330" cy="60" r="10" />
        </g>
        <text x="37" y="210">大门</text>
        <text x="62" y="34">教学楼</text>
        <text x="310" y="34">操场</text>
        <text x="25" y="120">{{ visual.first }}米</text>
        <text x="190" y="45">{{ visual.second }}米</text>
        <text x="240" y="195">{{ visual.direct }}米</text>
        <path
          d="M387 137 V85 M380 95 L387 85 L394 95"
          fill="none"
          stroke="#6b765b"
          stroke-width="3"
        />
        <text x="387" y="73" text-anchor="middle">北</text>
      </svg>
      <figcaption>校园路线示意图，按标注的距离计算。</figcaption>
    </template>
  </figure>
</template>

<style scoped>
.math-visual {
  margin: 20px 0;
  padding: 16px;
  background: #f3f8ef;
  border: 2px dashed #c8daba;
  border-radius: 22px;
  min-width: 0;
}
.math-visual svg {
  display: block;
  width: 100%;
  max-width: 540px;
  margin: auto;
  height: auto;
  fill: #435441;
  font: 600 18px system-ui;
}
.math-visual figcaption {
  margin-top: 12px;
  text-align: center;
  font-size: 14px;
  line-height: 1.7;
  color: #53664e;
}
.math-visual__tools {
  display: flex;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}
.math-visual__tools button {
  padding: 9px 14px;
  min-height: 44px;
  border: 2px solid #9ab58a;
  border-radius: 14px;
  background: white;
  color: #455b3b;
  font-weight: 700;
}
.math-visual__tools button[aria-pressed='true'] {
  background: #376953;
  color: white;
}
.math-visual button:focus-visible {
  outline: 3px solid #cf8a32;
  outline-offset: 3px;
}
.math-array {
  display: grid;
  gap: 6px;
  max-width: 330px;
  margin: auto;
}
.math-array span {
  aspect-ratio: 1;
  border-radius: 50%;
  background: #68b993;
  border: 2px solid #328363;
  max-height: 34px;
  max-width: 34px;
  width: 100%;
  justify-self: center;
}
.math-array .math-array__alternate {
  background: #edc669;
  border-color: #b38a27;
}
.math-place {
  display: grid;
  grid-template-columns: 2fr 1fr;
  max-width: 440px;
  margin: auto;
}
.math-place > div {
  padding: 8px;
  text-align: center;
}
.math-place > div + div {
  border-left: 2px solid #c8daba;
}
.math-place strong {
  display: block;
  margin-bottom: 10px;
  font-size: 20px;
}
.math-place__tens,
.math-place__ones {
  display: flex;
  gap: 6px;
  justify-content: center;
  flex-wrap: wrap;
}
.math-place__tens span {
  display: flex;
  flex-direction: column;
  border: 1px solid #328363;
}
.math-place i {
  display: block;
  width: 14px;
  height: 14px;
  background: #94d5b5;
  border: 1px solid #328363;
}
.math-place__ones i {
  background: #edc669;
  border-color: #b38a27;
}
</style>
