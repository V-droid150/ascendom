/**
 * Supabase project settings.
 *
 * Both values are public by design: the publishable key only grants what Row
 * Level Security allows, which is each player reading and writing their own
 * rows. They live in source so the static web build needs no extra setup;
 * EXPO_PUBLIC_* environment variables override them, e.g. for a staging
 * project. The secret key is never used by the app.
 */
export const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://uzlbqwncgptreitbtgwf.supabase.co';

export const SUPABASE_PUBLISHABLE_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  'sb_publishable_mSL_JcODn38eSp8bBP3nrQ_JaoUXE2q';
