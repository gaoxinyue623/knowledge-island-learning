<script setup lang="ts">
import { useId } from 'vue'

import StudentReadAloud from '@/components/common/StudentReadAloud.vue'

type ReadingSize = 'standard' | 'large' | 'xlarge'

const props = withDefaults(
  defineProps<{
    text: string
    canRead?: boolean
    muted?: boolean
    scope: string
    modelValue: ReadingSize
  }>(),
  { canRead: false, muted: false },
)
const emit = defineEmits<{ 'update:modelValue': [value: ReadingSize] }>()
const id = useId()
const sizes: Array<{ value: ReadingSize; label: string }> = [
  { value: 'standard', label: '标准' },
  { value: 'large', label: '大字' },
  { value: 'xlarge', label: '特大字' },
]
</script>

<template>
  <div class="lesson-reading-controls" data-test="lesson-reading-controls">
    <StudentReadAloud
      v-if="props.canRead"
      data-test="lesson-read-aloud"
      :text="props.text"
      :scope="props.scope"
      :muted="props.muted"
      label="听这一步"
    />
    <fieldset class="lesson-reading-controls__sizes">
      <legend>文字大小</legend>
      <label v-for="size in sizes" :key="size.value">
        <input
          :name="`${id}-size`"
          type="radio"
          :value="size.value"
          :checked="props.modelValue === size.value"
          @change="emit('update:modelValue', size.value)"
        />
        <span>{{ size.label }}</span>
      </label>
    </fieldset>
  </div>
</template>
