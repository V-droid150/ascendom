/**
 * Web Push reminders.
 *
 * A browser can't schedule a notification for 07:00 tomorrow, so on the web
 * the server sends reminders (`supabase/functions/send-reminders`). This module
 * only registers the browser: ask permission, subscribe through the service
 * worker, and hand the subscription to Supabase. The server needs the player's
 * save to know what is due, so reminders on the web require being signed in.
 *
 * iOS only delivers web pushes to an app installed on the home screen.
 */

import { Platform } from 'react-native';
import { VAPID_PUBLIC_KEY } from '@/config/push';
import { supabase } from './supabase';

export type WebPushOutcome = 'granted' | 'denied' | 'unsupported' | 'signedOut';

export function isWebPushSupported(): boolean {
  return (
    Platform.OS === 'web' &&
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

function keyBytes(base64url: string): Uint8Array<ArrayBuffer> {
  const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4));
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

async function register(subscription: PushSubscription): Promise<void> {
  const json = subscription.toJSON();
  const { error } = await supabase.rpc('register_push_subscription', {
    p_endpoint: subscription.endpoint,
    p_p256dh: json.keys?.p256dh ?? '',
    p_auth: json.keys?.auth ?? '',
  });
  if (error) throw error;
}

async function currentSubscription(): Promise<PushSubscription | null> {
  const registration = await navigator.serviceWorker.getRegistration();
  return registration ? registration.pushManager.getSubscription() : null;
}

/** Called when the player turns reminders on. Prompts for permission. */
export async function enableWebPush(): Promise<WebPushOutcome> {
  if (!isWebPushSupported()) return 'unsupported';

  const { data } = await supabase.auth.getSession();
  if (!data.session) return 'signedOut';

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return 'denied';

  try {
    // No worker in development (it is skipped on localhost) means no push.
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return 'unsupported';
    await navigator.serviceWorker.ready;

    const subscription =
      (await registration.pushManager.getSubscription()) ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: keyBytes(VAPID_PUBLIC_KEY),
      }));
    await register(subscription);
    return 'granted';
  } catch {
    return 'unsupported';
  }
}

/**
 * Re-sends this browser's subscription without prompting. Run on sign-in and
 * app start, because push services rotate endpoints and a browser that was
 * subscribed under another account has to move to this one.
 */
export async function refreshWebPush(): Promise<void> {
  if (!isWebPushSupported() || Notification.permission !== 'granted') return;
  const subscription = await currentSubscription();
  if (subscription) await register(subscription);
}

/** Called when reminders are turned off or the player signs out. */
export async function disableWebPush(): Promise<void> {
  if (!isWebPushSupported()) return;
  const subscription = await currentSubscription();
  if (!subscription) return;
  await supabase.rpc('unregister_push_subscription', { p_endpoint: subscription.endpoint });
  await subscription.unsubscribe();
}
