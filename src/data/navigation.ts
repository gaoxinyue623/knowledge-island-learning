import type { IconName } from '@/types'

export interface NavigationItem {
  label: string
  path: string
  icon: IconName
}

export const studentNavigation: NavigationItem[] = [
  { label: '首页', path: '/home', icon: 'home' },
  { label: '地图', path: '/map/sample-map', icon: 'map' },
  { label: '任务', path: '/tasks', icon: 'route' },
  { label: '错题', path: '/wrong-book', icon: 'refresh-cw' },
  { label: '我的', path: '/profile', icon: 'user-round' },
]
