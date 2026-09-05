<script setup lang="ts">
type DangoState = 'idle' | 'happy' | 'think' | 'encourage' | 'success'
type DangoSize = 'sm' | 'avatar' | 'md' | 'lg'

interface Props {
  state?: DangoState
  size?: DangoSize
  label?: string
}

const props = withDefaults(defineProps<Props>(), {
  state: 'idle',
  size: 'md',
  label: '知识团子',
})
</script>

<template>
  <div
    class="dango-placeholder"
    :class="[`dango-placeholder--${props.size}`, `dango-placeholder--${props.state}`]"
    role="img"
    :aria-label="props.label"
  >
    <div class="dango-placeholder__shadow" aria-hidden="true" />
    <div class="dango-placeholder__body">
      <span class="dango-placeholder__mark" aria-hidden="true" />
      <span class="dango-placeholder__arm dango-placeholder__arm--left" aria-hidden="true" />
      <span class="dango-placeholder__arm dango-placeholder__arm--right" aria-hidden="true" />
      <span class="dango-placeholder__foot dango-placeholder__foot--left" aria-hidden="true" />
      <span class="dango-placeholder__foot dango-placeholder__foot--right" aria-hidden="true" />
      <span class="dango-placeholder__face" aria-hidden="true">
        <span class="dango-placeholder__cheek dango-placeholder__cheek--left" />
        <span class="dango-placeholder__cheek dango-placeholder__cheek--right" />
        <span class="dango-placeholder__eye dango-placeholder__eye--left" />
        <span class="dango-placeholder__eye dango-placeholder__eye--right" />
        <span class="dango-placeholder__mouth" />
      </span>
    </div>
  </div>
</template>
