import React, { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { supabase } from '../lib/supabase';

/** How many unread notifications the signed-in profile has; read by the bell badges. */
export const UnreadContext = React.createContext(0);

const REFRESH_MS = 30000;

export function useUnreadCount({ role, authUserId, screen }) {
  const [count, setCount] = useState(0);
  const signedIn = Boolean(role && authUserId && supabase);

  const refresh = useCallback(async () => {
    if (!signedIn) return;
    const { count: unread, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('role', role)
      .is('read_at', null);
    if (!error) setCount(unread || 0);
  }, [role, signedIn]);

  useEffect(() => {
    if (!signedIn) {
      setCount(0);
      return undefined;
    }
    refresh();
    const timer = setInterval(() => {
      if (AppState.currentState === 'active') refresh();
    }, REFRESH_MS);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => {
      clearInterval(timer);
      subscription.remove();
    };
  }, [signedIn, refresh]);

  // Re-check whenever the person moves to another screen (opening the bell marks them read).
  useEffect(() => {
    refresh();
  }, [screen, refresh]);

  return count;
}
