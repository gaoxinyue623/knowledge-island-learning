<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { LowerMathQuestVisual } from '@/types/reading-quest'
import { TANGRAM_PIECES } from '@/data/content-expansion/math-lower-visuals'
const props = defineProps<{ visual: LowerMathQuestVisual }>()
const transformed = ref(false)
watch(
  () => props.visual,
  () => {
    transformed.value = false
  },
)
const placeNames = ['百位', '十位', '个位']
const places = computed(() => {
  const visual = props.visual
  if (visual.type !== 'abacus') return []
  return [100, 10, 1].slice(3 - visual.places).map((unit, index) => ({
    name: placeNames[index + 3 - visual.places],
    digit: Math.floor(visual.value / unit) % 10,
  }))
})
const bridgeGroups = computed(() => {
  const v = props.visual
  if (v.type !== 'ten-bridge') return []
  if (v.operation === 'subtract')
    return [10, v.a - 10].map((count, row) =>
      Array.from({ length: 10 }, (_, i) => ({
        filled: i < count,
        removed: transformed.value && row === 0 && i < v.b,
        second: row === 1,
      })),
    )
  const counts = transformed.value ? [10, v.a + v.b - 10] : [v.a, v.b]
  return counts.map((count, row) =>
    Array.from({ length: 10 }, (_, i) => ({
      filled: i < count,
      removed: false,
      second: transformed.value ? row === 1 || i >= v.a : row === 1,
    })),
  )
})
</script>

<template>
  <div class="lower-math-visual">
    <template v-if="visual.type === 'ten-bridge'">
      <p class="lower-math-visual__title">
        {{ visual.operation === 'add' ? '凑成十，再数剩下的' : '从十里减，再合起来' }}
      </p>
      <div class="lower-math-visual__tools">
        <button type="button" :aria-pressed="transformed" @click="transformed = !transformed">
          {{
            transformed ? '回到开始' : visual.operation === 'add' ? '看看怎样凑十' : '看看怎样破十'
          }}
        </button>
      </div>
      <div
        class="lower-ten-groups"
        role="img"
        :aria-label="
          visual.operation === 'add'
            ? transformed
              ? '把' + visual.a + '和' + visual.b + '重新分成10和' + (visual.a + visual.b - 10)
              : '第一组' + visual.a + '个，第二组' + visual.b + '个'
            : '先把' +
              visual.a +
              '分成10和' +
              (visual.a - 10) +
              (transformed ? '，从10里划掉' + visual.b + '个' : '')
        "
      >
        <div v-for="(group, row) in bridgeGroups" :key="row" class="lower-ten-frame">
          <span
            v-for="(dot, i) in group"
            :key="i"
            :class="{ 'has-dot': dot.filled, 'is-second': dot.second, 'is-removed': dot.removed }"
            >{{ dot.removed ? '×' : '' }}</span
          >
        </div>
      </div>
      <p role="status">
        {{
          visual.operation === 'add'
            ? transformed
              ? '只是重新分组，总数没有变。'
              : '每个格子最多放一个圆片。'
            : transformed
              ? '打叉的是拿走的，另一组没有拿走。'
              : '先把十几分成10和几个一。'
        }}
      </p>
    </template>
    <template v-else-if="visual.type === 'abacus'">
      <p class="lower-math-visual__title">看清数位，再读数</p>
      <div
        class="lower-abacus"
        role="img"
        :aria-label="places.map((p) => p.name + p.digit + '颗珠子').join('，')"
      >
        <div v-for="place in places" :key="place.name">
          <strong>{{ place.name }}</strong>
          <div class="lower-abacus__rod"><i v-for="n in place.digit" :key="n" /></div>
          <span>{{ place.digit }}</span>
        </div>
      </div>
      <p>
        个位一颗是一个一，十位一颗是一个十{{
          visual.places === 3 ? '，百位一颗是一个百' : ''
        }}。写数从最高有珠子的数位写起，后面的空数位用0占位。
      </p>
    </template>
    <template v-else-if="visual.type === 'number-grid'">
      <p class="lower-math-visual__title">小小方格侦探</p>
      <table class="lower-number-grid">
        <caption>
          每行、每列都要用1、2、3各一次
        </caption>
        <tbody>
          <tr v-for="row in 3" :key="row">
            <td
              v-for="col in 3"
              :key="col"
              :class="{ 'is-blank': visual.cells[(row - 1) * 3 + col - 1] === null }"
              :aria-label="
                '第' +
                row +
                '行第' +
                col +
                '列：' +
                (visual.cells[(row - 1) * 3 + col - 1] ?? '待填写')
              "
            >
              {{ visual.cells[(row - 1) * 3 + col - 1] ?? '?' }}
            </td>
          </tr>
        </tbody>
      </table>
      <p>先看问号所在的横行，再查同一竖列。把答案选在下面，不检查对角线。</p>
    </template>
    <template v-else-if="visual.type === 'column-calculation'">
      <p class="lower-math-visual__title">竖式小工坊</p>
      <table class="lower-column">
        <caption>
          相同数位对齐，从个位算起
        </caption>
        <thead>
          <tr>
            <th scope="col">运算</th>
            <th scope="col">十位</th>
            <th scope="col">个位</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td></td>
            <td>{{ Math.floor(visual.a / 10) }}</td>
            <td>{{ visual.a % 10 }}</td>
          </tr>
          <tr>
            <td>{{ visual.operation === 'add' ? '＋' : '－' }}</td>
            <td>{{ Math.floor(visual.b / 10) || '' }}</td>
            <td>{{ visual.b % 10 }}</td>
          </tr>
          <tr class="lower-column__answer">
            <td colspan="3">结果：?</td>
          </tr>
        </tbody>
      </table>
    </template>
    <template v-else-if="visual.type === 'plane-cards'">
      <p class="lower-math-visual__title">平面图形观察站</p>
      <div class="lower-plane-cards">
        <div v-for="(shape, i) in visual.shapes" :key="i">
          <span>{{ i + 1 }}号</span>
          <svg
            viewBox="0 0 120 120"
            role="img"
            :aria-label="
              i +
              1 +
              '号图形：' +
              {
                square: '四边等长、四个直角',
                rectangle: '对边等长、四个直角、长短边不同',
                triangle: '三条直边围成',
                circle: '圆形轮廓，没有角',
                parallelogram: '两组对边分别平行，没有直角',
              }[shape]
            "
          >
            <g
              :transform="visual.rotated && shape !== 'circle' ? 'rotate(35 60 60)' : undefined"
              fill="#b3d7c5"
              stroke="#487c69"
              stroke-width="2.5"
              stroke-linejoin="round"
            >
              <rect v-if="shape === 'square'" x="28" y="28" width="64" height="64" />
              <rect v-else-if="shape === 'rectangle'" x="15" y="33" width="90" height="54" />
              <polygon v-else-if="shape === 'triangle'" points="60,20 100,94 20,94" />
              <circle v-else-if="shape === 'circle'" cx="60" cy="60" r="36" />
              <polygon v-else points="35,30 100,30 85,90 20,90" />
            </g>
          </svg>
        </div>
      </div>
      <p>看边与角，不只看朝向。图形转一下，不会变成另一种形状。</p>
    </template>
    <template v-else-if="visual.type === 'paper-change'">
      <p class="lower-math-visual__title">
        {{
          visual.mode === 'stamp'
            ? '从物体的一个面描出轮廓'
            : visual.mode === 'join'
              ? '两块纸片，分开与拼合'
              : '沿虚线对折，再展开看'
        }}
      </p>
      <div v-if="visual.mode !== 'stamp'" class="lower-math-visual__tools">
        <button type="button" :aria-pressed="transformed" @click="transformed = !transformed">
          {{
            visual.mode === 'join'
              ? transformed
                ? '分开看'
                : '拼回去'
              : transformed
                ? '展开看'
                : '沿虚线对折'
          }}
        </button>
      </div>
      <svg
        viewBox="0 0 320 190"
        role="img"
        :aria-label="
          visual.mode === 'stamp'
            ? '左边一块积木，箭头指向右边纸上的一个方形轮廓'
            : visual.mode === 'join'
              ? transformed
                ? '两块不同颜色的纸片沿斜边拼成一张方纸，没有空隙和重叠'
                : '一张方纸分出的两块三边纸片，各自分开摆放'
              : transformed
                ? '沿中间竖线对折后，两层纸的边对齐'
                : '展开的方纸，中间有一条竖直折痕'
        "
      >
        <template v-if="visual.mode === 'stamp'">
          <path d="M20 65L62 40L107 65L64 90Z" fill="#c1deed" stroke="#628da4" stroke-width="2" />
          <path d="M20 65V116L64 142V90Z" fill="#91bfd4" stroke="#628da4" stroke-width="2" />
          <path d="M64 90V142L107 116V65Z" fill="#729eb7" stroke="#628da4" stroke-width="2" />
          <path
            d="M128 94H175M165 85L175 94L165 103"
            fill="none"
            stroke="#b08b44"
            stroke-width="3"
          />
          <rect
            x="191"
            y="33"
            width="115"
            height="129"
            rx="10"
            fill="#fffcf2"
            stroke="#d9ca9f"
            stroke-width="2"
          />
          <rect
            x="213"
            y="63"
            width="69"
            height="69"
            fill="none"
            stroke="#648e7c"
            stroke-width="3"
            stroke-dasharray="5 4"
          />
        </template>
        <template v-else-if="visual.mode === 'join'">
          <polygon
            :points="transformed ? '90,25 230,25 90,165' : '15,25 155,25 15,165'"
            fill="#c1deed"
            stroke="#628da4"
            stroke-width="2"
          />
          <polygon
            :points="transformed ? '230,25 230,165 90,165' : '305,25 305,165 165,165'"
            fill="#edcf92"
            stroke="#ad8f55"
            stroke-width="2"
          />
        </template>
        <template v-else>
          <rect
            :x="transformed ? 160 : 80"
            y="15"
            :width="transformed ? 80 : 160"
            height="160"
            fill="#edcf92"
            stroke="#ad8f55"
            stroke-width="2"
          />
          <path d="M160 15V175" stroke="#5e8da9" stroke-width="3" stroke-dasharray="7 5" />
          <path
            v-if="transformed"
            d="M110 50Q135 10 190 50M185 39L190 50L179 52"
            fill="none"
            stroke="#658578"
            stroke-width="3"
          />
        </template>
      </svg>
      <p>
        {{
          visual.mode === 'stamp'
            ? '描的是一个面的边缘，不是整个物体。'
            : '用纸操作时请家人陪同，也可以直接使用预剪好的纸片。'
        }}
      </p>
    </template>
    <template v-else-if="visual.type === 'tangram'">
      <p class="lower-math-visual__title">七巧板 · 找找每一块</p>
      <svg
        class="lower-tangram"
        viewBox="-0.1 -0.1 4.2 4.2"
        role="img"
        aria-label="七巧板正方形拼图，共7块，编号1到7"
      >
        <g v-for="piece in TANGRAM_PIECES" :key="piece.id">
          <polygon
            :points="piece.points.map((p) => p.join(',')).join(' ')"
            :fill="piece.color"
            stroke="#536959"
            stroke-width=".025"
          />
          <text
            :x="piece.labelPosition[0]"
            :y="piece.labelPosition[1]"
            text-anchor="middle"
            dominant-baseline="central"
            fill="#344d43"
            font-size=".25"
          >
            {{ piece.id }}
          </text>
        </g>
      </svg>
      <details>
        <summary>查看各块的形状线索</summary>
        <p>1、2、3、4、6号各有三条边；5号四边等长且有四个直角；7号两组对边平行但没有直角。</p>
      </details>
      <p>不同大小也要数进去。编号是为了找纸片，不表示图形类别。</p>
    </template>
  </div>
</template>

<style scoped>
.lower-math-visual {
  max-width: 470px;
  margin: auto;
  color: #34594b;
}
.lower-math-visual__title {
  text-align: center;
  font-weight: 850;
  margin: 0 0 14px;
}
.lower-math-visual > p:not(.lower-math-visual__title),
.lower-math-visual details {
  font-size: 0.85rem;
  line-height: 1.7;
}
.lower-math-visual__tools {
  display: flex;
  justify-content: center;
  margin-bottom: 12px;
}
.lower-math-visual button {
  border: 2px solid #91b9a1;
  border-radius: 14px;
  background: #fffaf0;
  color: #34594b;
  padding: 10px 14px;
  min-height: 44px;
  font-weight: 750;
  cursor: pointer;
}
.lower-math-visual button:focus-visible,
.lower-math-visual summary:focus-visible {
  outline: 3px solid #527da8;
  outline-offset: 3px;
}
.lower-ten-groups {
  display: grid;
  gap: 12px;
  max-width: 310px;
  margin: auto;
}
.lower-ten-frame {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 5px;
  padding: 7px;
  background: #fffdf7;
  border: 2px solid #bad3c1;
  border-radius: 12px;
}
.lower-ten-frame span {
  aspect-ratio: 1;
  display: grid;
  place-items: center;
  border: 1px solid #dce5dd;
  border-radius: 50%;
  font-weight: 900;
  min-width: 0;
}
.lower-ten-frame .has-dot {
  background: #99c9de;
  border-color: #6797ab;
}
.lower-ten-frame .is-second.has-dot {
  background: #edcb83;
  border-color: #b29959;
}
.lower-ten-frame .is-removed {
  background: #e2e6e2;
  border-style: dashed;
  color: #7c5a4e;
}
.lower-abacus {
  display: flex;
  justify-content: center;
  border-bottom: 6px solid #bbad82;
  gap: 14px;
  padding: 0 6px 10px;
}
.lower-abacus > div {
  min-width: 0;
  width: 85px;
  text-align: center;
}
.lower-abacus strong {
  font-size: 0.9rem;
}
.lower-abacus__rod {
  display: flex;
  flex-direction: column-reverse;
  align-items: center;
  height: 145px;
  padding: 5px 0;
  margin: 8px auto;
  background: linear-gradient(
    to right,
    transparent calc(50% - 2px),
    #b6a887 calc(50% - 2px),
    #b6a887 calc(50% + 2px),
    transparent calc(50% + 2px)
  );
  gap: 3px;
}
.lower-abacus__rod i {
  width: 80%;
  height: 12px;
  flex-shrink: 0;
  background: #9fcdb8;
  border: 1px solid #5c9b7d;
  border-radius: 50%;
}
.lower-abacus span {
  font-size: 1.4rem;
  font-weight: 800;
}
.lower-number-grid {
  table-layout: fixed;
  border-collapse: separate;
  border-spacing: 5px;
  width: 100%;
  max-width: 270px;
  margin: auto;
}
.lower-number-grid caption,
.lower-column caption {
  font-size: 0.85rem;
  margin-bottom: 12px;
}
.lower-number-grid td {
  width: 33.33%;
  height: 52px;
  text-align: center;
  font-size: 1.5rem;
  font-weight: 850;
  border: 2px solid #bad0ba;
  background: #fffefa;
  border-radius: 10px;
}
.lower-number-grid .is-blank {
  background: #ffedbe;
  border-style: dashed;
  border-color: #ac9459;
}
.lower-column {
  table-layout: fixed;
  border-collapse: collapse;
  margin: auto;
  width: 100%;
  max-width: 270px;
  text-align: center;
}
.lower-column th {
  font-size: 0.8rem;
  color: #64766b;
  padding: 8px 0;
  background: #e4eee0;
}
.lower-column td {
  font-family: ui-monospace, monospace;
  font-size: 1.8rem;
  line-height: 1.8;
}
.lower-column__answer {
  border-top: 2px solid #587966;
}
.lower-column__answer td {
  font-size: 1rem;
  padding-top: 8px;
}
.lower-plane-cards {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}
.lower-plane-cards > div {
  background: #fffef8;
  border: 2px solid #c6d8c5;
  border-radius: 14px;
  text-align: center;
  padding: 8px;
}
.lower-plane-cards span {
  font-weight: 800;
  font-size: 0.85rem;
}
.lower-math-visual svg {
  display: block;
  width: 100%;
  height: auto;
  max-width: 360px;
  margin: auto;
}
.lower-math-visual .lower-tangram {
  max-width: 285px;
}
.lower-math-visual summary {
  padding: 10px 0;
  min-height: 44px;
  cursor: pointer;
}
@media (max-width: 380px) {
  .lower-ten-frame {
    padding: 4px;
    gap: 3px;
  }
  .lower-abacus {
    gap: 8px;
  }
}
</style>
