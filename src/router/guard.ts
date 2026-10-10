export function getOnboardingDraftRedirect(
  path: string,
  draft: {
    selectedRegionId?: string | null
    selectedGradeId: string | null
    selectedSemesterId: string | null
  },
): string | null {
  if (path !== '/onboarding/grade' && path !== '/onboarding/textbooks') return null
  if (path === '/onboarding/textbooks' && (!draft.selectedGradeId || !draft.selectedSemesterId))
    return '/onboarding/grade'
  return null
}

export function getOnboardingRedirect(
  path: string,
  requiresOnboarding: boolean,
  profileIsComplete: boolean,
  allowOnboardingEdit = false,
): string | null {
  if (requiresOnboarding && !profileIsComplete) return '/onboarding'
  if (path === '/onboarding' && profileIsComplete && !allowOnboardingEdit) return '/home'
  return null
}
