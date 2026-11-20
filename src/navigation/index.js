import { authRoutes, onboardingRoute } from './routes/auth';
import { errandRoutes } from './routes/errands';
import { homeRoute } from './routes/home';
import { profileEditRoute, profileRoutes } from './routes/profile';
import { walletRoutes } from './routes/wallet';

const routes = {
  ...authRoutes,
  ...errandRoutes,
  ...profileRoutes,
  ...walletRoutes,
};

// Screens whose ids carry a parameter (e.g. `onboarding2`, `profile-edit-name`).
const prefixRoutes = [
  ['onboarding', onboardingRoute],
  ['profile-edit-', profileEditRoute],
];

/** Screens that show the bottom tab bar. */
export const TAB_SCREENS = ['home', 'tracking', 'pal-active', 'errands', 'profile', 'wallet'];

/** Which tab is highlighted: tracking screens belong to Home. */
export const tabFor = (screen) =>
  screen === 'tracking' || screen === 'pal-active' ? 'home' : screen;

/** Finds the route for a screen id; unknown ids fall back to home. */
export function resolveRoute(screen, context) {
  const exact = routes[screen];
  if (exact) return exact(context);
  const prefixed = prefixRoutes.find(([prefix]) => screen.startsWith(prefix));
  if (prefixed) return prefixed[1](context);
  return homeRoute(context);
}

/** Login, sign-up and onboarding screens always keep the light look. */
export function isAuthScreen(screen) {
  return screen in authRoutes || screen.startsWith('onboarding');
}
