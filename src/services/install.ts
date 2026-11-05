import { Platform } from 'react-native';

/**
 * Installing the web app to the phone's home screen / app drawer.
 *
 * Browsers differ completely here:
 * - Chrome, Edge and Samsung Internet (Android, desktop) fire
 *   `beforeinstallprompt`, which we hold on to so a button can open the real
 *   install dialog at any time, not only when the banner first shows.
 * - Safari on iPhone and iPad has no install API at all. The only way in is
 *   Share -> Add to Home Screen, so those players get the steps instead.
 * - Anything else gets the generic "browser menu -> Install app" steps.
 *
 * The event can fire before React mounts, so the listener is attached as soon
 * as this module loads.
 */

/** The `beforeinstallprompt` event, which isn't in the DOM lib's types. */
interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/** How this device can install the app, if at all. */
export type InstallMode = 'native' | 'installed' | 'prompt' | 'ios' | 'manual';

let deferred: InstallPromptEvent | null = null;
let installedNow = false;
const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) listener();
}

const IS_WEB = Platform.OS === 'web' && typeof window !== 'undefined';

if (IS_WEB) {
  window.addEventListener('beforeinstallprompt', (event) => {
    // Suppress Chrome's own mini-infobar; our pixel banner asks instead.
    event.preventDefault();
    deferred = event as InstallPromptEvent;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    installedNow = true;
    notify();
  });
}

function isStandalone(): boolean {
  if (!IS_WEB) return false;
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return iosStandalone || window.matchMedia?.('(display-mode: standalone)').matches === true;
}

/** iPhone, iPod, or an iPad (which reports itself as a Mac with touch). */
function isIos(): boolean {
  if (!IS_WEB) return false;
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

export function installMode(): InstallMode {
  if (!IS_WEB) return 'native';
  if (installedNow || isStandalone()) return 'installed';
  if (deferred) return 'prompt';
  if (isIos()) return 'ios';
  return 'manual';
}

export function subscribeInstall(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Opens the browser's install dialog. Resolves true if the player accepted. */
export async function promptInstall(): Promise<boolean> {
  const event = deferred;
  if (!event) return false;
  // The event can only be used once, whatever the outcome.
  deferred = null;
  notify();
  await event.prompt();
  const choice = await event.userChoice;
  return choice.outcome === 'accepted';
}
