<script setup lang="ts">
interface Props {
  type: string
  showDiagnostics?: boolean
}

const props = withDefaults(defineProps<Props>(), { showDiagnostics: false })
</script>

<template>
  <div class="question-unsupported" role="status">
    <strong>暂不支持这类题目</strong>
    <p>你可以返回课程，稍后再来看看。</p>
    <code v-if="props.showDiagnostics">questionType: {{ props.type }}</code>
  </div>
</template>
