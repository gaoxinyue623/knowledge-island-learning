<script setup lang="ts">
interface Props {
  title: string
  description?: string
  metadata?: Record<string, string | boolean | undefined>
}

withDefaults(defineProps<Props>(), {
  description: 'PHASE 4 基础路由占位：业务页面将在后续阶段实现。',
  metadata: undefined,
})
</script>

<template>
  <section class="dev-placeholder">
    <div class="dev-placeholder__eyebrow">DESIGN PLACEHOLDER</div>
    <h1 class="dev-placeholder__title">{{ title }}</h1>
    <p class="dev-placeholder__description">{{ description }}</p>
    <dl v-if="metadata" class="dev-placeholder__metadata">
      <template v-for="(value, key) in metadata" :key="key">
        <dt>{{ key }}</dt>
        <dd>{{ value === undefined ? '未设置' : String(value) }}</dd>
      </template>
    </dl>
  </section>
</template>
