/**
 * Public half of the VAPID key pair the `send-reminders` Edge Function signs
 * pushes with. Public by design; the private half is a Supabase secret.
 */
export const VAPID_PUBLIC_KEY =
  process.env.EXPO_PUBLIC_VAPID_PUBLIC_KEY ??
  'BI7Po8Mh2c2CO0lWfxJwoUVT1OmcaBah5UZ8SJk-pfV55B_W0tha3NJB-zUBlTBxuvbidcWw9U3u7FiVhtOmJXo';
