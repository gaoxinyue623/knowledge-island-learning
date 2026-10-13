<script setup lang="ts">
import { computed } from 'vue'
import { Flower, Flower2, Leaf, Sprout, Star } from 'lucide-vue-next'

const props = withDefaults(defineProps<{ stageIndex: number; size?: number }>(), { size: 32 })
const marks = [Sprout, Leaf, Flower, Flower2, Star]
const mark = computed(() => marks[Math.max(0, Math.min(4, props.stageIndex))]!)
</script>

<template>
  <component
    :is="mark"
    :size="size"
    :stroke-width="1.8"
    class="pet-growth-mark"
    :class="`pet-growth-mark--${stageIndex}`"
    aria-hidden="true"
  />
</template>

<style scoped>
.pet-growth-mark {
  display: block;
  color: #58895c;
  fill: #dcecb5;
}
.pet-growth-mark--2,
.pet-growth-mark--3 {
  color: #b46d82;
  fill: #f5cbd5;
}
.pet-growth-mark--4 {
  color: #af8436;
  fill: #f8dc8b;
}
</style>
