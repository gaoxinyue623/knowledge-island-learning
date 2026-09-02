<script setup lang="ts">
import { computed, type Component } from 'vue'
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookMarked,
  BookOpen,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Coins,
  Filter,
  Home,
  Info,
  Library,
  Lightbulb,
  LoaderCircle,
  Lock,
  Map,
  MapPin,
  Menu,
  Navigation,
  RefreshCw,
  Route,
  Search,
  Settings,
  Sparkles,
  Star,
  UserRound,
  X,
} from 'lucide-vue-next'

import type { IconName } from '@/types'

interface Props {
  name: IconName
  size?: number | string
  strokeWidth?: number | string
  color?: string
  ariaLabel?: string
  decorative?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  size: 24,
  strokeWidth: 2,
  color: 'currentColor',
  ariaLabel: undefined,
  decorative: false,
})

const iconMap: Record<IconName, Component> = {
  'alert-circle': AlertCircle,
  'arrow-left': ArrowLeft,
  'arrow-right': ArrowRight,
  'book-marked': BookMarked,
  'book-open': BookOpen,
  check: Check,
  'check-circle': CheckCircle,
  'chevron-down': ChevronDown,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  'circle-help': CircleHelp,
  coins: Coins,
  filter: Filter,
  home: Home,
  info: Info,
  library: Library,
  lightbulb: Lightbulb,
  'loader-circle': LoaderCircle,
  lock: Lock,
  map: Map,
  'map-pin': MapPin,
  menu: Menu,
  navigation: Navigation,
  'refresh-cw': RefreshCw,
  route: Route,
  search: Search,
  settings: Settings,
  sparkles: Sparkles,
  star: Star,
  'user-round': UserRound,
  x: X,
}

const iconComponent = computed(() => iconMap[props.name])
</script>

<template>
  <component
    :is="iconComponent"
    :size="size"
    :stroke-width="strokeWidth"
    :color="color"
    :aria-label="decorative ? undefined : ariaLabel"
    :aria-hidden="decorative ? true : undefined"
    focusable="false"
  />
</template>
