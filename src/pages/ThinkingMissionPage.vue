<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppShell from '@/layouts/AppShell.vue'
import ThinkingPlayer from '@/components/thinking/ThinkingPlayer.vue'
import { findThinkingIsland, findThinkingMission } from '@/data/thinking/islands'
import { useThinkingProfile } from '@/composables/useThinkingProfile'
import '@/styles/thinking.css'

const route = useRoute(),
  { profileId } = useThinkingProfile()
const island = computed(() => findThinkingIsland(String(route.params.islandId)))
const mission = computed(() =>
  findThinkingMission(String(route.params.islandId), String(route.params.missionId)),
)
</script>
<template>
  <AppShell context="思维训练 · 动手试一试">
    <div
      class="thinking-page thinking-mission-page content-container"
      :style="
        island ? { '--thinking-color': island.color, '--thinking-soft': island.softColor } : {}
      "
    >
      <nav class="thinking-breadcrumb" aria-label="思维训练导航">
        <RouterLink to="/thinking-islands">全部思维岛</RouterLink
        ><RouterLink v-if="island" :to="'/thinking-islands/' + island.id"
          >返回{{ island.title }}</RouterLink
        >
      </nav>
      <template v-if="mission && island"
        ><header class="thinking-mission-heading">
          <p class="thinking-eyebrow">{{ island.title }}</p>
          <h1>{{ mission.title }}</h1>
          <p>{{ mission.description }}</p>
        </header>
        <ThinkingPlayer
          :key="mission.id + ':' + profileId"
          :mission="mission"
          :profile-id="profileId"
        />
        <p class="thinking-note">
          不限时，不用比快。完成情况仅用于记住本岛进度，不代表能力分数。未完成的方案离开后需要重新操作。
        </p></template
      >
      <section v-else class="thinking-empty">
        <h1>这个任务暂时找不到</h1>
        <p>回到群岛，重新选一条训练路线吧。</p>
        <RouterLink to="/thinking-islands" class="thinking-button">返回思维群岛</RouterLink>
      </section>
    </div>
  </AppShell>
</template>
