<script setup lang="ts">
import { computed, ref } from 'vue'

import AppIcon from '@/components/common/AppIcon.vue'
import type { Region } from '@/types'
import RegionCard from './RegionCard.vue'

interface Props {
  regions: Region[]
  selectedRegionId?: string | null
}

const props = withDefaults(defineProps<Props>(), {
  selectedRegionId: null,
})

const emit = defineEmits<{ select: [region: Region] }>()
const query = ref('')
const filteredRegions = computed(() => {
  const normalizedQuery = query.value.trim().toLowerCase()
  if (!normalizedQuery) return props.regions
  return props.regions.filter((region) => region.name.toLowerCase().includes(normalizedQuery))
})
</script>

<template>
  <div class="curriculum-selector">
    <label class="curriculum-search">
      <span class="sr-only">搜索地区</span>
      <AppIcon name="search" :size="20" decorative />
      <input v-model="query" type="search" placeholder="搜索地区" />
    </label>
    <div v-if="filteredRegions.length" class="curriculum-choice-grid">
      <RegionCard
        v-for="region in filteredRegions"
        :key="region.id"
        :region="region"
        :selected="props.selectedRegionId === region.id"
        @select="emit('select', $event)"
      />
    </div>
    <p v-else class="curriculum-inline-empty">没有找到匹配地区，请换个关键词试试。</p>
  </div>
</template>
