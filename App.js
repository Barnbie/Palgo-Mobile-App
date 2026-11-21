import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { preloadAssets } from './src/lib/preloadAssets';
import { PalGoBottomTabs, rebuildStyles, s } from './src/AppComponents';
import { applyColorScheme, colors } from './src/theme';
import { setLanguage } from './src/i18n';
import { isAuthScreen, resolveRoute, TAB_SCREENS, tabFor } from './src/navigation';
import { REMEMBERED_EMAIL_KEY, useAccount } from './src/state/useAccount';
import { preferences as storedPreferences } from './src/lib/secureStorage';
import { supabase } from './src/lib/supabase';
import { useErrands } from './src/state/useErrands';
import { THEME_MODES, usePreferences } from './src/state/usePreferences';
import { UnreadContext, useUnreadCount } from './src/state/useUnreadCount';
import { usePalLocationSharing } from './src/state/useLiveLocation';
import { useRouter } from './src/state/useRouter';
import { useWithdrawalPin } from './src/state/useWithdrawalPin';

const TOAST_MS = 2200;
// Pal earnings are not connected to payments yet.
const EMPTY_WALLET = { available: 0, total: 0, withdrawn: 0 };

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  // Phones/tablets with an on-screen Android navigation bar: keep the app above it.
  const insets = useSafeAreaInsets();
  const { screen, screenRef, go } = useRouter('splash');
  const preferences = usePreferences();
  const [toast, setToast] = useState('');
  const activeScheme = useRef('light');
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  // Load the app's pictures first, then drop the splash, so screens never show blank art.
  useEffect(() => {
    preloadAssets()
      .catch(() => {})
      .finally(() => SplashScreen.hideAsync().catch(() => {}));
  }, []);

  const notify = useCallback((text) => {
    setToast(text);
    setTimeout(() => setToast(''), TOAST_MS);
  }, []);

  const account = useAccount({ go, notify, screen, screenRef });
  const errands = useErrands({
    role: account.role,
    authUserId: account.authUserId,
    screen,
    screenRef,
    go,
    notify,
  });
  usePalLocationSharing({
    role: account.role,
    authUserId: account.authUserId,
    errands: errands.accountErrands,
  });
  // The theme choice belongs to the login, so it follows the person to any device and role.
  const { setThemeMode } = preferences;
  useEffect(() => {
    if (!account.authUserId || !supabase) return;
    supabase.auth
      .getUser()
      .then(({ data }) => {
        const saved = data?.user?.user_metadata?.theme_mode;
        if (THEME_MODES.includes(saved)) setThemeMode(saved);
      })
      .catch(() => {});
  }, [account.authUserId]); // eslint-disable-line react-hooks/exhaustive-deps
  const chooseTheme = (mode) => {
    setThemeMode(mode);
    if (account.authUserId && supabase) {
      supabase.auth.updateUser({ data: { theme_mode: mode } }).catch(() => {});
    }
  };
  const unreadCount = useUnreadCount({
    role: account.role,
    authUserId: account.authUserId,
    screen,
  });
  const pin = useWithdrawalPin(account.authUserId, account.role);

  const chooseAuthIntent = (intent) => {
    account.setAuthIntent(intent);
    preferences.markOnboardingSeen();
    go('role');
  };

  // Everything a screen might need. Route files pick what they use.
  const context = {
    ...preferences,
    setThemeMode: chooseTheme,
    ...account,
    ...errands,
    ...pin,
    screen,
    go,
    notify,
    chooseAuthIntent,
    rememberedEmail: storedPreferences.get(REMEMBERED_EMAIL_KEY, ''),
    wallet: EMPTY_WALLET,
    selectedTransaction,
    setSelectedTransaction,
    activePal: errands.errand?.pal || {
      name: 'PalGo member',
      userId: errands.errand?.palUserId,
    },
  };
  // Dark mode applies inside the app; login, sign-up and onboarding stay light.
  const scheme = isAuthScreen(screen) ? 'light' : preferences.effectiveScheme;
  if (activeScheme.current !== scheme) {
    activeScheme.current = scheme;
    applyColorScheme(scheme);
    rebuildStyles();
  }
  setLanguage(preferences.language);
  const route = resolveRoute(screen, context);

  // Android's back button follows the same route as the on-screen back arrow.
  const backRef = useRef(route.back);
  backRef.current = route.back;
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!backRef.current) return false;
      backRef.current();
      return true;
    });
    return () => subscription.remove();
  }, []);

  return (
    <UnreadContext.Provider value={unreadCount}>
      <View
        style={{
          flex: 1,
          paddingBottom: insets.bottom,
          backgroundColor: account.role && TAB_SCREENS.includes(screen) ? '#2563EB' : colors.canvas,
        }}
      >
        <View style={[s.safe, { backgroundColor: colors.canvas }]}>
          <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
          {route.view}
          {account.role && TAB_SCREENS.includes(screen) && (
            <PalGoBottomTabs role={account.role} screen={tabFor(screen)} go={go} />
          )}
          {toast ? (
            <View style={s.toast}>
              <Text style={s.toastText}>{toast}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </UnreadContext.Provider>
  );
}
