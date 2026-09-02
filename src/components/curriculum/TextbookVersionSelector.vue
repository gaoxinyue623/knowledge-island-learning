<script setup lang="ts">
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
