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
