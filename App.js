import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BackHandler, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { PalGoBottomTabs, s } from './src/AppComponents';
import { resolveRoute, TAB_SCREENS, tabFor } from './src/navigation';
import { useAccount } from './src/state/useAccount';
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
    wallet: EMPTY_WALLET,
    selectedTransaction,
    setSelectedTransaction,
    activePal: errands.errand?.pal || {
      name: 'PalGo member',
      userId: errands.errand?.palUserId,
    },
  };
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
    <View style={s.safe}>
      <StatusBar style={preferences.effectiveScheme === 'dark' ? 'light' : 'dark'} />
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
