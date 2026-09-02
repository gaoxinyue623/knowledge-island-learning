export const motion = {
  duration: {
    fast: '160ms',
    normal: '280ms',
    slow: '420ms',
    reward: '800ms',
    rewardMax: '1600ms',
  },
  easing: {
    standard: 'cubic-bezier(0.2, 0.75, 0.25, 1)',
    bounce: 'cubic-bezier(0.2, 0.9, 0.3, 1.15)',
    reward: 'cubic-bezier(0.2, 0.8, 0.25, 1)',
  },
  stagger: {
    short: '60ms',
    maxItems: 5,
  },
} as const
