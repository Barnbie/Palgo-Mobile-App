import { useEffect, useState } from 'react';
import { Appearance, useColorScheme } from 'react-native';
import { preferences } from '../lib/secureStorage';

const THEME_KEY = 'palgo.theme.mode';
const LANGUAGE_KEY = 'palgo.language';
export const THEME_MODES = ['light', 'dark', 'system'];
const ONBOARDING_KEY = 'palgo.onboarding.complete';

/** Device-level settings that survive restarts: colour theme and onboarding. */
export function usePreferences() {
  const systemScheme = useColorScheme() || 'light';
  const [themeMode, setThemeModeState] = useState(() => preferences.get(THEME_KEY, 'system'));
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(
    () => preferences.get(ONBOARDING_KEY) === 'true',
  );
  const [language, setLanguageState] = useState(() => preferences.get(LANGUAGE_KEY, 'en'));
  const effectiveScheme = themeMode === 'system' ? systemScheme : themeMode;

  // Save the choice the moment it is made, so it survives logout, login and restarts.
  const setThemeMode = (mode) => {
    if (!THEME_MODES.includes(mode)) return;
    preferences.set(THEME_KEY, mode);
    setThemeModeState(mode);
  };

  useEffect(() => {
    Appearance.setColorScheme(themeMode === 'system' ? 'auto' : themeMode);
  }, [themeMode]);

  const setLanguage = (code) => {
    setLanguageState(code);
    preferences.set(LANGUAGE_KEY, code);
  };

  const markOnboardingSeen = () => {
    setHasSeenOnboarding(true);
    preferences.set(ONBOARDING_KEY, 'true');
  };

  return {
    language,
    setLanguage,
    themeMode,
    setThemeMode,
    effectiveScheme,
    hasSeenOnboarding,
    markOnboardingSeen,
  };
}
