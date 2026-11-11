/**
 * redeem-login-handoff: the last step of Google sign-in for the iPhone
 * home-screen app (see migration 20261111000000_login_handoff.sql).
 *
 * The app sends { id, secret, code }. `claim_login_handoff` checks all three
 * and marks the handoff used; on success this mints a one-time magic-link
 * token for that account (no email is sent) and returns its hash, which the
 * app trades for a session with `verifyOtp`.
 *
 * Deployed with `--no-verify-jwt`: the caller is not signed in yet. The
 * secret and code are the proof, and a handoff locks after five wrong codes.
 */

import { createClient } from 'npm:@supabase/supabase-js@2';
import {
  failureStatus,
  parseFailure,
  parseRedeemRequest,
  type HandoffFailure,
} from '../_shared/loginHandoff.ts';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function env(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing secret ${name}`);
  return value;
}

function reply(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

const fail = (failure: HandoffFailure): Response =>
  reply({ error: failure }, failureStatus(failure));

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: CORS_HEADERS });
  if (request.method !== 'POST') return reply({ error: 'method' }, 405);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail('invalid');
  }
  const input = parseRedeemRequest(body);
  if (!input) return fail('invalid');

  const db = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: claim, error: claimError } = await db.rpc('claim_login_handoff', {
    p_id: input.id,
    p_secret: input.secret,
    p_code: input.code,
  });
  if (claimError) {
    console.error('claim failed', claimError.message);
    return reply({ error: 'server' }, 500);
  }

  const { status, user_id: userId } = (claim ?? {}) as { status?: unknown; user_id?: unknown };
  if (status !== 'ok' || typeof userId !== 'string') return fail(parseFailure(status));

  const { data: found, error: userError } = await db.auth.admin.getUserById(userId);
  const email = found?.user?.email;
  if (userError || !email) {
    console.error('user lookup failed', userError?.message ?? 'no email');
    return reply({ error: 'server' }, 500);
  }

  const { data: link, error: linkError } = await db.auth.admin.generateLink({
    type: 'magiclink',
    email,
  });
  const tokenHash = link?.properties?.hashed_token;
  if (linkError || !tokenHash) {
    console.error('link failed', linkError?.message ?? 'no token');
    return reply({ error: 'server' }, 500);
  }

  return reply({ tokenHash });
});
