<script setup lang="ts">
import { computed, getCurrentInstance } from 'vue'
import { RouterLink } from 'vue-router'
const props = withDefaults(defineProps<{ contentId: string; category?: string }>(), {
  category: 'content',
})
const instance = getCurrentInstance()
const hasRouter = Boolean(instance?.appContext.config.globalProperties.$router)
const to = computed(() => ({
  path: '/feedback',
  query: {
    from: instance?.appContext.config.globalProperties.$route?.path ?? '/',
    contentId: props.contentId.slice(0, 200),
    category: props.category,
  },
}))
const href = computed(() => `/feedback?${new URLSearchParams(to.value.query).toString()}`)
</script>
<template>
  <RouterLink v-if="hasRouter" :to="to" class="content-feedback-link"
    >这道题有问题？告诉我们</RouterLink
  ><a v-else class="content-feedback-link" :href="href">这道题有问题？告诉我们</a>
</template>
<style scoped>
.content-feedback-link {
  display: inline-block;
  padding: 8px 0;
  color: #547657;
  font-size: 12px;
  text-decoration: underline;
}
</style>
