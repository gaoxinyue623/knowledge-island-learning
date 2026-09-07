<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import WorkshopObject from './WorkshopObject.vue'
import { usePieceTransfer } from '@/composables/usePieceTransfer'
import { useEnglishReadAloud } from '@/composables/useEnglishReadAloud'
import type { EnglishReadingSegment } from '@/services/lesson-player/englishReading'
const props = defineProps<{ profileId: string; contextId: string; muted: boolean }>()
const items = [
  { id: 'ball', label: 'ball · 球' },
  { id: 'book', label: 'book · 书' },
  { id: 'bear', label: 'teddy bear · 玩具熊' },
] as const
const rounds = [
  {
    item: 'ball',
    zone: 'under',
    instruction: 'Put the ball under the desk.',
    sentence: 'The ball is under the desk.',
    meaning: '把球放在书桌下面。',
  },
  {
    item: 'book',
    zone: 'on',
    instruction: 'Put the book on the desk.',
    sentence: 'The book is on the desk.',
    meaning: '把书放在书桌上面。',
  },
  {
    item: 'bear',
    zone: 'in',
    instruction: 'Put the teddy bear in the box.',
    sentence: 'The teddy bear is in the box.',
    meaning: '把玩具熊放进盒子里。',
  },
] as const
const root = ref<HTMLElement | null>(null)
const index = ref(0),
  placements = ref<Record<string, string>>({})
const correct = ref(false),
  said = ref(false),
  complete = ref(false),
  help = ref(false),
  feedback = ref('')
const task = computed(() => rounds[index.value]!)
const segments = computed<EnglishReadingSegment[]>(() => [
  { id: `${index.value}-listen`, text: task.value.instruction, section: 'dialogue' },
  { id: `${index.value}-say`, text: task.value.sentence, section: 'dialogue' },
])
const reader = useEnglishReadAloud(
  segments,
  computed(() => props.muted),
)
const transfer = usePieceTransfer(root, (piece, zone) => {
  if (
    correct.value ||
    complete.value ||
    !items.some((i) => i.id === piece) ||
    !['on', 'under', 'in', 'tray'].includes(zone)
  )
    return
  placements.value = { ...placements.value, [piece]: zone }
  feedback.value = '摆好了。可以重听这句，想好后检查位置。'
})
function listen(answer = false) {
  reader.select(answer ? 1 : 0)
  reader.replay()
}
function check() {
  correct.value = placements.value[task.value.item] === task.value.zone
  feedback.value = correct.value
    ? '位置对了！现在看着场景，自己介绍一句。'
    : '再听听：要移动的是哪个物品？在上面、下面，还是里面？可以把物品移回再试。'
  transfer.cancel()
}
function next() {
  if (!correct.value || !said.value) return
  reader.stop()
  transfer.cancel()
  if (index.value === rounds.length - 1) {
    complete.value = true
    return
  }
  index.value += 1
  correct.value = false
  said.value = false
  help.value = false
  feedback.value = ''
}
function reset() {
  reader.stop()
  transfer.cancel()
  index.value = 0
  placements.value = {}
  correct.value = false
  said.value = false
  complete.value = false
  help.value = false
  feedback.value = ''
}
watch(() => [props.profileId, props.contextId], reset)
</script>
<template>
  <section ref="root" class="hands-on listen-place" aria-label="英语听指令摆物练习">
    <p class="hands-on__eyebrow">听力小剧场 · 额外的口语练习</p>
    <h3>听一句，摆一摆，再自己说一句</h3>
    <p>认识三个小伙伴：球、书和玩具熊。听指令后，拖动物品；也可以点物品，再点位置。</p>
    <div class="hands-on__actions">
      <strong>{{ complete ? '三个场景都练过啦' : `场景 ${index + 1} / 3` }}</strong>
      <button type="button" :disabled="!!reader.unavailable.value || complete" @click="listen()">
        {{ reader.busy.value ? '重听指令' : '听这一句指令' }}
      </button>
      <button type="button" :disabled="!reader.busy.value" @click="reader.stop">停止朗读</button>
      <button type="button" :aria-expanded="help" @click="help = !help">
        {{ help ? '收起文字帮助' : '需要文字帮助' }}
      </button>
    </div>
    <p class="hands-on__note">
      设备合成语音，不是教材原声。{{
        reader.voice.value && !reader.voice.value.localService ? '当前声音可能需要联网。' : ''
      }}
    </p>
    <div
      v-if="reader.unavailable.value || reader.error.value"
      role="status"
      class="hands-on__notice"
    >
      {{ reader.unavailable.value || reader.error.value }}
      可以打开文字帮助，由家人读指令或看句子练习。
      <button type="button" @click="reader.refreshVoice">重新检测声音</button>
    </div>
    <p v-else-if="reader.busy.value" role="status">正在朗读，请留意物品和位置。</p>
    <div v-if="help" class="hands-on__hint">
      <p lang="en">{{ task.instruction }}</p>
      <p>{{ task.meaning }}</p>
      <small>看文字完成也是练习，但不代表独立听懂了指令。</small>
    </div>
    <div class="listen-place__tray" data-drop-zone="tray">
      <span>物品托盘</span>
      <button
        v-for="item in items.filter((i) => !placements[i.id] || placements[i.id] === 'tray')"
        :key="item.id"
        type="button"
        class="workshop-piece"
        :aria-label="`选择${item.label}`"
        :aria-pressed="transfer.selected.value === item.id"
        :disabled="correct || complete"
        @pointerdown="!correct && !complete && transfer.start($event, item.id)"
        @click="transfer.choose(item.id)"
      >
        <WorkshopObject :kind="item.id" /><span>{{ item.label }}</span>
      </button>
    </div>
    <div class="listen-place__scene" role="group" aria-label="书桌与收纳盒场景">
      <div
        v-for="zone in [
          { id: 'on', label: '书桌上面' },
          { id: 'under', label: '书桌下面' },
          { id: 'in', label: '盒子里面' },
        ]"
        :key="zone.id"
        class="listen-place__zone"
        :class="`listen-place__zone--${zone.id}`"
        :data-drop-zone="zone.id"
      >
        <button
          type="button"
          class="listen-place__drop"
          :data-drop-zone="zone.id"
          :disabled="correct || complete"
          :aria-label="`放到${zone.label}`"
          @click="transfer.drop(zone.id)"
        >
          {{ zone.label }}
        </button>
        <div class="listen-place__placed">
          <button
            v-for="item in items.filter((i) => placements[i.id] === zone.id)"
            :key="item.id"
            type="button"
            class="workshop-piece"
            :aria-label="`移动${item.label}，当前在${zone.label}`"
            :aria-pressed="transfer.selected.value === item.id"
            :disabled="correct || complete"
            @pointerdown="!correct && !complete && transfer.start($event, item.id)"
            @click="transfer.choose(item.id)"
          >
            <WorkshopObject :kind="item.id" /><span>{{ item.label }}</span>
          </button>
        </div>
      </div>
    </div>
    <div class="hands-on__actions">
      <button
        type="button"
        :disabled="!transfer.selected.value || correct || complete"
        @click="transfer.drop('tray')"
      >
        放回托盘</button
      ><button
        type="button"
        :disabled="correct || complete || !Object.keys(placements).length"
        @click="check"
      >
        检查摆放位置
      </button>
    </div>
    <p role="status">
      {{
        feedback ||
        (transfer.selected.value ? '物品选好了，点一下目标位置。' : '先听，再动手。可以多听几次。')
      }}
    </p>
    <section v-if="correct && !complete" class="hands-on__say" aria-label="摆好后自己说一句">
      <h4>Your turn · 看着场景说一句</h4>
      <p>先试着用自己的声音介绍物品在哪里，再听示范。</p>
      <blockquote lang="en">{{ task.sentence }}</blockquote>
      <button type="button" :disabled="!!reader.unavailable.value" @click="listen(true)">
        听一句示范
      </button>
      <label><input v-model="said" type="checkbox" />我已经看着场景，自己说了一句</label>
      <button type="button" :disabled="!said" @click="next">
        {{ index === 2 ? '完成这次口语练习' : '下一句指令' }}
      </button>
    </section>
    <div v-if="complete" class="hands-on__success">
      你完成了三个摆物场景和口头自查。下次可以不看文字，再听一次试试；这里没有发音评分。
    </div>
    <button class="hands-on__reset" type="button" @click="reset">重新听、重新摆</button>
    <p class="hands-on__note">
      这是原创位置表达拓展，不替换课本题目。本次摆放离开后不保留，不录音、不自动评价口语。
    </p>
    <div
      v-if="transfer.dragging.value"
      class="workshop-drag-ghost"
      aria-hidden="true"
      :style="{ left: transfer.point.value.x + 'px', top: transfer.point.value.y + 'px' }"
    >
      <WorkshopObject :kind="items.find((i) => i.id === transfer.selected.value)?.id ?? 'ball'" />
    </div>
  </section>
</template>
<style src="../../styles/hands-on.css"></style>
