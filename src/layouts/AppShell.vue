<script setup lang="ts">
import KnowledgeDangoPlaceholder from '@/components/character/KnowledgeDangoPlaceholder.vue'
import PetStatusLink from '@/components/pet/PetStatusLink.vue'
import AppIcon from '@/components/common/AppIcon.vue'
import type { IconName } from '@/types'

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

const navigationItems: Array<{ label: string; path: string; icon: IconName }> = [
  { label: '首页', path: '/home', icon: 'home' },
  { label: '地图', path: '/learning-map', icon: 'map' },
  { label: '今日', path: '/tasks', icon: 'route' },
  { label: '成长', path: '/achievements', icon: 'star' },
  { label: '我的', path: '/profile', icon: 'user-round' },
]
</script>

<template>
  <div class="app-shell">
    <header v-if="showHeader" class="app-shell__header safe-area-top">
      <div class="app-shell__header-inner content-container">
        <a class="app-shell__brand" href="/" aria-label="知识岛首页">
          <span class="app-shell__brand-mark" aria-hidden="true">
            <KnowledgeDangoPlaceholder size="avatar" state="happy" />
          </span>
          <span class="app-shell__brand-copy">知识岛<small>让好奇心，带你出发</small></span>
        </a>
        <div class="app-shell__header-context" aria-label="当前学习上下文">{{ props.context }}</div>
        <PetStatusLink />
      </div>
    </header>

    <main class="app-shell__main">
      <slot />
    </main>

    <nav v-if="showBottomNav" class="app-shell__bottom-nav safe-area-bottom" aria-label="主要导航">
      <RouterLink
        v-for="item in navigationItems"
        :key="item.path"
        :to="item.path"
        class="app-shell__bottom-nav-item"
        exact-active-class="app-shell__bottom-nav-item--active"
      >
        <span class="app-shell__nav-icon"><AppIcon :name="item.icon" :size="22" decorative /></span>
        <span>{{ item.label }}</span>
      </RouterLink>
    </nav>
  </div>
</template>
