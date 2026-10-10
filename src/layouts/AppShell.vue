<script setup lang="ts">
import { accountState } from '@/services/account/accountService'
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
        <div class="app-shell__header-actions">
          <PetStatusLink />
          <RouterLink
            v-if="accountState.username"
            to="/account"
            class="app-shell__account"
            :aria-label="`${accountState.username}，账号与同步`"
            :title="`${accountState.username} · 账号与同步`"
          >
            <span class="app-shell__account-avatar" aria-hidden="true">
              <AppIcon name="user-round" :size="17" decorative />
            </span>
            <span class="app-shell__account-name">{{ accountState.username }}</span>
            <AppIcon class="app-shell__account-arrow" name="chevron-right" :size="14" decorative />
          </RouterLink>
        </div>
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

<style scoped>
.app-shell__header-inner {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
}

.app-shell__brand {
  justify-self: start;
}

.app-shell__header-context {
  max-width: 260px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-shell__header-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  min-width: 0;
}

.app-shell__account {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  max-width: 200px;
  min-height: 44px;
  padding: 5px 10px 5px 6px;
  border: 1px solid #d8e2cf;
  border-radius: 999px;
  background: #fffdf5;
  color: #315f50;
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
  transition:
    background-color 150ms ease,
    border-color 150ms ease;
}

.app-shell__account:hover,
.app-shell__account.router-link-active {
  border-color: #b7cbb7;
  background: #edf4e2;
}

.app-shell__account:focus-visible {
  outline: 2px solid #315f50;
  outline-offset: 3px;
}

.app-shell__account-avatar {
  display: grid;
  place-items: center;
  flex: 0 0 30px;
  height: 30px;
  border-radius: 50%;
  background: #eaf0dd;
  color: #52714f;
}

.app-shell__account-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-shell__account-arrow {
  flex-shrink: 0;
  color: #77907a;
}

@media (max-width: 767px) {
  .app-shell__header-inner {
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 10px;
  }

  .app-shell__header-actions {
    gap: 6px;
  }

  .app-shell__account {
    max-width: 136px;
    gap: 6px;
    padding-right: 8px;
    font-size: 13px;
  }

  .app-shell__account-arrow {
    display: none;
  }
}

@media (max-width: 480px) {
  .app-shell__brand {
    gap: 8px;
  }

  .app-shell__brand-mark {
    flex-shrink: 0;
    width: 36px;
    height: 36px;
  }

  .app-shell__brand-copy {
    font-size: 18px;
  }

  .app-shell__brand-copy small {
    display: none;
  }

  .app-shell__account {
    max-width: 110px;
  }

  .app-shell__account-avatar {
    flex-basis: 28px;
    height: 28px;
  }
}

@media (max-width: 380px) {
  .app-shell__header-actions :deep(.pet-status-link) {
    justify-content: center;
    width: 44px;
    padding: 0;
  }

  .app-shell__header-actions :deep(.pet-status-link > span:last-child) {
    display: none;
  }
}
</style>
