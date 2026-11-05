/**
 * Generates the service worker for the exported web build.
 *
 * Run after `expo export -p web`, against the produced `dist/` directory.
 * Expo removed built-in PWA support, so this is the documented Workbox path.
 *
 * Usage: npm run build:web  (or `node ./scripts/build-sw.mjs` after an export)
 */

import { generateSW } from 'workbox-build';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');

if (!existsSync(dist)) {
  console.error('dist/ not found. Run `expo export -p web --output-dir dist` first.');
  process.exit(1);
}

const { count, size, warnings } = await generateSW({
  globDirectory: dist,
  // The app shell plus every asset needed to boot offline. Sprites are drawn
  // from code rather than loaded, so there is no image manifest to precache.
  globPatterns: ['**/*.{html,js,css,json,png,ico,ttf,woff,woff2}'],
  swDest: resolve(dist, 'sw.js'),

  // Push and notification-click handlers for Web Push reminders (public/push-sw.js).
  importScripts: ['/push-sw.js'],

  // Phases 1-4 are local-first: the app must work fully offline after one load,
  // so unmatched navigations fall back to the cached shell.
  navigateFallback: '/index.html',
  navigateFallbackDenylist: [/^\/api\//],

  // Without this a stale shell can pin users to an old build until every tab
  // is closed, which is the classic service-worker trap.
  skipWaiting: true,
  clientsClaim: true,
  cleanupOutdatedCaches: true,

  // Google Fonts are bundled by expo-font, but a cache-first rule keeps any
  // runtime-fetched font available offline too.
  runtimeCaching: [
    {
      urlPattern: /\.(?:ttf|otf|woff2?)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'ascendom-fonts',
        expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
      },
    },
  ],
});

for (const warning of warnings) {
  console.warn(warning);
}

console.log(
  `Service worker written: ${count} files precached, ${(size / 1024 / 1024).toFixed(2)} MB.`,
);
