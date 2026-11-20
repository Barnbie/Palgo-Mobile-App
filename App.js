import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { PalGoBottomTabs, rebuildStyles, s } from './src/AppComponents';
import { applyColorScheme, colors } from './src/theme';
import { setLanguage } from './src/i18n';
import { isAuthScreen, resolveRoute, TAB_SCREENS, tabFor } from './src/navigation';
import { REMEMBERED_EMAIL_KEY, useAccount } from './src/state/useAccount';
import { preferences as storedPreferences } from './src/lib/secureStorage';
import { useErrands } from './src/state/useErrands';
import { usePreferences } from './src/state/usePreferences';
import { useRouter } from './src/state/useRouter';
import { useWithdrawalPin } from './src/state/useWithdrawalPin';

const TOAST_MS = 2200;
// Pal earnings are not connected to payments yet.
const EMPTY_WALLET = { available: 0, total: 0, withdrawn: 0 };

export default function App() {
  const { screen, screenRef, go } = useRouter('splash');
  const preferences = usePreferences();
  const [toast, setToast] = useState('');
  const activeScheme = useRef('light');
  const [selectedTransaction, setSelectedTransaction] = useState(null);

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
  const pin = useWithdrawalPin(account.authUserId, account.role);

  const chooseAuthIntent = (intent) => {
    account.setAuthIntent(intent);
    preferences.markOnboardingSeen();
    go('role');
  };

  // Everything a screen might need. Route files pick what they use.
  const context = {
    ...preferences,
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
  );
}
