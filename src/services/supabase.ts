/**
 * The Supabase client.
 *
 * Sessions are kept in the same storage the rest of the app uses
 * (localStorage on web, AsyncStorage on native), so a login survives restarts.
 * `detectSessionInUrl` is off: the magic-link landing route exchanges the code
 * itself (`app/auth/callback.tsx`), which keeps login out of every other route.
 */

import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '@/config/supabase';
import { storage } from './storage';

/** False during the static web export, where there is no browser to log in. */
const hasRuntime = Platform.OS !== 'web' || typeof window !== 'undefined';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: {
      getItem: (key) => storage.getItem(key),
      setItem: (key, value) => storage.setItem(key, value),
      removeItem: (key) => storage.removeItem(key),
    },
    flowType: 'pkce',
    persistSession: hasRuntime,
    autoRefreshToken: hasRuntime,
    detectSessionInUrl: false,
  },
});
