import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    requiresOnboarding?: boolean
    studentOnly?: boolean
    parentOnly?: boolean
    hideBottomNav?: boolean
    immersiveMode?: boolean
    devOnly?: boolean
    title?: string
  }
}

export {}
