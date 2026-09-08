<script setup lang="ts">
import AppShell from '@/layouts/AppShell.vue'
</script>
<template>
  <AppShell context="页面未找到"
    ><section class="content-container personal-panel">
      <h1>这个页面暂时找不到</h1>
      <p>链接可能已经更新，请从首页重新选择。</p>
      <RouterLink to="/">返回首页</RouterLink>
    </section></AppShell
  >
</template>
