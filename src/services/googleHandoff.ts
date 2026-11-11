/**
 * Google sign-in for the app installed on an iPhone home screen, handed off
 * through Safari. The full design and threat model are in
 * supabase/migrations/20261111000000_login_handoff.sql.
 *
 *   App:    startHandoff() -> opens Safari on /auth/handoff?id=..&h=..
 *   Safari: signs in with Google, approveHandoff() -> shows a 6-digit code
 *   App:    redeemHandoff(code) -> session
 *
 * Only the secret's hash ever leaves the app before redeeming. The pending
 * handoff is kept in storage because iOS may close the app while the player
 * is in Safari.
 */

import { Platform } from 'react-native';
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '@/config/supabase';
import {
  HANDOFF_CODE_PATTERN,
  HANDOFF_ID_PATTERN,
  HANDOFF_SECRET_PATTERN,
  parseFailure,
  type HandoffFailure,
} from '../../supabase/functions/_shared/loginHandoff';
import { storage } from './storage';
import { supabase } from './supabase';
import type { AuthErrorKey } from './authErrors';

const PENDING_KEY = 'ascendom:handoff:pending';
/** sessionStorage: this Safari tab is approving a handoff, so it must not sync a save. */
const BROWSER_KEY = 'ascendom:handoff:browser';
/** Matches the 10-minute expiry in the migration. */
export const HANDOFF_TTL_MS = 10 * 60 * 1000;

export type HandoffReturn = 'title' | 'settings';

export interface PendingHandoff {
  id: string;
  secret: string;
  createdAt: number;
  returnTo: HandoffReturn;
}

export interface HandoffParams {
  id: string;
  secretHash: string;
}

export type HandoffErrorKey = AuthErrorKey | `handoff_${HandoffFailure}`;
export type HandoffResult = { ok: true } | { ok: false; error: HandoffErrorKey };

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function randomHex(byteCount: number): string {
  return toHex(crypto.getRandomValues(new Uint8Array(byteCount)));
}

export async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return toHex(new Uint8Array(digest));
}

/** A v4 UUID in lowercase, which is what the server's pattern expects. */
export function randomUuid(): string {
  return crypto.randomUUID().toLowerCase();
}

export function handoffUrl(origin: string, params: HandoffParams): string {
  return `${origin}/auth/handoff?id=${params.id}&h=${params.secretHash}`;
}

/** iOS 17+ opens `x-safari-https://` links in Safari itself, not the app's in-app sheet. */
export function safariUrl(url: string): string {
  return url.replace(/^https:\/\//, 'x-safari-https://');
}

/** Validates the query the Safari page was opened with. */
export function parseHandoffParams(id: unknown, secretHash: unknown): HandoffParams | null {
  if (typeof id !== 'string' || !HANDOFF_ID_PATTERN.test(id)) return null;
  if (typeof secretHash !== 'string' || !HANDOFF_SECRET_PATTERN.test(secretHash)) return null;
  return { id, secretHash };
}

/** Reads a stored pending handoff; anything malformed or expired is null. */
export function parsePending(raw: string | null, now: number): PendingHandoff | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<PendingHandoff>;
    if (
      typeof value.id !== 'string' ||
      !HANDOFF_ID_PATTERN.test(value.id) ||
      typeof value.secret !== 'string' ||
      !HANDOFF_SECRET_PATTERN.test(value.secret) ||
      typeof value.createdAt !== 'number' ||
      now - value.createdAt > HANDOFF_TTL_MS
    ) {
      return null;
    }
    return {
      id: value.id,
      secret: value.secret,
      createdAt: value.createdAt,
      returnTo: value.returnTo === 'settings' ? 'settings' : 'title',
    };
  } catch {
    return null;
  }
}

/** Just the digits, at most six, so pasted "123 456" or "123-456" still works. */
export function normalizeCode(input: string): string {
  return input.replace(/\D/g, '').slice(0, 6);
}

/**
 * Reuses a handoff started in the last ten minutes, so coming back to the app
 * (or iOS reloading it) keeps the same link the player already opened.
 */
export async function startHandoff(
  returnTo: HandoffReturn,
  now: number,
): Promise<{ pending: PendingHandoff; url: string } | null> {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;

  let pending = parsePending(await storage.getItem(PENDING_KEY), now);
  if (!pending) {
    pending = { id: randomUuid(), secret: randomHex(32), createdAt: now, returnTo };
    await storage.setItem(PENDING_KEY, JSON.stringify(pending));
  }
  const secretHash = await sha256Hex(pending.secret);
  return { pending, url: handoffUrl(window.location.origin, { id: pending.id, secretHash }) };
}

/** Throws the current handoff away so the next attempt starts fresh. */
export async function resetHandoff(): Promise<void> {
  await storage.removeItem(PENDING_KEY);
}

/** Safari side: files the handoff against the signed-in account and returns its code. */
export async function approveHandoff(
  params: HandoffParams,
): Promise<{ ok: true; code: string } | { ok: false; error: HandoffErrorKey }> {
  const { data, error } = await supabase.rpc('approve_login_handoff', {
    p_id: params.id,
    p_secret_hash: params.secretHash,
  });
  if (error) {
    const message = error.message.toLowerCase();
    if (message.includes('already used')) return { ok: false, error: 'handoff_expired' };
    if (message.includes('too many')) return { ok: false, error: 'rateLimited' };
    if (message.includes('fetch')) return { ok: false, error: 'network' };
    return { ok: false, error: 'unknown' };
  }
  if (typeof data !== 'string' || !HANDOFF_CODE_PATTERN.test(data)) {
    return { ok: false, error: 'unknown' };
  }
  return { ok: true, code: data };
}

/** App side: trades the code for a session. */
export async function redeemHandoff(code: string, now: number): Promise<HandoffResult> {
  const pending = parsePending(await storage.getItem(PENDING_KEY), now);
  if (!pending) return { ok: false, error: 'handoff_expired' };

  let response: Response;
  try {
    response = await fetch(`${SUPABASE_URL}/functions/v1/redeem-login-handoff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: SUPABASE_PUBLISHABLE_KEY },
      body: JSON.stringify({ id: pending.id, secret: pending.secret, code }),
    });
  } catch {
    return { ok: false, error: 'network' };
  }

  const body = (await response.json().catch(() => ({}))) as {
    tokenHash?: unknown;
    error?: unknown;
  };
  if (!response.ok || typeof body.tokenHash !== 'string') {
    if (response.status >= 500) return { ok: false, error: 'unknown' };
    const failure = parseFailure(body.error);
    // These can't get better by retrying the same handoff.
    if (failure === 'expired' || failure === 'locked') await resetHandoff();
    return { ok: false, error: `handoff_${failure}` };
  }

  const { error } = await supabase.auth.verifyOtp({
    token_hash: body.tokenHash,
    type: 'magiclink',
  });
  if (error) return { ok: false, error: 'unknown' };
  await resetHandoff();
  return { ok: true };
}

/** Where to go once the app is signed in. */
export async function pendingReturn(now: number): Promise<HandoffReturn> {
  return parsePending(await storage.getItem(PENDING_KEY), now)?.returnTo ?? 'title';
}

function sessionStore(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.sessionStorage : null;
  } catch {
    return null;
  }
}

/** Marks this tab as the Safari side of a handoff, for the trip to Google and back. */
export function markHandoffBrowser(params: HandoffParams): void {
  try {
    sessionStore()?.setItem(BROWSER_KEY, JSON.stringify(params));
  } catch {
    // Private mode can refuse storage; the URL still carries the params.
  }
}

/** The handoff this tab is approving, if any (survives the Google redirect). */
export function handoffBrowserParams(): HandoffParams | null {
  try {
    const raw = sessionStore()?.getItem(BROWSER_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<HandoffParams>;
    return parseHandoffParams(value.id, value.secretHash);
  } catch {
    return null;
  }
}

export function clearHandoffBrowser(): void {
  try {
    sessionStore()?.removeItem(BROWSER_KEY);
  } catch {
    // Nothing to clear.
  }
}

/**
 * True in a Safari tab that only signed in to approve a handoff. Cloud sync
 * stays off there: that tab's local save (often empty, or an old guest hero)
 * must never be uploaded over, or offered against, the player's real one.
 */
export function isHandoffBrowser(): boolean {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return false;
  const path = window.location?.pathname ?? '';
  return path.startsWith('/auth/handoff') || handoffBrowserParams() !== null;
}

const FRESH_KEY = 'ascendom:handoff:fresh';

/** Remembers that this tab signed in only for the handoff, so it signs out afterwards. */
export function noteFreshHandoffSignIn(): void {
  try {
    sessionStore()?.setItem(FRESH_KEY, '1');
  } catch {
    // Worst case the tab stays signed in, which is how Safari sign-in works anyway.
  }
}

/** Reads and clears the note above. */
export function takeFreshHandoffSignIn(): boolean {
  try {
    const fresh = sessionStore()?.getItem(FRESH_KEY) === '1';
    sessionStore()?.removeItem(FRESH_KEY);
    return fresh;
  } catch {
    return false;
  }
}
