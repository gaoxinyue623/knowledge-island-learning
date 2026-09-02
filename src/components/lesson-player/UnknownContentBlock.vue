<script setup lang="ts">
interface Props {
  type: string
  showDiagnostics?: boolean
}

const props = withDefaults(defineProps<Props>(), { showDiagnostics: false })
</script>

<template>
  <article class="lesson-block lesson-block--unknown" role="status">
    <p class="lesson-block__eyebrow">内容提示</p>
    <h3>这一步的内容正在准备中</h3>
    <p>我们暂时无法展示这类内容，但不会影响你返回地图继续探索。</p>
    <details v-if="props.showDiagnostics" class="lesson-block__diagnostics">
      <summary>Unsupported Content Block</summary>
      <code>type: {{ props.type }}</code>
    </details>
  </article>
</template>
