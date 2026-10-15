<script setup lang="ts">
import { textbookDirectoryPreview } from '@/services/curriculum/textbookPreview'
import AppIcon from '@/components/common/AppIcon.vue'
import type { TextbookDisplay } from '@/types'

interface Props {
  options: TextbookDisplay[]
  selectedId: string | null
  gradeName?: string
  semesterName?: string
}

const props = withDefaults(defineProps<Props>(), {
  gradeName: '当前年级',
  semesterName: '当前学期',
})
const emit = defineEmits<{ select: [textbookId: string] }>()
</script>

<template>
  <div class="textbook-selector-list">
    <p>先核对课本封面和版权页，再比较下面的目录。名称相近时，以实际课本目录为准。</p>
    <button
      v-for="option in props.options"
      :key="option.textbook.id"
      class="textbook-selector-option"
      :class="{ 'textbook-selector-option--selected': props.selectedId === option.textbook.id }"
      type="button"
      :aria-pressed="props.selectedId === option.textbook.id"
      @click="emit('select', option.textbook.id)"
    >
      <span>
        <strong>{{ option.textbook.versionName }}</strong>
        <small
          >{{ option.publisher.name }} · {{ props.gradeName }} · {{ props.semesterName }}</small
        >
        <small>版次标识：{{ option.textbook.editionYear || '请核对完整版本名称' }}</small>
        <small
          v-for="line in textbookDirectoryPreview(option.textbook.id)"
          :key="line"
          style="display: block; white-space: normal; line-height: 1.7"
          >{{ line }}</small
        >
      </span>
      <AppIcon
        :name="props.selectedId === option.textbook.id ? 'check-circle' : 'book-open'"
        :color="props.selectedId === option.textbook.id ? 'var(--color-success)' : 'currentColor'"
        :size="20"
        decorative
      />
    </button>
  </div>
</template>
