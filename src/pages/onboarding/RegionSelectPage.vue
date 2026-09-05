<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppEmptyState from '@/components/common/AppEmptyState.vue'
import AppErrorState from '@/components/common/AppErrorState.vue'
import AppLoading from '@/components/common/AppLoading.vue'
import RegionSelector from '@/components/curriculum/RegionSelector.vue'
import CurriculumPageFrame from '@/pages/curriculum/CurriculumPageFrame.vue'
import { curriculumService } from '@/services'
import { useCurriculumStore } from '@/stores/curriculumStore'
import type { Region } from '@/types'

const router = useRouter()
const route = useRoute()
const curriculumStore = useCurriculumStore()
const regions = ref<Region[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const hasRegions = computed(() => regions.value.length > 0)
const isSettingsEdit = computed(() => route.query.from === 'settings')
const backTo = computed(() => (isSettingsEdit.value ? '/curriculum-settings' : '/onboarding'))

async function loadRegions() {
  loading.value = true
  error.value = null
  try {
    regions.value = await curriculumService.getRegions()
  } catch (caught) {
    error.value = caught instanceof Error ? caught.message : '地区暂时无法加载'
  } finally {
    loading.value = false
  }
}

function selectRegion(region: Region) {
  curriculumStore.selectRegion(region.id)
  router.push({
    path: '/onboarding/grade',
    query: isSettingsEdit.value ? { from: 'settings' } : undefined,
  })
}

onMounted(() => void loadRegions())
</script>

<template>
  <CurriculumPageFrame
    title="你在哪里学习？"
    description="选择所在地区，我们只用它来查找可用教材，不会把地区当成出版社。"
    :step="1"
    :back-to="backTo"
  >
    <AppLoading v-if="loading" label="正在准备地区列表" />
    <AppErrorState
      v-else-if="error"
      title="地区列表暂时打不开"
      :description="error"
      @retry="loadRegions"
    />
    <AppEmptyState
      v-else-if="!hasRegions"
      title="还没有可选地区"
      description="地区数据正在准备中，请稍后再试。"
      action-label="重新加载"
      @action="loadRegions"
    />
    <RegionSelector
      v-else
      :regions="regions"
      :selected-region-id="curriculumStore.selectedRegionId"
      @select="selectRegion"
    />
  </CurriculumPageFrame>
</template>
