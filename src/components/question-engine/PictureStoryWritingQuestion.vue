<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { QuestionAnswerDraft, QuestionViewModel } from '@/types'
import QuestionMediaRenderer from './QuestionMediaRenderer.vue'

const props = defineProps<{ question: QuestionViewModel }>()
const emit = defineEmits<{ 'update-draft': [draft: QuestionAnswerDraft] }>()
const localChoice = ref('')
watch(
  () => props.question.id,
  () => {
    localChoice.value = ''
  },
)
const choices = computed(() => props.question.pictureWriting?.choices ?? [])
const raw = computed(() =>
  props.question.answerDraft.type === 'shortAnswer' ? props.question.answerDraft.value : '',
)
const savedChoice = computed(() =>
  choices.value.find((choice) => raw.value.startsWith(`【${choice.title}】\n`)),
)
const selected = computed(
  () =>
    savedChoice.value ??
    choices.value.find((choice) => choice.mediaAssetId === localChoice.value) ??
    choices.value[0],
)
const value = computed(() =>
  savedChoice.value ? raw.value.slice(`【${savedChoice.value.title}】\n`.length) : raw.value,
)
const media = computed(() =>
  props.question.media.filter((asset) => asset.mediaAssetId === selected.value?.mediaAssetId),
)
const lines = computed(() => props.question.pictureWriting?.lineCount ?? 6)

function updateValue(nextValue: string, title = selected.value?.title) {
  if (props.question.submitted || !title) return
  emit('update-draft', {
    type: 'shortAnswer',
    value: nextValue.trim() ? `【${title}】\n${nextValue}` : '',
  })
}
function selectPicture(mediaAssetId: string) {
  if (props.question.submitted) return
  const choice = choices.value.find((item) => item.mediaAssetId === mediaAssetId)
  if (!choice) return
  localChoice.value = mediaAssetId
  if (value.value) updateValue(value.value, choice.title)
}
</script>

<template>
  <section class="picture-writing" aria-label="看图写故事练习">
    <fieldset class="picture-writing__choices" :disabled="question.submitted">
      <legend>选择一组图，写出你的故事</legend>
      <label v-for="choice in choices" :key="choice.mediaAssetId">
        <input
          type="radio"
          :name="`story-${question.id}`"
          :value="choice.mediaAssetId"
          :checked="selected?.mediaAssetId === choice.mediaAssetId"
          @change="selectPicture(choice.mediaAssetId)"
        />
        {{ choice.title }}
      </label>
    </fieldset>
    <p class="picture-writing__switch-note">切换图片会保留已写内容；提交时一并记录所选故事名。</p>
    <h3>{{ selected?.title }}</h3>
    <p>按左上、右上、左下、右下的顺序观察四幅图，再想想接下来会发生什么。</p>
    <QuestionMediaRenderer :media="media" />
    <p class="picture-writing__credit">AI生成练习素材 · 根据提供的故事主题绘制</p>
    <p class="picture-writing__prompt">{{ selected?.prompt }}</p>
    <label
      class="question-input-label question-input-label--wide picture-writing__answer"
      :for="`picture-writing-${question.id}`"
    >
      <span>我的故事</span>
      <textarea
        :id="`picture-writing-${question.id}`"
        :rows="lines"
        :value="value"
        :style="{ '--writing-lines': lines }"
        :disabled="question.submitted"
        placeholder="先写图中的人物和事情，再续写后面的故事……"
        @input="updateValue(($event.target as HTMLTextAreaElement).value)"
      />
    </label>
    <p class="question-answer-group__instruction">
      没有唯一答案。写完读一读，检查故事是否连贯；提交后请老师或家长点评，不自动判分。
    </p>
  </section>
</template>

<style scoped>
.picture-writing {
  display: grid;
  gap: 12px;
}
.picture-writing__choices {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 18px;
  padding: 14px;
  border: 1px solid var(--color-border);
  border-radius: 12px;
}
.picture-writing__choices legend {
  padding: 0 6px;
  font-weight: 600;
}
.picture-writing__choices label {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}
.picture-writing__switch-note,
.picture-writing__credit {
  color: var(--color-text-secondary);
  font-size: 13px;
}
.picture-writing :deep(.question-media__image) {
  max-height: none;
  height: auto;
}
.picture-writing__answer textarea {
  box-sizing: border-box;
  min-height: calc(var(--writing-lines) * 2rem + 1.2rem);
  padding: 0.6rem 0.8rem;
  line-height: 2rem;
  background-color: var(--color-surface);
  background-image: repeating-linear-gradient(
    to bottom,
    transparent 0,
    transparent calc(2rem - 1px),
    var(--color-border) calc(2rem - 1px),
    var(--color-border) 2rem
  );
  background-origin: content-box;
  background-clip: content-box;
  resize: vertical;
}
</style>
