import { useEffect, useState } from 'react';
import { Appearance, useColorScheme } from 'react-native';
import { preferences } from '../lib/secureStorage';

const THEME_KEY = 'palgo.theme.mode';
const ONBOARDING_KEY = 'palgo.onboarding.complete';

/** Device-level settings that survive restarts: colour theme and onboarding. */
export function usePreferences() {
  const systemScheme = useColorScheme() || 'light';
  const [themeMode, setThemeMode] = useState(() => preferences.get(THEME_KEY, 'system'));
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(
    () => preferences.get(ONBOARDING_KEY) === 'true',
  );
  const effectiveScheme = themeMode === 'system' ? systemScheme : themeMode;

  useEffect(() => {
    Appearance.setColorScheme(themeMode === 'system' ? 'auto' : themeMode);
    preferences.set(THEME_KEY, themeMode);
  }, [themeMode]);

  const markOnboardingSeen = () => {
    setHasSeenOnboarding(true);
    preferences.set(ONBOARDING_KEY, 'true');
  };

  return { themeMode, setThemeMode, effectiveScheme, hasSeenOnboarding, markOnboardingSeen };
}
