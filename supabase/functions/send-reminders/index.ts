/**
 * send-reminders: called by pg_cron every five minutes.
 *
 * For every player with at least one push subscription, reads their save and
 * time zone, asks `planReminders` what is due, claims each reminder in
 * `push_sent` (so overlapping runs can't double-send), and pushes it to every
 * browser they registered. Subscriptions the push service reports as gone are
 * deleted.
 *
 * Deployed with `--no-verify-jwt`; the caller proves itself with the
 * `x-cron-secret` header instead.
 */

import { createClient } from 'npm:@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';
import { planReminders, type SaveLike } from '../_shared/reminderPlan.ts';
import { copyFor } from '../_shared/reminderCopy.ts';
import { isAllowedPushEndpoint } from '../_shared/pushEndpoint.ts';

const SENT_RETENTION_DAYS = 7;
const PUSH_TTL_SECONDS = 60 * 60;

interface Subscription {
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

function env(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing secret ${name}`);
  return value;
}

/** Compares secrets by their SHA-256 digests, in constant time, so timing reveals nothing. */
async function sameSecret(given: string | null, expected: string): Promise<boolean> {
  if (given === null) return false;
  const digest = async (text: string): Promise<Uint8Array> =>
    new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)));
  const [a, b] = await Promise.all([digest(given), digest(expected)]);
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) diff |= a[i] ^ b[i];
  return diff === 0;
}

Deno.serve(async (request) => {
  if (!(await sameSecret(request.headers.get('x-cron-secret'), env('CRON_SECRET')))) {
    return new Response('Unauthorized', { status: 401 });
  }

  webpush.setVapidDetails(env('VAPID_SUBJECT'), env('VAPID_PUBLIC_KEY'), env('VAPID_PRIVATE_KEY'));
  const db = createClient(env('SUPABASE_URL'), env('SUPABASE_SERVICE_ROLE_KEY'), {
    auth: { persistSession: false },
  });

  const now = new Date();
  const stats = {
    players: 0,
    planned: 0,
    delivered: 0,
    expired: 0,
    failed: 0,
    rejected: 0,
    broken: 0,
  };

  const { data: subs, error: subsError } = await db
    .from('push_subscriptions')
    .select('user_id, endpoint, p256dh, auth');
  if (subsError) throw subsError;

  const byUser = new Map<string, Subscription[]>();
  for (const sub of (subs ?? []) as Subscription[]) {
    // Never POST to a URL that isn't a real push service (see pushEndpoint.ts).
    if (!isAllowedPushEndpoint(sub.endpoint)) {
      await db.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
      stats.rejected += 1;
      continue;
    }
    byUser.set(sub.user_id, [...(byUser.get(sub.user_id) ?? []), sub]);
  }
  const userIds = [...byUser.keys()];
  if (userIds.length === 0) return Response.json(stats);

  const [{ data: saves }, { data: profiles }, { data: sent }] = await Promise.all([
    db.from('game_saves').select('user_id, data').in('user_id', userIds),
    db.from('profiles').select('id, timezone').in('id', userIds),
    db
      .from('push_sent')
      .select('user_id, day_key, tag')
      .in('user_id', userIds)
      .gte('sent_at', new Date(now.getTime() - 2 * 86_400_000).toISOString()),
  ]);

  const zoneOf = new Map((profiles ?? []).map((p) => [p.id as string, p.timezone as string]));
  const sentOf = new Map<string, Set<string>>();
  for (const row of sent ?? []) {
    const set = sentOf.get(row.user_id) ?? new Set<string>();
    set.add(`${row.day_key}|${row.tag}`);
    sentOf.set(row.user_id, set);
  }

  for (const save of saves ?? []) {
    const userId = save.user_id as string;
    const data = save.data as SaveLike;
    stats.players += 1;

    // One player's broken save must not stop everyone else's reminders.
    let planned: ReturnType<typeof planReminders>;
    try {
      planned = planReminders({
        now,
        timeZone: zoneOf.get(userId) ?? 'UTC',
        save: data,
        copy: copyFor(data?.settings?.language),
        alreadySent: sentOf.get(userId) ?? new Set(),
      });
    } catch (error) {
      stats.broken += 1;
      console.error('could not plan reminders', userId, (error as Error).message);
      continue;
    }

    for (const push of planned) {
      // Claim first: if another run already inserted this row, skip it.
      const { data: claimed } = await db
        .from('push_sent')
        .upsert(
          { user_id: userId, day_key: push.dayKey, tag: push.tag },
          { onConflict: 'user_id,day_key,tag', ignoreDuplicates: true },
        )
        .select('tag');
      if (!claimed || claimed.length === 0) continue;
      stats.planned += 1;

      const payload = JSON.stringify({
        title: push.title,
        body: push.body,
        tag: `${push.dayKey}:${push.tag}`,
        url: '/',
      });

      for (const sub of byUser.get(userId) ?? []) {
        try {
          await webpush.sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            payload,
            { TTL: PUSH_TTL_SECONDS },
          );
          stats.delivered += 1;
        } catch (error) {
          const status = (error as { statusCode?: number }).statusCode;
          if (status === 404 || status === 410) {
            await db.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
            stats.expired += 1;
          } else {
            stats.failed += 1;
            console.error('push failed', status, (error as Error).message);
          }
        }
      }
    }
  }

  await db
    .from('push_sent')
    .delete()
    .lt('sent_at', new Date(now.getTime() - SENT_RETENTION_DAYS * 86_400_000).toISOString());

  return Response.json(stats);
});
