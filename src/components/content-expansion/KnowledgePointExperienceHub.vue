<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import { contentExpansionRepository } from '@/services/content-expansion'
import type { ContentExpansionBundle, Id } from '@/types'

const props = withDefaults(
  defineProps<{
    knowledgePointId: Id
    dataset?: 'profile' | 'golden'
  }>(),
  { dataset: 'profile' },
)

const bundle = ref<ContentExpansionBundle | null>(null)
const loading = ref(true)
const practiceSummary = computed(
  () => bundle.value?.practiceSets.reduce((total, item) => total + item.targetCount, 0) ?? 0,
)

async function load(): Promise<void> {
  loading.value = true
  bundle.value = await contentExpansionRepository.getBundle(props.knowledgePointId, props.dataset)
  loading.value = false
}

onMounted(() => void load())
</script>

<template>
  <section v-if="!loading && bundle" class="experience-hub" aria-labelledby="experience-hub-title">
    <div class="experience-hub__heading">
      <div>
        <p class="curriculum-eyebrow">KnowledgePoint Hub · 体验层</p>
        <h2 id="experience-hub-title">继续探索这个知识点</h2>
        <p>学习内容、互动活动和练习集合各自负责不同的学习动作。</p>
      </div>
      <RouterLink
        class="experience-hub__link"
        :to="{
          path: '/dev/content-expansion',
          query: { knowledgePointId: bundle.knowledgePointId },
        }"
        >打开体验层</RouterLink
      >
    </div>
    <div class="experience-hub__stats" aria-label="体验层内容数量">
      <span
        ><strong>{{ bundle.activities.length }}</strong> 个互动活动</span
      >
      <span
        ><strong>{{ bundle.practiceSets.length }}</strong> 组练习</span
      >
      <span
        ><strong>{{ practiceSummary }}</strong> 个练习目标</span
      >
      <span
        ><strong>{{ bundle.extensionActivities.length + bundle.challenges.length }}</strong>
        个拓展挑战</span
      >
    </div>
  </section>
</template>
