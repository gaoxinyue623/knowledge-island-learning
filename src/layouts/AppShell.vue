<script setup lang="ts">
import AppAvatar from '@/components/common/AppAvatar.vue'

interface Props {
  showHeader?: boolean
  showBottomNav?: boolean
  context?: string
}

const props = withDefaults(defineProps<Props>(), {
  showHeader: true,
  showBottomNav: false,
  context: '学习配置',
})
</script>

<template>
  <div class="app-shell">
    <header v-if="showHeader" class="app-shell__header safe-area-top">
      <div class="app-shell__header-inner content-container">
        <a class="app-shell__brand" href="/" aria-label="知识岛首页">
          <span class="app-shell__brand-mark" aria-hidden="true">知</span>
          <span>知识岛</span>
        </a>
        <div class="app-shell__header-context" aria-label="当前学习上下文">{{ props.context }}</div>
        <AppAvatar kind="character" size="sm" />
      </div>
    </header>

    <main class="app-shell__main">
      <slot />
    </main>

    <nav v-if="showBottomNav" class="app-shell__bottom-nav safe-area-bottom" aria-label="主要导航">
      <a href="/home">首页</a>
      <a href="/learning-map">地图</a>
      <a href="/tasks">任务</a>
      <a href="/profile">我的</a>
    </nav>
  </div>
</template>
