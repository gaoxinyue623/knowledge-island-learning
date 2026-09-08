<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import AppIcon from '@/components/common/AppIcon.vue'
import KnowledgeDangoPlaceholder from '@/components/character/KnowledgeDangoPlaceholder.vue'
import ThinkingToken from './ThinkingToken.vue'
import ThinkingReasoningBoard from './ThinkingReasoningBoard.vue'
import ThinkingPathBoard from './ThinkingPathBoard.vue'
import WorkshopObject from '@/components/hands-on/WorkshopObject.vue'
import { useReducedMotion } from '@/composables/useReducedMotion'
import {
  checkThinkingAnswer,
  emptyThinkingDraft,
  isThinkingStep,
} from '@/services/thinking/thinkingValidator'
import { useThinkingStore } from '@/stores/thinkingStore'
import type { ThinkingDraft, ThinkingMission } from '@/types/thinking'

const props = defineProps<{ mission: ThinkingMission; profileId: string }>()
const thinking = useThinkingStore()
const { prefersReducedMotion } = useReducedMotion()
const moving = ref(false)
let movementTimer: ReturnType<typeof setTimeout> | undefined
function stopMovement() {
  clearTimeout(movementTimer)
  moving.value = false
}
function animateStep() {
  stopMovement()
  if (!prefersReducedMotion.value) {
    moving.value = true
    movementTimer = setTimeout(() => {
      moving.value = false
    }, 300)
  }
}
watch(prefersReducedMotion, stopMovement)
onBeforeUnmount(stopMovement)
const index = ref(0),
  passed = ref<string[]>([]),
  hintCount = ref(0),
  helped = ref<string[]>([]),
  retried = ref<string[]>([])
const summary = ref(false),
  roundStarted = ref(false),
  feedback = ref(''),
  draft = ref<ThinkingDraft>([]),
  selectedPerson = ref<string | null>(null)
const heading = ref<HTMLElement | null>(null)
const puzzle = computed(() => props.mission.puzzles[index.value]!)
const isPassed = computed(() => passed.value.includes(puzzle.value.id))
const ids = computed(() =>
  Array.isArray(draft.value)
    ? draft.value.filter((value): value is string => typeof value === 'string')
    : [],
)
const assignments = computed(() => (Array.isArray(draft.value) ? {} : draft.value))
const cells = computed(() =>
  Array.isArray(draft.value)
    ? draft.value.filter((value): value is number => typeof value === 'number')
    : [],
)
const currentCell = computed(() => cells.value.at(-1) ?? 0)
const lengthTotal = computed(() =>
  puzzle.value.kind === 'pack'
    ? puzzle.value.items.reduce(
        (sum, item) => sum + (ids.value.includes(item.id) ? item.cost : 0),
        0,
      )
    : 0,
)
const ready = computed(() => checkThinkingAnswer(puzzle.value, draft.value).status !== 'incomplete')
const directions = [
  { label: '向上走', dr: -1, dc: 0, arrow: 'up' },
  { label: '向左走', dr: 0, dc: -1, arrow: 'left' },
  { label: '向下走', dr: 1, dc: 0, arrow: 'down' },
  { label: '向右走', dr: 0, dc: 1, arrow: 'right' },
] as const
function changeReasoningDraft(next: ThinkingDraft) {
  draft.value = next
  feedback.value = ''
}
function resetAnswer() {
  stopMovement()
  draft.value = emptyThinkingDraft(puzzle.value)
  hintCount.value = 0
  feedback.value = ''
  selectedPerson.value = null
}
async function focusHeading() {
  await nextTick()
  heading.value?.focus({ preventScroll: true })
  heading.value?.scrollIntoView?.({ block: 'start', behavior: 'auto' })
}
function initialize() {
  thinking.load(props.profileId)
  passed.value = [...thinking.completed(props.mission.id)]
  index.value = Math.max(
    0,
    props.mission.puzzles.findIndex((p) => !passed.value.includes(p.id)),
  )
  summary.value = passed.value.length === props.mission.puzzles.length
  roundStarted.value = false
  helped.value = []
  retried.value = []
  resetAnswer()
}
watch(() => [props.mission.id, props.profileId], initialize, { immediate: true })
watch(() => puzzle.value.id, resetAnswer)
function visit(next: number) {
  if (
    next < 0 ||
    next >= props.mission.puzzles.length ||
    !props.mission.puzzles.slice(0, next).every((p) => passed.value.includes(p.id))
  )
    return
  index.value = next
  summary.value = false
  void focusHeading()
}
function choose(id: string) {
  if (isPassed.value) return
  if (puzzle.value.kind === 'order') {
    if (!ids.value.includes(id)) draft.value = [...ids.value, id]
  } else if (puzzle.value.kind === 'pick' && puzzle.value.correctIds.length === 1)
    draft.value = [id]
  else
    draft.value = ids.value.includes(id)
      ? ids.value.filter((value) => value !== id)
      : [...ids.value, id]
  feedback.value = ''
}
function assign(itemId: string) {
  if (!selectedPerson.value || isPassed.value) return
  const next = { ...assignments.value }
  for (const person of Object.keys(next)) if (next[person] === itemId) delete next[person]
  next[selectedPerson.value] = itemId
  draft.value = next
  selectedPerson.value = null
  feedback.value = ''
}
function removeCard(id: string) {
  if (isPassed.value) return
  draft.value = ids.value.filter((value) => value !== id)
  feedback.value = ''
}
function target(dr: number, dc: number): number | null {
  const p = puzzle.value
  if (p.kind !== 'path') return null
  const row = Math.floor(currentCell.value / p.columns) + dr,
    col = (currentCell.value % p.columns) + dc
  if (row < 0 || col < 0 || row >= p.rows || col >= p.columns) return null
  const next = row * p.columns + col
  return isThinkingStep(p, currentCell.value, next) ? next : null
}
function move(dr: number, dc: number) {
  const next = target(dr, dc)
  if (next === null || isPassed.value || moving.value || cells.value.length > 40) return
  animateStep()
  draft.value = [...cells.value, next]
  feedback.value = ''
}
function undo() {
  if (isPassed.value || moving.value) return
  if (puzzle.value.kind === 'path') {
    animateStep()
    draft.value = cells.value.slice(0, Math.max(1, cells.value.length - 1))
  } else draft.value = ids.value.slice(0, -1)
  feedback.value = ''
}
function showHint() {
  hintCount.value = Math.min(2, hintCount.value + 1)
  if (!helped.value.includes(puzzle.value.id)) helped.value.push(puzzle.value.id)
}
function check() {
  if (isPassed.value || moving.value) return
  roundStarted.value = true
  const result = thinking.submit(props.profileId, props.mission.id, puzzle.value.id, draft.value)
  feedback.value = result.message
  if (result.status === 'correct') passed.value.push(puzzle.value.id)
  else if (result.status === 'incorrect' && !retried.value.includes(puzzle.value.id))
    retried.value.push(puzzle.value.id)
}
function advance() {
  if (!isPassed.value) return
  if (passed.value.length === props.mission.puzzles.length) summary.value = true
  else index.value += 1
  void focusHeading()
}
function replay() {
  passed.value = []
  index.value = 0
  summary.value = false
  helped.value = []
  retried.value = []
  roundStarted.value = false
  resetAnswer()
  void focusHeading()
}
</script>
<template>
  <div class="thinking-player">
    <div class="thinking-player-top">
      <span>{{ mission.level }} · {{ mission.title }}</span
      ><strong>{{ passed.length }} / {{ mission.puzzles.length }} 已完成</strong>
    </div>
    <progress
      class="thinking-progress"
      :value="passed.length"
      :max="mission.puzzles.length"
      aria-label="这条路线的完成进度"
    />
    <nav class="thinking-task-trail" aria-label="训练任务">
      <button
        v-for="(item, i) in mission.puzzles"
        :key="item.id"
        type="button"
        :disabled="i > 0 && !mission.puzzles.slice(0, i).every((p) => passed.includes(p.id))"
        :aria-current="!summary && index === i ? 'step' : undefined"
        :aria-label="`第${i + 1}个任务：${item.title}${passed.includes(item.id) ? '，已完成' : ''}`"
        @click="visit(i)"
      >
        <span>{{ i + 1 }}</span
        >{{ item.title
        }}<AppIcon v-if="passed.includes(item.id)" name="check" :size="17" decorative />
      </button>
    </nav>
    <p v-if="thinking.warning" role="status" class="thinking-warning">{{ thinking.warning }}</p>
    <section v-if="summary" class="thinking-summary" aria-labelledby="thinking-summary-title">
      <KnowledgeDangoPlaceholder state="success" size="md" />
      <h2 id="thinking-summary-title" ref="heading" tabindex="-1">这条路线，探索完成！</h2>
      <p>
        你完成了 {{ mission.puzzles.length }} 个思维任务。挑一个，把你为什么这样做讲给身边的人听吧。
      </p>
      <p v-if="roundStarted">
        本次练习中，{{ retried.length }} 个任务重试过，{{ helped.length }} 个任务使用过提示。
      </p>
      <p v-else>你已完成过这条路线，可以重新试试不同的办法。</p>
      <div class="thinking-actions">
        <button type="button" class="thinking-button" @click="replay">重新挑战这条路线</button
        ><RouterLink
          :to="'/thinking-islands/' + mission.islandId"
          class="thinking-button thinking-button--soft"
          >选择其他路线</RouterLink
        >
      </div>
      <p class="thinking-muted">再次挑战不会清除已保存的完成记录。</p>
    </section>
    <section v-else class="thinking-task" aria-labelledby="thinking-task-title">
      <p class="thinking-eyebrow">任务 {{ index + 1 }} · 先观察，再行动</p>
      <h2 id="thinking-task-title" ref="heading" tabindex="-1">{{ puzzle.title }}</h2>
      <template v-if="!isPassed">
        <p id="thinking-prompt" class="thinking-prompt">{{ puzzle.prompt }}</p>
        <div v-if="puzzle.tokens" class="thinking-token-row" aria-label="观察图形与数字">
          <ThinkingToken v-for="(token, i) in puzzle.tokens" :key="i" :token="token" />
        </div>
        <ThinkingReasoningBoard
          v-if="puzzle.kind === 'switches' || puzzle.kind === 'sudoku'"
          :key="puzzle.id"
          :puzzle="puzzle"
          :draft="draft"
          @change="changeReasoningDraft"
        />
        <fieldset
          v-if="puzzle.kind === 'pick'"
          class="thinking-options"
          aria-describedby="thinking-prompt"
        >
          <legend>
            {{ puzzle.correctIds.length > 1 ? '选出所有符合条件的答案' : '选择一个答案' }}
          </legend>
          <label
            v-for="option in puzzle.options"
            :key="option.id"
            :class="{ 'is-selected': ids.includes(option.id) }"
            ><input
              :type="puzzle.correctIds.length > 1 ? 'checkbox' : 'radio'"
              :name="puzzle.id"
              :checked="ids.includes(option.id)"
              @change="choose(option.id)"
            /><span
              ><span v-if="option.tokens" class="thinking-token-row" aria-hidden="true"
                ><ThinkingToken v-for="(token, i) in option.tokens" :key="i" :token="token" /></span
              ><span>{{ option.label }}</span></span
            ></label
          >
        </fieldset>
        <div v-else-if="puzzle.kind === 'order'" class="thinking-order">
          <div class="thinking-answer-tray" aria-label="已经排好的步骤" aria-live="polite">
            <span v-if="!ids.length" class="thinking-muted">点击下面的卡片，排出你的方案</span
            ><button
              v-for="(id, i) in ids"
              :key="id"
              type="button"
              :aria-label="`移回第${i + 1}步：${puzzle.cards.find((c) => c.id === id)?.label}`"
              @click="removeCard(id)"
            >
              {{ i + 1 }}. {{ puzzle.cards.find((c) => c.id === id)?.label
              }}<AppIcon name="x" :size="14" decorative />
            </button>
          </div>
          <div class="thinking-card-bank" aria-label="待安排的步骤">
            <button
              v-for="card in puzzle.cards"
              :key="card.id"
              type="button"
              :disabled="ids.includes(card.id)"
              @click="choose(card.id)"
            >
              {{ card.label }}
            </button>
          </div>
          <p class="thinking-muted">点上方卡片可移回；符合题目要求的不同顺序都接受。</p>
        </div>
        <div v-else-if="puzzle.kind === 'assign'">
          <ul class="thinking-clues" aria-label="侦探线索">
            <li v-for="(clue, i) in puzzle.clues" :key="i">
              {{ puzzle.people.find((p) => p.id === clue.personId)?.label
              }}{{ clue.relation === 'is' ? '对应的是' : '对应的不是' }}「{{
                puzzle.items.find((item) => item.id === clue.itemId)?.label
              }}」。
            </li>
          </ul>
          <p>先选伙伴，再选对应的物品。每个物品只能用一次。</p>
          <div class="thinking-assignment">
            <div role="group" aria-label="选择伙伴">
              <button
                v-for="person in puzzle.people"
                :key="person.id"
                type="button"
                :aria-pressed="selectedPerson === person.id"
                @click="selectedPerson = person.id"
              >
                <strong>{{ person.label }}</strong
                ><span>{{
                  puzzle.items.find((item) => item.id === assignments[person.id])?.label ?? '待配对'
                }}</span>
              </button>
            </div>
            <div role="group" aria-label="选择对应物品">
              <button
                v-for="item in puzzle.items"
                :key="item.id"
                type="button"
                :disabled="selectedPerson === null"
                @click="assign(item.id)"
              >
                {{ item.label
                }}<small v-if="Object.values(assignments).includes(item.id)"
                  >已选，可重新分配</small
                >
              </button>
            </div>
          </div>
        </div>
        <div v-else-if="puzzle.kind === 'path'" class="thinking-path-game">
          <p class="thinking-muted">
            从屏幕上方看地图，上下左右方向固定。用方向按钮带团子走到终点旗。
          </p>
          <div class="thinking-path-legend">
            <span><WorkshopObject kind="rock" />石头不能走</span
            ><span><WorkshopObject kind="supply" />背包是补给站</span
            ><span><WorkshopObject kind="flag" />终点旗</span>
          </div>
          <ThinkingPathBoard
            :key="profileId + ':' + puzzle.id"
            :puzzle="puzzle"
            :cells="cells"
            :moving="moving"
            :reduced-motion="prefersReducedMotion"
          />
          <p class="thinking-path-status" aria-live="polite">
            已走 {{ cells.length - 1 }} / {{ puzzle.maxSteps }} 步 · 当前第{{
              Math.floor(currentCell / puzzle.columns) + 1
            }}行第{{ (currentCell % puzzle.columns) + 1 }}列 · 补给
            {{ puzzle.via.filter((cell) => cells.includes(cell)).length }} / {{ puzzle.via.length }}
          </p>
          <div class="thinking-directions" aria-label="选择行走方向">
            <button
              v-for="direction in directions"
              :key="direction.label"
              type="button"
              :disabled="
                target(direction.dr, direction.dc) === null ||
                moving ||
                isPassed ||
                cells.length > 40
              "
              @click="move(direction.dr, direction.dc)"
            >
              <ThinkingToken :token="{ label: direction.label, shape: direction.arrow }" />
            </button>
          </div>
          <button
            type="button"
            class="thinking-text-button"
            :disabled="cells.length <= 1 || moving || isPassed"
            @click="undo"
          >
            撤回一步
          </button>
        </div>
        <div v-else-if="puzzle.kind === 'pack'">
          <p class="thinking-pack-total" aria-live="polite">
            已选 {{ ids.length }} 张 · 总长度 {{ lengthTotal }} / {{ puzzle.target }} 格{{
              puzzle.count ? ` · 要求${puzzle.count}张` : ''
            }}
          </p>
          <div class="thinking-pack-items" aria-label="选择材料">
            <button
              v-for="item in puzzle.items"
              :key="item.id"
              type="button"
              :aria-pressed="ids.includes(item.id)"
              @click="choose(item.id)"
            >
              <strong>{{ item.label }} · {{ item.cost }} 格</strong
              ><span class="thinking-length-bar" aria-hidden="true"
                ><i v-for="n in item.cost" :key="n" /></span
              ><span>{{ ids.includes(item.id) ? '已选，点此取消' : '选这张' }}</span>
            </button>
          </div>
        </div>
        <div class="thinking-actions">
          <button type="button" class="thinking-button" :disabled="!ready || moving" @click="check">
            检查方案</button
          ><button
            type="button"
            class="thinking-button thinking-button--soft"
            :disabled="hintCount >= 2"
            :aria-expanded="hintCount > 0"
            aria-controls="thinking-hints"
            @click="showHint"
          >
            {{
              hintCount === 0 ? '给我一点提示' : hintCount === 1 ? '再给一步提示' : '提示已展开'
            }}</button
          ><button type="button" class="thinking-text-button" @click="resetAnswer">清空方案</button>
        </div>
        <p v-if="feedback" role="status" class="thinking-feedback">{{ feedback }}</p>
        <div v-show="hintCount" id="thinking-hints" class="thinking-hints" role="status">
          <p v-for="hint in puzzle.hints.slice(0, hintCount)" :key="hint">{{ hint }}</p>
        </div>
      </template>
      <div v-else class="thinking-success" role="status">
        <AppIcon name="check-circle" :size="38" decorative />
        <div>
          <h3>这个任务通过啦！</h3>
          <p>{{ puzzle.explanation }}</p>
          <RouterLink to="/achievements">去宠物小屋查看学习积分</RouterLink>
        </div>
      </div>
      <button v-if="isPassed" type="button" class="thinking-button" @click="advance">
        {{ passed.length === mission.puzzles.length ? '查看路线小结' : '下一个任务'
        }}<AppIcon name="arrow-right" :size="18" decorative />
      </button>
    </section>
  </div>
</template>
