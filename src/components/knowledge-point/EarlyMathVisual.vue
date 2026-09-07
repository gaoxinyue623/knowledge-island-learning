<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { EarlyMathQuestVisual, SolidShape } from '@/types/reading-quest'
const props = defineProps<{ visual: EarlyMathQuestVisual }>()
const marked = ref<number[]>([])
watch(
  () => props.visual,
  () => {
    marked.value = []
  },
)
const count = computed(() =>
  props.visual.type === 'counters' ? props.visual.first + (props.visual.second ?? 0) : 0,
)
const remaining = computed(
  () => count.value - (props.visual.type === 'counters' ? (props.visual.removed ?? 0) : 0),
)
function toggle(index: number) {
  marked.value = marked.value.includes(index)
    ? marked.value.filter((n) => n !== index)
    : [...marked.value, index]
}
const cards = [
  { color: 'blue', label: '蓝色圆形', shape: 'circle' },
  { color: 'yellow', label: '黄色圆形', shape: 'circle' },
  { color: 'blue', label: '蓝色正方形', shape: 'square' },
  { color: 'yellow', label: '黄色正方形', shape: 'square' },
]
const classroom = ['书架', '黑板', '窗户', '书包', '课桌', '椅子']
const shapeDescriptions: Record<SolidShape, string> = {
  cube: '方块立体透视图，画出了顶部和两个侧面，各条棱表示相同长度',
  cuboid: '长盒子立体透视图，长边比短边更长，能看见顶部和两个侧面',
  cylinder: '上下圆面、弯曲侧面的罐子形立体图',
  sphere: '没有棱角、表面弯曲的皮球形立体图',
}
</script>

<template>
  <div class="early-visual">
    <template v-if="visual.type === 'counters'">
      <p class="early-visual__label">点一个，数一个</p>
      <div class="early-ten-frame" aria-label="圆片点数板">
        <div v-for="i in 10" :key="i" class="early-ten-frame__cell">
          <button
            v-if="i <= remaining"
            type="button"
            :aria-pressed="marked.includes(i)"
            :aria-label="'第' + i + '个' + (i <= visual.first ? '蓝色' : '黄色') + '圆片'"
            :class="[
              'early-counter',
              { 'is-yellow': i > visual.first, 'is-marked': marked.includes(i) },
            ]"
            @click="toggle(i)"
          >
            <svg viewBox="0 0 48 48" aria-hidden="true">
              <circle
                cx="24"
                cy="24"
                r="21"
                :fill="i > visual.first ? '#f4d37a' : '#85c3e8'"
                :stroke="i > visual.first ? '#b19348' : '#4e8eb6'"
                stroke-width="2"
              />
              <circle
                v-if="marked.includes(i)"
                cx="24"
                cy="24"
                r="18"
                fill="none"
                stroke="white"
                stroke-width="2"
              />
              <path
                v-if="marked.includes(i)"
                d="m14 24 7 7L35 17"
                fill="none"
                stroke="#244e48"
                stroke-width="3"
              />
            </svg>
          </button>
          <span v-else-if="i <= count" class="early-counter is-removed" aria-label="已拿走的圆片"
            >×</span
          >
          <span v-else class="early-ten-frame__empty" aria-hidden="true" />
        </div>
      </div>
      <p class="early-visual__count" role="status">已标记 {{ marked.length }} 个</p>
      <p class="early-visual__caption">
        {{
          visual.removed
            ? '打叉的是拿走的，不要数进剩下的。'
            : '再点一次可以取消标记；空格不是圆片。'
        }}
      </p>
      <p v-if="visual.second" class="early-visual__caption">蓝色在前，黄色在后，表示两组圆片。</p>
    </template>
    <template v-else-if="visual.type === 'part-whole'">
      <p class="early-visual__label">找找藏起来的一部分</p>
      <div
        class="early-part-whole"
        role="img"
        :aria-label="'总数' + visual.total + '，一部分' + visual.known + '，另一部分未知'"
      >
        <div class="early-part-whole__total">
          <span>一共</span><strong>{{ visual.total }}</strong>
        </div>
        <svg viewBox="0 0 240 32" aria-hidden="true">
          <path d="M120 0V12H55V30M120 12H185V30" />
        </svg>
        <div class="early-part-whole__parts">
          <div>
            <span>看得见</span><strong>{{ visual.known }}</strong>
          </div>
          <div><span>藏起来</span><strong>?</strong></div>
        </div>
      </div>
      <p class="early-visual__caption">两部分合起来，才是一共的数量。</p>
    </template>
    <template v-else-if="visual.type === 'queue'">
      <p class="early-visual__label">左边 → 右边</p>
      <ol class="early-queue" aria-label="朋友从画面左到右的排列">
        <li v-for="(label, i) in visual.labels" :key="label">
          <svg viewBox="0 0 48 60" aria-hidden="true">
            <path
              d="M9 59V43a15 15 0 0 1 30 0v16"
              :fill="['#75b5df', '#ecb065', '#86bfa2', '#c6a3db', '#e1a2b5'][i]"
            />
            <circle cx="24" cy="19" r="15" fill="#ffdeba" />
            <path d="M10 15Q12 -3 27 3Q40 3 39 16L24 10Z" fill="#5b4f55" />
            <circle cx="19" cy="20" r="1.5" fill="#334155" />
            <circle cx="29" cy="20" r="1.5" fill="#334155" />
            <path d="M20 26Q24 30 28 26" fill="none" stroke="#986951" stroke-width="2" />
          </svg>
          <span>{{ label }}</span>
        </li>
      </ol>
      <p class="early-visual__caption">这是朋友的名字。读清从哪边开始，再找位置。</p>
    </template>
    <template v-else-if="visual.type === 'classification'">
      <p class="early-visual__label">形状卡片小工坊</p>
      <div class="early-shape-cards">
        <div v-for="(card, i) in cards" :key="card.label" class="early-shape-card">
          <span>{{ i + 1 }}号</span>
          <svg viewBox="0 0 100 80" role="img" :aria-label="card.label">
            <circle
              v-if="card.shape === 'circle'"
              cx="50"
              cy="40"
              r="28"
              :fill="card.color === 'blue' ? '#71b4e3' : '#edc468'"
              stroke="#536780"
              stroke-width="2"
            />
            <rect
              v-else
              x="22"
              y="12"
              width="56"
              height="56"
              rx="2"
              :fill="card.color === 'blue' ? '#71b4e3' : '#edc468'"
              stroke="#536780"
              stroke-width="2"
            />
          </svg>
          <strong>{{ card.label }}</strong>
        </div>
      </div>
      <p class="early-visual__caption">先读分类标准：这次看颜色，还是看形状？</p>
    </template>
    <template v-else-if="visual.type === 'classroom'">
      <p class="early-visual__label">教室位置图 · 按画面上下左右</p>
      <div
        class="early-classroom"
        role="img"
        aria-label="上排从左到右：书架、黑板、窗户；下排从左到右：书包、课桌、椅子"
      >
        <div v-for="(label, i) in classroom" :key="label" :class="{ 'is-focus': i === 4 }">
          <span aria-hidden="true">{{ ['▤', '▰', '⊞', '▣', '▱', '▥'][i] }}</span
          >{{ label }}
        </div>
      </div>
      <p class="early-visual__caption">先找到课桌，再看它的左边、右边和上面。</p>
    </template>
    <template v-else-if="visual.type === 'solids'">
      <p class="early-visual__label">立体积木观察站</p>
      <div class="early-shape-cards">
        <div v-for="(shape, i) in visual.shapes" :key="i" class="early-shape-card">
          <span>{{ i + 1 }}号</span>
          <svg
            viewBox="0 0 120 115"
            role="img"
            :aria-label="i + 1 + '号：' + shapeDescriptions[shape]"
          >
            <ellipse cx="60" cy="102" rx="46" ry="7" fill="#e5ebe6" />
            <g v-if="shape === 'cube'" stroke="#497cad" stroke-width="2" stroke-linejoin="round">
              <path d="M21 32L59 13L98 32L60 52Z" fill="#b1d9f2" />
              <path d="M21 32L60 52V101L21 80Z" fill="#75b8e2" />
              <path d="M60 52L98 32V80L60 101Z" fill="#4e97cb" />
            </g>
            <g
              v-else-if="shape === 'cuboid'"
              stroke="#8a679b"
              stroke-width="2"
              stroke-linejoin="round"
            >
              <path d="M9 43L35 23L110 43L85 64Z" fill="#e0c9ee" />
              <path d="M9 43L85 64V99L9 78Z" fill="#c4a0d8" />
              <path d="M85 64L110 43V78L85 99Z" fill="#a87fbe" />
            </g>
            <g v-else-if="shape === 'cylinder'" stroke="#a47c30" stroke-width="2">
              <path d="M29 29V85C29 105 91 105 91 85V29" fill="#ebc76c" />
              <path d="M30 80C30 98 90 98 90 80" fill="none" stroke="#cfaa55" />
              <ellipse cx="60" cy="29" rx="31" ry="15" fill="#ffe7a5" />
            </g>
            <g v-else>
              <circle cx="60" cy="57" r="43" fill="#edab84" stroke="#be7f62" stroke-width="2" />
              <path
                d="M26 36C50 52 71 81 75 97M37 20C67 42 82 72 88 88"
                fill="none"
                stroke="#fbd6b7"
                stroke-width="7"
              />
              <ellipse cx="44" cy="34" rx="9" ry="6" fill="#ffe9cd" transform="rotate(-30 44 34)" />
            </g>
          </svg>
        </div>
      </div>
      <p class="early-visual__caption">观察整个物体，不把它的一个面当成整个立体。</p>
    </template>
  </div>
</template>

<style scoped>
.early-visual {
  width: 100%;
  max-width: 460px;
  margin: auto;
  color: #344c58;
}
.early-visual__label {
  margin: 0 0 14px;
  font-weight: 850;
  text-align: center;
}
.early-visual__caption {
  margin: 10px 0 0;
  font-size: 0.85rem;
  line-height: 1.65;
  text-align: center;
}
.early-visual__count {
  text-align: center;
  font-weight: 800;
  margin: 12px 0 0;
}
.early-ten-frame {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 6px;
  padding: 8px;
  background: #dbe9dd;
  border: 2px solid #aecab5;
  border-radius: 16px;
  max-width: 330px;
  margin: auto;
}
.early-ten-frame__cell {
  display: grid;
  place-items: center;
  min-height: 48px;
  min-width: 0;
  border-radius: 10px;
  background: #fffefa;
}
.early-counter {
  display: grid;
  place-items: center;
  width: 100%;
  max-width: 48px;
  height: 46px;
  padding: 0;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: #344c58;
  cursor: pointer;
}
.early-counter svg {
  width: 100%;
  height: 100%;
}
.early-counter.is-removed {
  aspect-ratio: 1;
  height: auto;
  border-radius: 50%;
  background: #e6e9e6;
  border: 2px dashed #89948c;
  font-size: 24px;
  cursor: default;
}
.early-ten-frame__empty {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: 1px solid #c6d6c9;
}
.early-part-whole {
  max-width: 280px;
  margin: auto;
  text-align: center;
}
.early-part-whole__total,
.early-part-whole__parts > div {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px;
  border: 2px solid #aecab5;
  border-radius: 16px;
  background: #fffefa;
}
.early-part-whole__total {
  width: 110px;
  margin: auto;
}
.early-part-whole strong {
  font-size: 1.8rem;
  color: #477a59;
}
.early-part-whole > svg {
  width: 100%;
  height: 32px;
  fill: none;
  stroke: #84aa90;
  stroke-width: 3;
  display: block;
}
.early-part-whole__parts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}
.early-queue {
  display: flex;
  list-style: none;
  padding: 0;
  gap: 6px;
  margin: 0;
}
.early-queue li {
  min-width: 0;
  flex: 1;
  text-align: center;
  font-size: 0.8rem;
}
.early-queue svg {
  display: block;
  width: 100%;
  max-width: 60px;
  margin: auto auto 8px;
}
.early-queue span {
  overflow-wrap: anywhere;
}
.early-shape-cards {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}
.early-shape-card {
  display: grid;
  justify-items: center;
  align-content: start;
  padding: 10px;
  border: 2px solid #d0dfd3;
  background: #fffefa;
  border-radius: 16px;
  min-width: 0;
  text-align: center;
}
.early-shape-card > span {
  font-size: 0.8rem;
  font-weight: 800;
  background: #edf3ed;
  padding: 2px 10px;
  border-radius: 12px;
}
.early-shape-card svg {
  width: 100%;
  max-width: 140px;
  height: auto;
}
.early-shape-card strong {
  font-size: 0.8rem;
}
.early-classroom {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}
.early-classroom > div {
  padding: 10px 4px;
  display: grid;
  gap: 4px;
  place-items: center;
  background: #fffefa;
  border-radius: 12px;
  border: 2px solid #c9d9ce;
  font-size: 0.85rem;
}
.early-classroom span {
  font-size: 1.6rem;
  color: #6593a6;
}
.early-classroom .is-focus {
  background: #fff1c5;
  border-color: #caa455;
}
.early-counter:focus-visible {
  outline: 3px solid #315f94;
  outline-offset: 3px;
}
@media (max-width: 380px) {
  .early-ten-frame {
    gap: 3px;
    padding: 4px;
  }
  .early-shape-card {
    padding: 6px;
  }
}
</style>
