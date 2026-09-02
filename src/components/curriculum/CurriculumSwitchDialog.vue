<script setup lang="ts">
import AppModal from '@/components/common/AppModal.vue'

interface Props {
  open: boolean
  title: string
  description: string
}

const props = defineProps<Props>()
const emit = defineEmits<{ close: []; confirm: [] }>()
</script>

<template>
  <AppModal
    :open="props.open"
    :title="props.title"
    :description="props.description"
    primary-label="继续修改"
    secondary-label="先不修改"
    @close="emit('close')"
    @primary="emit('confirm')"
    @secondary="emit('close')"
  >
    <p>更换后会重新解析可用教材，并在保存前保留你当前的学习配置。</p>
  </AppModal>
</template>
