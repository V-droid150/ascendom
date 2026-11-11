/** Supabase auth errors, translated into what we can tell a player. Pure, so it is tested directly. */

/** i18n key under `auth.errors`. */
export type AuthErrorKey =
  | 'invalidEmail'
  | 'weakPassword'
  | 'wrongCredentials'
  | 'alreadyRegistered'
  | 'emailNotConfirmed'
  | 'rateLimited'
  | 'network'
  | 'unknown';

interface ErrorLike {
  code?: string | undefined;
  status?: number | undefined;
  message?: string | undefined;
}

/** Turns a Supabase auth error into something we can say to a player. Pure; tested. */
export function authErrorKey(error: ErrorLike): AuthErrorKey {
  const code = error.code ?? '';
  const message = (error.message ?? '').toLowerCase();

  if (code === 'invalid_credentials' || message.includes('invalid login credentials')) {
    return 'wrongCredentials';
  }
  if (
    code === 'user_already_exists' ||
    code === 'email_exists' ||
    message.includes('already registered')
  ) {
    return 'alreadyRegistered';
  }
  if (code === 'email_not_confirmed' || message.includes('email not confirmed')) {
    return 'emailNotConfirmed';
  }
  if (code === 'weak_password' || message.includes('password should be')) return 'weakPassword';
  if (code === 'email_address_invalid' || code === 'validation_failed') return 'invalidEmail';
  if (error.status === 429 || code.startsWith('over_')) return 'rateLimited';
  if (message.includes('fetch') || message.includes('network')) return 'network';
  return 'unknown';
}
