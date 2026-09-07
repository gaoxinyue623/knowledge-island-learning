<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import ReadingQuest from './ReadingQuest.vue'
import TenFrameWorkshop from '@/components/hands-on/TenFrameWorkshop.vue'
import EvidenceWorkshop from '@/components/hands-on/EvidenceWorkshop.vue'
import ListenPlaceWorkshop from '@/components/hands-on/ListenPlaceWorkshop.vue'
import { textbookEvidencePractice } from '@/services/content-expansion/evidencePractice'
import { englishPracticeFor } from '@/services/content-expansion/readingQuest'
import { createTrainingQuest } from '@/services/content-expansion/trainingQuest'
import { readQuestChoice, saveQuestChoice } from '@/services/content-expansion/questProgressStorage'
import type { ContentExpansionBundle } from '@/types'
import type { ReadingQuest as Quest } from '@/types/reading-quest'

const props = defineProps<{
  quest: Quest
  bundle: ContentExpansionBundle | null
  title: string
  text: string
  profileId: string
  muted?: boolean
}>()
const mode = ref<'foundation' | 'training'>('foundation')
const variant = ref(0)
const choiceWritable = ref(true)
watch(
  () => [props.profileId, props.quest.id],
  () => {
    const choice = readQuestChoice(props.profileId, props.quest.id)
    mode.value = choice.data.mode
    variant.value = choice.data.variant
    choiceWritable.value = choice.writable
  },
  { immediate: true, flush: 'sync' },
)
function choose(modeValue: 'foundation' | 'training', nextVariant = variant.value) {
  mode.value = modeValue
  variant.value = nextVariant
  if (choiceWritable.value)
    choiceWritable.value = saveQuestChoice({
      schemaVersion: 1,
      profileId: props.profileId,
      questId: props.quest.id,
      mode: modeValue,
      variant: nextVariant,
    })
}
const training = computed(() =>
  createTrainingQuest({
    bundle: props.bundle,
    title: props.title,
    text: props.text,
    variant: variant.value,
  }),
)
const current = computed(() =>
  mode.value === 'training' ? (training.value ?? props.quest) : props.quest,
)
const isTraining = computed(() => Boolean(current.value.training))
const tenFrame = computed(() => {
  const visual = props.quest.stages.find(
    (s) => s.visual?.type === 'ten-bridge' && s.visual.operation === 'add',
  )?.visual
  return visual?.type === 'ten-bridge' && visual.operation === 'add' ? visual : null
})
const isEnglish = computed(() => Boolean(englishPracticeFor(props.quest.knowledgePointId)))
const evidencePractice = computed(() =>
  props.quest.subject === 'MATH' || isEnglish.value
    ? null
    : textbookEvidencePractice(props.title, props.text, props.quest.textbookId),
)
</script>

<template>
  <div class="quest-training">
    <a v-if="evidencePractice || isEnglish" class="hands-on-jump" href="#knowledge-hands-on"
      >{{ isEnglish ? '试试新玩法：听指令摆物' : '试试新玩法：原文找证据、排序说理由' }} ↓</a
    >
    <section v-if="training" class="quest-training__selector" aria-label="选择训练强度">
      <div class="quest-training__modes">
        <button type="button" :aria-pressed="!isTraining" @click="choose('foundation')">
          <strong>基础热身</strong><span>先熟悉方法 · {{ quest.stages.length }} 关</span>
        </button>
        <button type="button" :aria-pressed="isTraining" @click="choose('training')">
          <strong>强化训练</strong
          ><span>找方法、讲依据、解情境 · {{ training.stages.length }} 关</span>
        </button>
      </div>
      <div v-if="isTraining" class="quest-training__round">
        <p>第 {{ (training.training?.variantIndex ?? 0) + 1 }} 组 · 不限时，可以用纸笔思考</p>
        <button
          type="button"
          @click="choose('training', (variant + 1) % (training.training?.variantCount ?? 1))"
        >
          换一组强化题
        </button>
      </div>
      <p class="quest-training__help">
        先热身，再选强化。每组进度分别保存，换组后也可以回来接着练；不改变教材掌握度。
      </p>
      <p v-if="!choiceWritable" class="quest-training__help" role="status">
        暂时无法记住训练强度，下次打开会先从基础热身开始。
      </p>
    </section>
    <TenFrameWorkshop
      v-if="tenFrame"
      :key="profileId + ':' + quest.id + ':ten-frame'"
      :a="tenFrame.a"
      :b="tenFrame.b"
    />
    <KeepAlive :max="2">
      <ReadingQuest :key="profileId + ':' + current.id" :quest="current" :profile-id="profileId" />
    </KeepAlive>
    <EvidenceWorkshop
      v-if="evidencePractice"
      id="knowledge-hands-on"
      :key="profileId + ':' + quest.id + ':evidence'"
      :practice="evidencePractice"
      :profile-id="profileId"
    />
    <ListenPlaceWorkshop
      v-if="isEnglish"
      id="knowledge-hands-on"
      :key="profileId + ':' + quest.id + ':listen-place'"
      :profile-id="profileId"
      :context-id="quest.id"
      :muted="muted ?? false"
    />
  </div>
</template>
