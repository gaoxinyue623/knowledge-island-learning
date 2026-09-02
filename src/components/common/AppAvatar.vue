<script setup lang="ts">
import KnowledgeDangoPlaceholder from '@/components/character/KnowledgeDangoPlaceholder.vue'

type AvatarKind = 'image' | 'placeholder' | 'initials' | 'character'
type CharacterState = 'idle' | 'happy' | 'think' | 'encourage' | 'success'

interface Props {
  kind?: AvatarKind
  src?: string
  alt?: string
  initials?: string
  characterState?: CharacterState
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  kind: 'placeholder',
  src: undefined,
  alt: '学生头像',
  initials: '知',
  characterState: 'idle',
  size: 'md',
})
</script>

<template>
  <span class="app-avatar" :class="`app-avatar--${props.size}`">
    <img
      v-if="props.kind === 'image' && props.src"
      class="app-avatar__image"
      :src="props.src"
      :alt="props.alt"
    />
    <span v-else-if="props.kind === 'initials'" class="app-avatar__initials" aria-hidden="true">{{
      props.initials
    }}</span>
    <KnowledgeDangoPlaceholder
      v-else-if="props.kind === 'character'"
      :state="props.characterState"
      size="avatar"
    />
    <span v-else class="app-avatar__placeholder" aria-hidden="true">{{ props.initials }}</span>
  </span>
</template>
