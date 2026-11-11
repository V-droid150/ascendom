/**
 * Login handoff (see migration 20261111000000_login_handoff.sql): the request
 * shape the redeem-login-handoff Edge Function accepts, and how each claim
 * status answers. Pure, shared with the app, and Jest-tested.
 */

export const HANDOFF_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
/** 32 random bytes as hex; its SHA-256 has the same shape. */
export const HANDOFF_SECRET_PATTERN = /^[0-9a-f]{64}$/;
export const HANDOFF_CODE_PATTERN = /^\d{6}$/;

export interface RedeemRequest {
  id: string;
  secret: string;
  code: string;
}

/** What the app is told when a claim fails; also the i18n key suffix. */
export type HandoffFailure = 'invalid' | 'not_found' | 'expired' | 'locked' | 'wrong_code';

/** Checks an untrusted request body. Returns null unless every field is well formed. */
export function parseRedeemRequest(body: unknown): RedeemRequest | null {
  if (typeof body !== 'object' || body === null) return null;
  const { id, secret, code } = body as Record<string, unknown>;
  if (typeof id !== 'string' || !HANDOFF_ID_PATTERN.test(id)) return null;
  if (typeof secret !== 'string' || !HANDOFF_SECRET_PATTERN.test(secret)) return null;
  if (typeof code !== 'string' || !HANDOFF_CODE_PATTERN.test(code)) return null;
  return { id, secret, code };
}

const FAILURE_STATUS: Record<HandoffFailure, number> = {
  invalid: 400,
  not_found: 404,
  expired: 410,
  locked: 429,
  wrong_code: 401,
};

/** HTTP status for a failed claim. */
export function failureStatus(failure: HandoffFailure): number {
  return FAILURE_STATUS[failure];
}

/** Reads a failure back out of the function's reply; anything unexpected is `invalid`. */
export function parseFailure(value: unknown): HandoffFailure {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(FAILURE_STATUS, value)
    ? (value as HandoffFailure)
    : 'invalid';
}
