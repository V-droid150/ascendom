/**
 * Account sign-in: Google, or email + password.
 *
 * Email sign-up does not send a confirmation email (turned off in Supabase),
 * so the only email the app ever triggers is a password reset. That keeps us
 * clear of the built-in mailer's tiny hourly quota.
 *
 * Google uses a full-page OAuth redirect, which only exists on the web; the
 * native build hides it until an in-app browser is added. Both redirect flows
 * (Google, password reset) come back with a PKCE `code` that the landing
 * route exchanges for a session.
 */

import { Platform } from 'react-native';
import { supabase } from './supabase';
import { storage } from './storage';
import { authErrorKey, type AuthErrorKey } from './authErrors';

export { authErrorKey, type AuthErrorKey };

export const GOOGLE_SUPPORTED = Platform.OS === 'web';
export const PASSWORD_MIN_LENGTH = 8;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Where a redirect sign-in should continue once it lands back in the app. */
const RETURN_KEY = 'ascendom:auth:return';
export type AuthReturn = 'title' | 'settings';

export type AuthResult =
  { ok: true; needsConfirmation?: boolean } | { ok: false; error: AuthErrorKey };

function webOrigin(): string | null {
  return Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.origin : null;
}

export async function signInWithGoogle(returnTo: AuthReturn): Promise<AuthResult> {
  const origin = webOrigin();
  if (!origin) return { ok: false, error: 'unknown' };

  await storage.setItem(RETURN_KEY, returnTo);
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: `${origin}/auth/callback` },
  });
  // On success the browser is already leaving for Google.
  return error ? { ok: false, error: authErrorKey(error) } : { ok: true };
}

/** Reads and clears where the last redirect sign-in asked to go back to. */
export async function takeAuthReturn(): Promise<AuthReturn> {
  const value = await storage.getItem(RETURN_KEY);
  await storage.removeItem(RETURN_KEY);
  return value === 'settings' ? 'settings' : 'title';
}

export async function signInWithPassword(email: string, password: string): Promise<AuthResult> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return error ? { ok: false, error: authErrorKey(error) } : { ok: true };
}

export async function signUpWithPassword(email: string, password: string): Promise<AuthResult> {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) return { ok: false, error: authErrorKey(error) };
  // Supabase answers a sign-up for an existing address with a user that has
  // no identities, rather than an error, to avoid leaking who has an account.
  if (data.user && data.user.identities?.length === 0)
    return { ok: false, error: 'alreadyRegistered' };
  // No session means email confirmation is still switched on in Supabase.
  return { ok: true, needsConfirmation: !data.session };
}

export async function sendPasswordReset(email: string): Promise<AuthResult> {
  const origin = webOrigin();
  const { error } = await supabase.auth.resetPasswordForEmail(
    email,
    origin ? { redirectTo: `${origin}/auth/reset` } : {},
  );
  return error ? { ok: false, error: authErrorKey(error) } : { ok: true };
}

export async function updatePassword(password: string): Promise<AuthResult> {
  const { error } = await supabase.auth.updateUser({ password });
  return error ? { ok: false, error: authErrorKey(error) } : { ok: true };
}
