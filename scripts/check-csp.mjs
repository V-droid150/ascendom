/**
 * Verifies the Content-Security-Policy in vercel.json still allows every
 * inline <script> in the exported web build.
 *
 * The CSP allows inline scripts only by SHA-256 hash (no 'unsafe-inline').
 * Expo renders two of them into every page: the service-worker registration
 * from app/+html.tsx and expo-router's hydration flag. If either changes, the
 * old hash silently blocks it in production, so this runs as the last step of
 * `npm run build:web` and fails the build (and the Vercel deploy) instead.
 *
 * Usage: npm run build:web   (or `node ./scripts/check-csp.mjs` after one)
 *        node ./scripts/check-csp.mjs --print   prints the hashes to paste
 */

import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');

if (!existsSync(dist)) {
  console.error('dist/ not found. Run `npm run build:web` first.');
  process.exit(1);
}

function htmlFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return htmlFiles(path);
    return entry.name.endsWith('.html') ? [path] : [];
  });
}

const INLINE_SCRIPT = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g;

/** hash -> first file it was seen in */
const needed = new Map();
for (const file of htmlFiles(dist)) {
  for (const match of readFileSync(file, 'utf8').matchAll(INLINE_SCRIPT)) {
    if (match[1].length === 0) continue;
    const hash = `'sha256-${createHash('sha256').update(match[1]).digest('base64')}'`;
    if (!needed.has(hash)) needed.set(hash, relative(root, file));
  }
}

if (process.argv.includes('--print')) {
  console.log([...needed.keys()].join(' '));
  process.exit(0);
}

const config = JSON.parse(readFileSync(resolve(root, 'vercel.json'), 'utf8'));
const csp = config.headers
  .flatMap((rule) => rule.headers)
  .find((header) => header.key === 'Content-Security-Policy')?.value;

const scriptSrc = csp?.split(';').find((part) => part.trim().startsWith('script-src'));
if (!scriptSrc) {
  console.error('vercel.json has no Content-Security-Policy script-src directive.');
  process.exit(1);
}

const missing = [...needed].filter(([hash]) => !scriptSrc.includes(hash));
if (missing.length > 0) {
  console.error('CSP script-src in vercel.json is missing hashes for inline scripts:');
  for (const [hash, file] of missing) console.error(`  ${hash}  (first seen in ${file})`);
  console.error('Run `node ./scripts/check-csp.mjs --print` and update vercel.json.');
  process.exit(1);
}

console.log(`CSP ok: ${needed.size} inline script hash(es) allowed.`);
