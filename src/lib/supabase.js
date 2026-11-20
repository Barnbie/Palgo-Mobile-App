import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { secureAuthStorage } from './secureStorage';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const supabase =
  supabaseUrl && supabasePublishableKey
    ? createClient(supabaseUrl, supabasePublishableKey, {
        auth: {
          storage: secureAuthStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      })
    : null;

export function requireClient() {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY to the project .env file, then restart Expo.',
    );
  }
  return supabase;
}

/** Turns "this login's account was deleted" into a message people can act on. */
export function explainMissingAuthUser(error) {
  const message = error?.message || '';
  if (/user from sub claim in jwt does not exist|user not found/i.test(message)) {
    return new Error(
      'This saved login belongs to an account that no longer exists. Please sign up again or log in with an active account.',
    );
  }
  return error;
}
