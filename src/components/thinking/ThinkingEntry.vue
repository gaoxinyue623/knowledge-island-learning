<script setup lang="ts">
import AppIcon from '@/components/common/AppIcon.vue'
defineProps<{ compact?: boolean }>()
</script>
<template>
  <section
    class="thinking-entry"
    :class="{ 'thinking-entry--compact': compact }"
    aria-label="课外思维训练"
  >
    <span class="thinking-entry__icon"><AppIcon name="lightbulb" :size="30" decorative /></span>
    <div>
      <p>课本之外，还有新发现</p>
      <h2>去思维群岛动动脑</h2>
      <p v-if="!compact">找规律、当侦探、走迷宫、做规划。四座原创训练岛，不用选择教材。</p>
    </div>
    <RouterLink to="/thinking-islands" class="thinking-link"
      >探索思维群岛<AppIcon name="arrow-right" :size="19" decorative
    /></RouterLink>
  </section>
</template>
<style scoped>
.thinking-entry {
  display: flex;
  gap: 18px;
  align-items: center;
  flex-wrap: wrap;
  padding: 24px;
  margin: 24px 0;
  border: 2px solid #cab9db;
  border-radius: 26px;
  background: #f4eff8;
  color: #514465;
}
.thinking-entry__icon {
  display: grid;
  place-items: center;
  width: 58px;
  height: 58px;
  background: #e5d8f0;
  border-radius: 20px;
  flex: none;
}
.thinking-entry h2 {
  font-size: clamp(20px, 3vw, 27px);
  margin: 4px 0 8px;
}
.thinking-entry p {
  margin: 0;
  font-size: 14px;
  line-height: 1.7;
}
.thinking-entry > div {
  flex: 1;
  min-width: 170px;
}
.thinking-link {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: center;
  min-height: 46px;
  padding: 10px 16px;
  border: 2px solid #8b759e;
  border-radius: 15px;
  background: #fffaf0;
  color: #594368;
  font-weight: 700;
  text-decoration: none;
  box-shadow: 0 3px 0 #ccbddd;
}
.thinking-link:focus-visible {
  outline: 3px solid #594368;
  outline-offset: 4px;
}
.thinking-entry--compact {
  padding: 18px;
}
.thinking-entry--compact h2 {
  font-size: 21px;
}
@media (max-width: 480px) {
  .thinking-entry {
    padding: 18px;
    gap: 12px;
  }
  .thinking-link {
    width: 100%;
  }
}
</style>
