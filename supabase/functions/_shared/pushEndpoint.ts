/**
 * Which push endpoints the server will POST to.
 *
 * A subscription's endpoint is a URL the browser hands us, but any signed-in
 * player can file one through `register_push_subscription`. Without a check,
 * the Edge Function would POST to whatever URL was filed, turning it into a
 * request relay (SSRF). Only the real browser push services are accepted.
 *
 * Pure and dependency-free so it runs in Deno and under Jest.
 */

/** Exact hosts, and host suffixes (leading dot) of the browser push services. */
const ALLOWED_HOSTS = [
  'fcm.googleapis.com', // Chrome, Edge on Android, Samsung Internet, Opera
  'updates.push.services.mozilla.com', // Firefox
  '.push.apple.com', // Safari, iOS home-screen apps
  '.notify.windows.com', // Edge on Windows
] as const;

export function isAllowedPushEndpoint(endpoint: unknown): boolean {
  if (typeof endpoint !== 'string' || endpoint.length > 2048) return false;

  let url: URL;
  try {
    url = new URL(endpoint);
  } catch {
    return false;
  }
  if (url.protocol !== 'https:' || url.port !== '' || url.username || url.password) return false;

  const host = url.hostname.toLowerCase();
  return ALLOWED_HOSTS.some((allowed) =>
    allowed.startsWith('.')
      ? host.endsWith(allowed) && host.length > allowed.length
      : host === allowed,
  );
}
