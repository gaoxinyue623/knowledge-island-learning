<script setup lang="ts">
interface Props {
  step: number
}

const props = defineProps<Props>()
const steps = ['年级', '教材版本', '角色']
</script>

<template>
  <div
    class="onboarding-progress"
    role="status"
    :aria-label="`当前步骤 ${props.step} / ${steps.length}`"
  >
    <span class="onboarding-progress__count">{{ props.step }} / {{ steps.length }}</span>
    <span class="onboarding-progress__steps">{{ steps.join(' · ') }}</span>
  </div>
</template>
