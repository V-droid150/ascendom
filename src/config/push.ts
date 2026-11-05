/**
 * Public half of the VAPID key pair the `send-reminders` Edge Function signs
 * pushes with. Public by design; the private half is a Supabase secret.
 */
export const VAPID_PUBLIC_KEY =
  process.env.EXPO_PUBLIC_VAPID_PUBLIC_KEY ??
  'BIROjLzfaNaDedpIbZxnqKF0iLQ04MG6Zx3YYhOtzF1-oo42G26qlMsn2_OORMCHWD3DWFOnXRedfV281HdW-Y4';
