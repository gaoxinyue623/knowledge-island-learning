<script setup lang="ts">
interface Props {
  eyebrow: string
  title?: string
}

const props = defineProps<Props>()
</script>

<template>
  <article class="lesson-block" :class="`lesson-block--${props.eyebrow.toLowerCase()}`">
    <header class="lesson-block__header">
      <p class="lesson-block__eyebrow">{{ props.eyebrow }}</p>
      <h3 v-if="props.title">{{ props.title }}</h3>
    </header>
    <div class="lesson-block__body">
      <slot />
    </div>
  </article>
</template>
