<script setup lang="ts">
interface Props {
  step: number
}

const props = defineProps<Props>()
const steps = ['地区', '年级', '教材', '角色']
</script>

<template>
  <div class="onboarding-progress" role="status" :aria-label="`当前步骤 ${props.step} / 4`">
    <span class="onboarding-progress__count">{{ props.step }} / 4</span>
    <span class="onboarding-progress__steps">{{ steps.join(' · ') }}</span>
  </div>
</template>
